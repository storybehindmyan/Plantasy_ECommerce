import React, { useState, useEffect } from 'react';
import { Search, Check, X, MessageSquare, Star } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Review, ReviewStatus } from '../../types';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    try {
      const docRef = doc(db, 'reviews', reviewId);
      await updateDoc(docRef, { status });
      fetchReviews();
      if (selectedReview?.id === reviewId) {
        setSelectedReview({ ...selectedReview, status });
      }
    } catch (error) {
      console.error('Error updating review status:', error);
    }
  };

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    
    try {
      const docRef = doc(db, 'reviews', selectedReview.id);
      await updateDoc(docRef, { adminReply: replyText });
      setReplyText('');
      fetchReviews();
      setSelectedReview({ ...selectedReview, adminReply: replyText });
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-warning text-warning' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter(review =>
    review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (review: Review) => (
        <div>
          <p className="font-medium">{review.productName}</p>
          <p className="text-xs text-muted-foreground">by {review.customerName}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (review: Review) => renderStars(review.rating),
    },
    {
      key: 'content',
      header: 'Review',
      render: (review: Review) => (
        <p className="line-clamp-2 max-w-xs">{review.content}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (review: Review) => <StatusBadge status={review.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (review: Review) => (
        <span className="text-muted-foreground text-sm">
          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (review: Review) => (
        <div className="flex items-center gap-2">
          {review.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(review.id, 'approved')}
                className="admin-btn-ghost p-2 text-success"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStatusChange(review.id, 'rejected')}
                className="admin-btn-ghost p-2 text-destructive"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => {
              setSelectedReview(review);
              setReplyText(review.adminReply || '');
            }}
            className="admin-btn-ghost p-2"
            title="Reply"
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
          <h1 className="page-title">Reviews</h1>
          <p className="page-subtitle">Manage customer reviews and ratings</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <DataTable
        columns={columns}
        data={filteredReviews}
        isLoading={isLoading}
        emptyMessage="No reviews found"
      />

      {/* Review Details Modal */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Review Details"
        size="lg"
      >
        {selectedReview && (
          <div className="space-y-6">
            {/* Review Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedReview.productName}</h3>
                <p className="text-sm text-muted-foreground">by {selectedReview.customerName}</p>
              </div>
              {renderStars(selectedReview.rating)}
            </div>

            {/* Review Content */}
            <div>
              <h4 className="font-medium mb-2">{selectedReview.title}</h4>
              <p className="text-muted-foreground">{selectedReview.content}</p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusBadge status={selectedReview.status} />
              {selectedReview.status === 'pending' && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleStatusChange(selectedReview.id, 'approved')}
                    className="admin-btn-primary py-1.5 px-3 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReview.id, 'rejected')}
                    className="admin-btn-danger py-1.5 px-3 text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* Admin Reply */}
            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3">Admin Reply</h4>
              {selectedReview.adminReply ? (
                <div className="p-3 bg-muted/30 rounded-lg mb-3">
                  <p className="text-sm">{selectedReview.adminReply}</p>
                </div>
              ) : null}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="admin-input min-h-[100px] resize-y"
                placeholder="Write a reply to this review..."
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="admin-btn-primary disabled:opacity-50"
                >
                  {selectedReview.adminReply ? 'Update Reply' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;
