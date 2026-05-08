import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { toast } from 'sonner';
import { Save, Eye, FileText, Loader2 } from 'lucide-react';

const DEFAULT_CONTENT = `<h2>1. Acceptance of Terms</h2>
<p>By accessing and using the Plantasy website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>

<h2>2. Products and Orders</h2>
<p>All products displayed on Plantasy are subject to availability. We reserve the right to discontinue any product at any time. Prices are subject to change without notice.</p>

<h2>3. Payment</h2>
<p>We accept payments via Razorpay. All transactions are secured with industry-standard encryption. By completing a purchase, you confirm that you are authorized to use the payment method provided.</p>

<h2>4. Shipping and Delivery</h2>
<p>We ship across India via Delhivery. Delivery timelines are estimates and may vary based on your location. We are not responsible for delays caused by courier partners or unforeseen circumstances.</p>

<h2>5. Returns and Refunds</h2>
<p>We offer a 7-day return policy for damaged or incorrect items. To initiate a return, please contact our support team with your order ID and photos of the item. Refunds will be processed within 7-10 business days.</p>

<h2>6. Privacy</h2>
<p>We collect and process your personal data to fulfill orders and improve our services. Your data will never be sold to third parties. Please refer to our Privacy Policy for full details.</p>

<h2>7. Limitation of Liability</h2>
<p>Plantasy shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>

<h2>8. Contact Us</h2>
<p>For any questions regarding these Terms and Conditions, please reach out at <strong>support@plantasy.co.in</strong>.</p>`;

const TermsPage: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const ref = doc(db, 'settings', 'terms');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setContent(data.content || DEFAULT_CONTENT);
          if (data.updatedAt?.seconds) {
            setLastUpdated(
              new Date(data.updatedAt.seconds * 1000).toLocaleString('en-IN')
            );
          }
        } else {
          setContent(DEFAULT_CONTENT);
        }
      } catch (err) {
        console.error('Failed to load terms:', err);
        toast.error('Failed to load Terms & Conditions');
        setContent(DEFAULT_CONTENT);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'terms'), {
        content,
        updatedAt: serverTimestamp(),
      });
      setLastUpdated(new Date().toLocaleString('en-IN'));
      toast.success('Terms & Conditions saved successfully');
    } catch (err) {
      console.error('Failed to save terms:', err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Terms &amp; Conditions</h1>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">Last saved: {lastUpdated}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {preview ? (
          <div className="p-8">
            <div className="mb-4 pb-4 border-b border-border">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Preview — as seen by users</span>
            </div>
            <div
              className="prose max-w-none
                prose-headings:font-serif
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-li:text-muted-foreground
                prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
              <span>Write HTML content below. Use</span>
              <code className="bg-muted px-1 rounded">&lt;h2&gt;</code>
              <span>for section headings,</span>
              <code className="bg-muted px-1 rounded">&lt;p&gt;</code>
              <span>for paragraphs,</span>
              <code className="bg-muted px-1 rounded">&lt;ul&gt;&lt;li&gt;</code>
              <span>for lists.</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={30}
              spellCheck={false}
              className="w-full font-mono text-sm bg-muted/30 border border-border rounded-lg p-4 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="Enter HTML content for Terms & Conditions..."
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Changes are published immediately to the public-facing Terms &amp; Conditions page at{' '}
        <code className="bg-muted px-1 rounded">/terms-and-conditions</code>.
      </p>
    </div>
  );
};

export default TermsPage;
