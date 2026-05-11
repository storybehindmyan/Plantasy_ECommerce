import React, { useState } from 'react';
import { toast } from 'sonner';
import { Send, Mail, Package, Truck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || '';

type EmailType = 'confirmed' | 'packed' | 'shipped' | 'delivered';

interface TestResult {
  type: EmailType;
  status: 'success' | 'error';
  message: string;
}

const EMAIL_TYPES: {
  type: EmailType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    type: 'confirmed',
    label: 'Order Confirmed',
    description: 'Sent after payment — "Your order has been placed"',
    icon: <Mail className="w-5 h-5" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    type: 'packed',
    label: 'Order Packed',
    description: 'Sent when admin confirms — includes waybill + tracking link',
    icon: <Package className="w-5 h-5" />,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    type: 'shipped',
    label: 'Order Shipped',
    description: 'Sent when Delhivery picks up — out for delivery',
    icon: <Truck className="w-5 h-5" />,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    type: 'delivered',
    label: 'Order Delivered',
    description: 'Sent on delivery — includes review link',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-green-50 border-green-200 text-green-700',
  },
];

export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<EmailType | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);

  const sendTest = async (type: EmailType) => {
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address first');
      return;
    }
    setLoading(type);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/api/email-test/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, email }),
      });

      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send');

      setResults((prev) => [
        { type, status: 'success', message: data.message || `Sent to ${email}` },
        ...prev.filter((r) => r.type !== type),
      ]);
      toast.success(`"${type}" email sent to ${email}`);
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      setResults((prev) => [
        { type, status: 'error', message: msg },
        ...prev.filter((r) => r.type !== type),
      ]);
      toast.error(`Failed: ${msg}`);
    } finally {
      setLoading(null);
    }
  };

  const sendAll = async () => {
    for (const { type } of EMAIL_TYPES) {
      await sendTest(type);
      await new Promise((r) => setTimeout(r, 700));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Email Test</h1>
        <p className="text-sm text-gray-500 mt-1">
          Send test emails to verify Resend is working. Check your inbox after each send.
        </p>
      </div>

      {/* Email input */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Send test emails to
        </label>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={sendAll}
            disabled={!!loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send All 4
          </button>
        </div>
      </div>

      {/* Individual buttons */}
      <div className="space-y-3">
        {EMAIL_TYPES.map(({ type, label, description, icon, color }) => {
          const result = results.find((r) => r.type === type);
          const isLoading = loading === type;

          return (
            <div
              key={type}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              <div className={`p-2.5 rounded-lg border ${color} flex-shrink-0`}>{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
                {result && (
                  <div
                    className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                      result.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="truncate">{result.message}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => sendTest(type)}
                disabled={!!loading}
                className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Send Test
              </button>
            </div>
          );
        })}
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700 mb-2">Debug Info</p>
        <p>API URL: <span className="font-mono text-gray-800">{API_URL || '(empty — same origin via Vite proxy)'}</span></p>
        <p>Endpoint: <span className="font-mono text-gray-800">POST /api/email-test/send</span></p>
        <p className="text-amber-600 font-medium mt-2">
          ⚠ If you get 401 — you are not logged in as admin. If you get 500 — check RESEND_API_KEY is set in functions env.
        </p>
      </div>
    </div>
  );
}
