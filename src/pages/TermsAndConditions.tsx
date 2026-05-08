import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const TermsAndConditions = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const ref = doc(db, 'settings', 'terms');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setContent(data.content || '');
          if (data.updatedAt?.seconds) {
            setLastUpdated(
              new Date(data.updatedAt.seconds * 1000).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })
            );
          }
        } else {
          setContent('<p>Terms and Conditions will be published soon.</p>');
        }
      } catch (err) {
        console.error('Failed to load terms:', err);
        setContent('<p>Unable to load Terms and Conditions. Please try again later.</p>');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6">
            Terms & Conditions
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Please read these terms carefully before using our services.
          </p>
          {lastUpdated && (
            <p className="text-gray-600 text-sm mt-4">Last updated: {lastUpdated}</p>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-shop-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-white
              prose-h2:text-3xl prose-h2:text-shop-terracotta prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:text-white prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-300 prose-p:font-light prose-p:leading-relaxed
              prose-li:text-gray-300 prose-li:font-light
              prose-strong:text-white
              prose-a:text-shop-terracotta hover:prose-a:text-white
              prose-hr:border-white/10"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
};

export default TermsAndConditions;
