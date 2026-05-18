/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { SupportTicket, TicketStatus, TicketMessage } from '../../types';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const SupportPage: React.FC = () => {
  const { adminUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reportMessage, setReportMessage] = useState('');
  const [statusSelect, setStatusSelect] = useState<TicketStatus>('PENDING');

  // email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'support'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ticketsData = snapshot.docs.map((snap) => {
        const data = snap.data() as any;
        const ticket: SupportTicket = {
          id: snap.id,
          Id: data.Id || '',
          ticketId: data.ticketId || '',
          uid: data.uid || '',
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          subject: data.subject || '',
          message: data.message || '',
          report: data.report || '',
          status: (data.status as TicketStatus) || 'PENDING',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate() : undefined,
          messages: (data.messages || []).map((m: any) => ({
            id: m.id || '',
            senderId: m.senderId || '',
            senderName: m.senderName || '',
            isAdmin: m.isAdmin || false,
            message: m.message || '',
            createdAt: m.createdAt?.toDate ? m.createdAt.toDate() : new Date(),
          })) as TicketMessage[],
        };
        return ticket;
      });
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      const docRef = doc(db, 'support', ticketId);
      await updateDoc(docRef, { 
        status,
        updatedAt: Timestamp.now(),
      });
      setTickets(prev =>
        prev.map(t => t.id === ticketId ? { ...t, status } : t)
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
        setStatusSelect(status);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleToggleActive = async (ticket: SupportTicket) => {
    try {
      const docRef = doc(db, 'support', ticket.id);
      const newActive = !ticket.isActive;
      await updateDoc(docRef, {
        isActive: newActive,
        updatedAt: Timestamp.now(),
      });
      setTickets(prev =>
        prev.map(t => t.id === ticket.id ? { ...t, isActive: newActive } : t)
      );
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket({ ...selectedTicket, isActive: newActive });
      }
    } catch (error) {
      console.error('Error toggling active state:', error);
    }
  };

  const handleSaveReportAndStatus = async () => {
    if (!selectedTicket) return;
    if (!reportMessage.trim()) {
      alert('Report is required.');
      return;
    }
    try {
      const docRef = doc(db, 'support', selectedTicket.id);
      await updateDoc(docRef, {
        report: reportMessage.trim(),
        status: statusSelect,
        updatedAt: Timestamp.now(),
      });

      const updatedTicket: SupportTicket = {
        ...selectedTicket,
        report: reportMessage.trim(),
        status: statusSelect,
      };

      setSelectedTicket(updatedTicket);
      setTickets(prev =>
        prev.map(t => t.id === selectedTicket.id ? updatedTicket : t)
      );
    } catch (error) {
      console.error('Error updating report/status:', error);
    }
  };

  const getStatusBadgeClasses = (status: TicketStatus) => {
    // simple Tailwind-like classes for badge background + text
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const fullName = `${ticket.firstName} ${ticket.lastName}`.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fullName.includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.Id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const openEmailModal = (ticket: SupportTicket) => {
    if (!adminUser) return;

    const baseSubject = `Re: ${ticket.subject} (Ticket #${ticket.ticketId})`;
    const baseBody =
      `Hi ${ticket.firstName},\n\n` +
      `Thank you for reaching out regarding your order.\n\n` +
      `Your message:\n` +
      `"${ticket.message}"\n\n` +
      `Current status: ${ticket.status}.\n\n` +
      `Please let us know if you have any additional details to share so we can assist you better.\n\n` +
      `Best regards,\n` +
      `${adminUser.displayName || 'Support Team'}`;

    setSelectedTicket(ticket);
    setEmailSubject(baseSubject);
    setEmailBody(baseBody);
    setIsEmailModalOpen(true);
  };

  // This function must call your backend or third‑party email API
const sendSupportEmail = async (to: string, subject: string, body: string) => {
  const res = await fetch('/api/send-support-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body }),
  });

  if (!res.ok) {
    throw new Error('Failed to send email');
  }
};





  const handleEmailSend = async () => {
    if (!selectedTicket) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Subject and body are required.');
      return;
    }
    try {
      setIsSendingEmail(true);
      await sendSupportEmail(selectedTicket.email, emailSubject.trim(), emailBody.trim());

      // Optionally log email as an admin message in Firestore
      if (adminUser) {
        const newMessage: Omit<TicketMessage, 'createdAt'> & { createdAt: Timestamp } = {
          id: `msg_email_${Date.now()}`,
          senderId: adminUser.uid,
          senderName: adminUser.displayName || 'Admin',
          isAdmin: true,
          message: `Email sent to customer:\n\nSubject: ${emailSubject.trim()}\n\n${emailBody.trim()}`,
          createdAt: Timestamp.now(),
        };
        const docRef = doc(db, 'support', selectedTicket.id);
        await updateDoc(docRef, {
          messages: arrayUnion(newMessage),
          updatedAt: Timestamp.now(),
        });
        const updatedMessages = [
          ...selectedTicket.messages,
          { ...newMessage, createdAt: new Date() as unknown as Date },
        ];
        const updatedTicket: SupportTicket = {
          ...selectedTicket,
          messages: updatedMessages,
        };
        setSelectedTicket(updatedTicket);
        setTickets(prev =>
          prev.map(t => t.id === selectedTicket.id ? updatedTicket : t)
        );
      }

      setIsEmailModalOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Check console for details.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCallClick = (ticket: SupportTicket) => {
    if (!ticket.phone) return;
    window.location.href = `tel:${ticket.phone}`;
  };

  const columns = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (ticket: SupportTicket) => (
        <div>
          <p className="font-medium">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground">
            {ticket.firstName} {ticket.lastName} • #{ticket.ticketId}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ticket: SupportTicket) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(
            ticket.status
          )}`}
        >
          {ticket.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active',
      render: (ticket: SupportTicket) => (
        <button
          onClick={() => handleToggleActive(ticket)}
          className="admin-btn-ghost p-1"
          title={ticket.isActive ? 'Set inactive' : 'Set active'}
        >
          {ticket.isActive ? (
            <Eye className="w-4 h-4 text-success" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (ticket: SupportTicket) => (
        <span className="text-muted-foreground text-sm">
          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ticket: SupportTicket) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEmailModal(ticket)}
            className="admin-btn-ghost p-2"
            title="Email"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCallClick(ticket)}
            className="admin-btn-ghost p-2"
            title="Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedTicket(ticket);
              setReportMessage(ticket.report || '');
              setStatusSelect(ticket.status);
            }}
            className="admin-btn-ghost p-2"
            title="Open ticket"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Manage customer support tickets</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="admin-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.status === 'PENDING').length}
            </p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.status === 'IN_PROGRESS').length}
            </p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Closed / Resolved</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, ticket id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <DataTable
        columns={columns}
        data={filteredTickets}
        isLoading={isLoading}
        emptyMessage="No support tickets found"
      />

      {/* Ticket Details Modal (Report + Status only, no reply input) */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={
          selectedTicket
            ? `${selectedTicket.subject} (#${selectedTicket.ticketId})`
            : 'Ticket Details'
        }
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {selectedTicket.firstName} {selectedTicket.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedTicket.email}</p>
                <p className="text-sm text-muted-foreground">{selectedTicket.phone}</p>
                <p className="text-xs text-muted-foreground">
                  UID: {selectedTicket.uid}
                </p>
                <p className="text-xs text-muted-foreground">
                  Internal ID: {selectedTicket.Id} • Ticket ID: {selectedTicket.ticketId}
                </p>
              </div>
              <div className="text-right space-y-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(
                    selectedTicket.status
                  )}`}
                >
                  {selectedTicket.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => handleToggleActive(selectedTicket)}
                  className="admin-btn-ghost flex items-center gap-1 text-xs ml-auto"
                >
                  {selectedTicket.isActive ? (
                    <>
                      <Eye className="w-3 h-3" /> Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" /> Inactive
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* User Original Message */}
            <div className="p-4 border border-border rounded-lg space-y-2">
              <p className="text-sm font-medium">Customer Message</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {selectedTicket.message}
              </p>
            </div>

            {/* Admin Report + Status */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Admin Report / Notes <span className="text-red-500">*</span>
              </p>
              <textarea
                className="admin-input w-full min-h-[80px] resize-y"
                placeholder="Add a report or internal note about this ticket (required)..."
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="admin-input w-48"
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value as TicketStatus)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            {/* Messages history (read‑only) */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {selectedTicket.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.isAdmin 
                      ? 'bg-primary/10 ml-8' 
                      : 'bg-muted/30 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {msg.senderName} {msg.isAdmin && '(Admin)'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.createdAt ? new Date(msg.createdAt as any).toLocaleString() : '-'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Actions: Cancel + Save side by side */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setSelectedTicket(null)}
                className="admin-btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReportAndStatus}
                className="admin-btn-primary"
              >
                Save Report
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Email Template Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Send Email to Customer"
        size="md"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">To</p>
              <p className="text-sm font-medium">{selectedTicket.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <input
                className="admin-input w-full"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Body</label>
              <textarea
                className="admin-input w-full min-h-[160px] resize-y"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your email content here..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="admin-btn-outline"
                disabled={isSendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSend}
                className="admin-btn-primary"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportPage;
