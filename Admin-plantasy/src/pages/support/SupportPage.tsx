import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Clock, CheckCircle, Send } from 'lucide-react';
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
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        messages: doc.data().messages?.map((m: TicketMessage & { createdAt: Timestamp }) => ({
          ...m,
          createdAt: m.createdAt?.toDate ? m.createdAt.toDate() : m.createdAt,
        })) || [],
      })) as SupportTicket[];
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      const docRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(docRef, { 
        status,
        updatedAt: Timestamp.now(),
      });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !adminUser) return;
    
    try {
      const newMessage: Omit<TicketMessage, 'createdAt'> & { createdAt: Timestamp } = {
        id: `msg_${Date.now()}`,
        senderId: adminUser.uid,
        senderName: adminUser.displayName,
        isAdmin: true,
        message: replyMessage,
        createdAt: Timestamp.now(),
      };

      const docRef = doc(db, 'support_tickets', selectedTicket.id);
      await updateDoc(docRef, { 
        messages: arrayUnion(newMessage),
        status: 'in_progress',
        updatedAt: Timestamp.now(),
      });
      
      setReplyMessage('');
      fetchTickets();
      
      // Update local state
      const updatedMessages = [
        ...selectedTicket.messages,
        { ...newMessage, createdAt: new Date() as unknown as Date },
      ];
      setSelectedTicket({ 
        ...selectedTicket, 
        messages: updatedMessages,
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (ticket: SupportTicket) => (
        <div>
          <p className="font-medium">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground">{ticket.customerName}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (ticket: SupportTicket) => (
        <span className={`font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ticket: SupportTicket) => <StatusBadge status={ticket.status} />,
    },
    {
      key: 'messages',
      header: 'Messages',
      render: (ticket: SupportTicket) => (
        <span>{ticket.messages.length}</span>
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
            onClick={() => setSelectedTicket(ticket)}
            className="admin-btn-ghost p-2"
            title="View"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {ticket.status !== 'closed' && (
            <button
              onClick={() => handleStatusChange(ticket.id, 'closed')}
              className="admin-btn-ghost p-2 text-success"
              title="Close Ticket"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
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
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.status === 'open').length}
            </p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.status === 'in_progress').length}
            </p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Closed</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.status === 'closed').length}
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
            placeholder="Search tickets..."
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

      {/* Ticket Details Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject || 'Ticket Details'}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedTicket.customerName}</p>
                <p className="text-sm text-muted-foreground">{selectedTicket.customerEmail}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedTicket.status} />
                <p className={`text-sm mt-1 capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority} Priority
                </p>
              </div>
            </div>

            {/* Messages */}
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
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== 'closed' && (
              <div className="border-t border-border pt-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="admin-input flex-1"
                    placeholder="Type your reply..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim()}
                    className="admin-btn-primary disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-border">
              {selectedTicket.status !== 'closed' ? (
                <button
                  onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                  className="admin-btn-secondary"
                >
                  Close Ticket
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(selectedTicket.id, 'open')}
                  className="admin-btn-secondary"
                >
                  Reopen Ticket
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="admin-btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportPage;
