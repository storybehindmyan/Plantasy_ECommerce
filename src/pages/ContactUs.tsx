/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

type SupportStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED";

type SupportSubject =
  | "Order Inquiry"
  | "Plant Care Question"
  | "Business Partnership"
  | "Other";

interface SupportTicket {
  createdAt: any;
  updatedAt: any;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastSeen: any;
  message: string;
  phone: string;
  status: SupportStatus;
  subject: SupportSubject;
  ticketId: string;
  uid: string;
  orderId?: string;
  report?: string;
}

const ContactUs = () => {
  const [mode, setMode] = useState<"raise" | "check">("raise");

  // Raise ticket form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<SupportSubject>("Order Inquiry");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  // Copy status state (used for both raised and searched ticket modals)
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Check ticket state
  const [searchTicketId, setSearchTicketId] = useState("");
  const [searchResult, setSearchResult] = useState<SupportTicket | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [modalMode, setModalMode] = useState<"raised" | "searched">("raised");

  // Simple placeholder for auth uid
  const currentUid = "ANONYMOUS_USER";

  const generateSixDigitTicketId = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return num.toString();
  };

  const buildSupportDocId = (ticketId: string) => {
    return `SUP000${ticketId}`;
  };

  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedTicketId(null);
    setCreatedDocId(null);
    setCopyStatus(null);

    try {
      const ticketId = generateSixDigitTicketId();
      const docId = buildSupportDocId(ticketId);

      const supportRef = doc(collection(db, "support"), docId);

      const payload: SupportTicket = {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        email,
        firstName,
        lastName,
        isActive: true,
        lastSeen: serverTimestamp(),
        message,
        phone,
        status: "PENDING",
        subject,
        ticketId,
        uid: currentUid,
        ...(subject === "Order Inquiry" && orderId ? { orderId } : {}),
      };

      await setDoc(supportRef, payload); // write doc with custom id [web:1][web:5]

      setCreatedTicketId(ticketId);
      setCreatedDocId(docId);

      // Reset form minimal
      setFirstName("");
      setLastName("");
      setPhone("");
      setSubject("Order Inquiry");
      setMessage("");
      setOrderId("");

      // Show modal in "raised" mode
      setModalMode("raised");
      setShowTicketModal(true);
    } catch (error) {
      console.error("Error creating support ticket", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicketId = async (ticketId: string) => {
    if (!ticketId) return;
    try {
      await navigator.clipboard.writeText(ticketId); // Clipboard API [web:27][web:29]
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleSearchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);
    setSearchError(null);
    setCopyStatus(null);

    try {
      if (!searchTicketId || searchTicketId.length !== 6) {
        setSearchError("Please enter a valid 6-digit ticket ID.");
        return;
      }

      const docId = buildSupportDocId(searchTicketId);
      const supportRef = doc(collection(db, "support"), docId);
      const snapshot = await getDoc(supportRef);

      if (!snapshot.exists()) {
        setSearchError("No ticket found with this ID.");
        return;
      }

      const data = snapshot.data() as SupportTicket;
      setSearchResult(data);

      setModalMode("searched");
      setShowTicketModal(true);
    } catch (error) {
      console.error("Error searching ticket", error);
      setSearchError("Something went wrong while searching. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const formatStatusLabel = (status: SupportStatus) => {
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "PENDING") return "Pending";
    if (status === "RESOLVED") return "Resolved";
    return status;
  };

  const statusBadgeClass = (status: SupportStatus) => {
    if (status === "PENDING") {
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40";
    }
    if (status === "IN_PROGRESS") {
      return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
    }
    if (status === "RESOLVED") {
      return "bg-green-500/20 text-green-300 border border-green-500/40";
    }
    return "bg-gray-500/20 text-gray-300 border border-gray-500/40";
  };

  const activeBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
      : "bg-red-500/20 text-red-300 border border-red-500/40";
  };

  const activeLabel = (isActive: boolean) => (isActive ? "Active" : "Inactive");

  const formatDate = (value: any) => {
    if (!value) return "-";
    if (value.toDate) {
      const d = value.toDate() as Date;
      return d.toLocaleString();
    }
    return new Date(value).toLocaleString();
  };

  // Ticket modal content (used for both raised + searched)
  const renderTicketModalContent = () => {
    if (modalMode === "raised" && createdTicketId) {
      return (
        <>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-serif text-white mb-1">
                Ticket Created
              </h3>
              <p className="text-xs text-gray-400">
                Please save your ticket ID for future reference.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <span className="text-gray-400">Ticket ID:</span>{" "}
              <span className="font-mono text-white">{createdTicketId}</span>
            </p>
            {createdDocId && (
              <p className="text-xs text-gray-500">
                Reference ID: {createdDocId}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleCopyTicketId(createdTicketId)}
              className="mt-2 px-3 py-2 bg-accent/80 hover:bg-accent text-white rounded-sm text-xs uppercase tracking-widest"
            >
              {copyStatus || "Copy Ticket ID"}
            </button>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div>
              <h3 className="text-xl font-serif text-green-400 mb-1">
                Thankyou,
              </h3>
              <p className="text-xs text-gray-400">
                Our support team will get back to you shortly.
              </p>
            </div>
          </div>
        </>
      );
    }

    if (modalMode === "searched" && searchResult) {
      const ticketId = searchResult.ticketId;
      const showDetailsForNonPending = searchResult.status !== "PENDING";

      return (
        <>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-serif text-white mb-1">
                Ticket #{ticketId}
              </h3>
              <p className="text-xs text-gray-400">
                Created: {formatDate(searchResult.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                  searchResult.status,
                )}`}
              >
                {formatStatusLabel(searchResult.status)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${activeBadgeClass(
                  searchResult.isActive,
                )}`}
              >
                {activeLabel(searchResult.isActive)}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <span className="text-gray-400">Subject:</span>{" "}
              <span className="text-white">{searchResult.subject}</span>
            </p>
            {searchResult.orderId && (
              <p>
                <span className="text-gray-400">Order ID:</span>{" "}
                <span className="text-white">{searchResult.orderId}</span>
              </p>
            )}

            <div className="mt-2">
              <p className="text-gray-400 mb-1">Message:</p>
              <p className="text-white whitespace-pre-wrap">
                {searchResult.message}
              </p>
            </div>

            {showDetailsForNonPending && (
              <>
                {searchResult.report && (
                  <div className="mt-3">
                    <p className="text-gray-400 mb-1">Report:</p>
                    <p className="whitespace-pre-wrap bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 px-3 py-2 rounded-md">
                      {searchResult.report}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-400">
                  Last seen:{" "}
                  <span className="text-white">
                    {formatDate(searchResult.updatedAt)}
                  </span>
                </p>
              </>
            )}

            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">
                Ticket ID (tap to copy):
              </p>
              <button
                type="button"
                onClick={() => handleCopyTicketId(ticketId)}
                className="px-3 py-2 bg-accent/80 hover:bg-accent text-white rounded-sm text-xs uppercase tracking-widest font-mono"
              >
                {ticketId}
              </button>
              {copyStatus && (
                <span className="ml-2 text-xs text-gray-300">{copyStatus}</span>
              )}
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-40 pb-20 relative">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6">
            Get in Touch
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Have a question about a plant? Need help with an order? We&apos;re
            here to help you grow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-serif text-accent mb-8">
                Contact Information
              </h2>
              <div className="space-y-8 text-gray-300 font-light">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-full text-accent">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Visit Us</h3>
                    <p>123 Green Street, Plant District</p>
                    <p>Mumbai, Maharashtra 400001</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-full text-accent">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Email Us</h3>
                    <p>support@plantasy.com</p>
                    <p>wholesale@plantasy.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-full text-accent">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Call Us</h3>
                    <p>+91 98765 43210</p>
                    <p>Mon - Fri, 9am - 6pm</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 rounded-sm border border-white/10">
              <h3 className="text-xl font-serif text-white mb-4">FAQ</h3>
              <p className="text-gray-400 font-light mb-4">
                Find instant answers to common questions about shipping,
                tracking, and plant care in our FAQ section.
              </p>
              <a
                href="/care"
                className="text-accent hover:underline text-sm uppercase tracking-widest"
              >
                Visit Help Center
              </a>
            </div>
          </div>

          {/* Right side: toggle Raise / Check */}
          <div className="bg-white/5 p-8 md:p-10 rounded-sm border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-serif text-white">
                {mode === "raise" ? "Raise a Ticket" : "Check Ticket Status"}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setMode((prev) => (prev === "raise" ? "check" : "raise"))
                }
                className="text-xs uppercase tracking-widest text-accent border border-accent px-3 py-2 rounded-sm hover:bg-accent/10"
              >
                {mode === "raise"
                  ? "Check Existing Ticket"
                  : "Raise New Ticket"}
              </button>
            </div>

            {mode === "raise" ? (
              <>
                <form className="space-y-6" onSubmit={handleRaiseSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Subject
                    </label>
                    <select
                      className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                      value={subject}
                      onChange={(e) =>
                        setSubject(e.target.value as SupportSubject)
                      }
                    >
                      <option>Order Inquiry</option>
                      <option>Plant Care Question</option>
                      <option>Business Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {subject === "Order Inquiry" && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Order ID
                      </label>
                      <input
                        type="text"
                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                        placeholder="Enter your Order ID"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors resize-none"
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-4 rounded-sm transition-colors uppercase tracking-widest text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Ticket"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <form className="space-y-6" onSubmit={handleSearchTicket}>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Enter 6-digit Ticket ID
                    </label>
                    <input
                      type="text"
                      className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g. 654321"
                      maxLength={6}
                      value={searchTicketId}
                      onChange={(e) => setSearchTicketId(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-4 rounded-sm transition-colors uppercase tracking-widest text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Searching..." : "Search Ticket"}
                  </button>
                </form>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setMode("raise")}
                    className="text-xs uppercase tracking-widest text-accent underline"
                  >
                    Raise a new ticket instead
                  </button>
                </div>

                {searchError && (
                  <p className="mt-4 text-sm text-red-400">{searchError}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket info modal with blurred background */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50">
          <div className="bg-neutral-900 border border-white/10 rounded-lg max-w-lg w-full mx-4 p-6 shadow-2xl">
            {renderTicketModalContent()}

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="px-4 py-2 text-sm rounded-sm border border-white/20 text-gray-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
