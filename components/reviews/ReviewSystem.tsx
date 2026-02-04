'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, User, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { useReviews } from '@/hooks/useReviews';

interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewSystemProps {
  productId: string;
  productName: string;
  averageRating: number;
  reviewCount: number;
  reviews?: Review[];
  hasPurchased?: boolean;
}

export function ReviewSystem({ 
  productId, 
  productName, 
  averageRating, 
  reviewCount,
  reviews = [],
  hasPurchased = false 
}: ReviewSystemProps) {
  const { 
    getProductReviews, 
    addReview, 
    updateReview, 
    hasUserReviewed,
    averageRating: storeAverageRating
  } = useReviews();

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    content: ''
  });

  const productReviews = getProductReviews(productId);
  const displayReviews = reviews.length > 0 ? reviews : productReviews;
  const displayAverageRating = reviews.length > 0 ? averageRating : storeAverageRating(productId);
  const hasReviewed = hasUserReviewed(productId);

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star 
              className={`h-5 w-5 ${
                star <= rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.title.trim() || !reviewData.content.trim()) {
      alert('Please fill in all review fields');
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Simulate API call - in real app, this would call your review API
      const newReview: Review = {
        _id: Date.now().toString(),
        productId,
        userId: 'current-user', // Would come from session
        userName: 'Current User', // Would come from session
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        helpful: 0,
        notHelpful: 0,
        verified: hasPurchased,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addReview(newReview);
      setShowReviewForm(false);
      setReviewData({ rating: 5, title: '', content: '' });
      
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleHelpfulClick = (reviewId: string, helpful: boolean) => {
    // Simulate API call
    const review = displayReviews.find(r => r._id === reviewId);
    if (review) {
      const updates = helpful 
        ? { helpful: review.helpful + 1 }
        : { notHelpful: review.notHelpful + 1 };
      updateReview(reviewId, updates);
    }
  };

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {review.userAvatar ? (
              <img src={review.userAvatar} alt={review.userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-gray-600" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{review.userName}</h4>
              {review.verified && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Verified Purchase
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {renderStars(review.rating)}
              <span>•</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="font-medium text-lg">{review.title}</h5>
        <p className="text-gray-700 leading-relaxed">{review.content}</p>
      </div>

      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.images.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`Review image ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHelpfulClick(review._id, true)}
          className="text-gray-600 hover:text-green-600"
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Helpful ({review.helpful})
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHelpfulClick(review._id, false)}
          className="text-gray-600 hover:text-red-600"
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          Not Helpful ({review.notHelpful})
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-blue-600"
        >
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {displayAverageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(displayAverageRating))}
            </div>
            <p className="text-gray-600">
              Based on {displayReviews.length} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = displayReviews.filter(r => Math.round(r.rating) === rating).length;
              const percentage = displayReviews.length > 0 ? (count / displayReviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-yellow-400 h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write Review Button */}
        <div className="mt-6 text-center">
          {!hasReviewed ? (
            <Button size="lg" onClick={() => setShowReviewForm(true)}>
              Write a Review
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You have already reviewed this product.
              </p>
              <Button variant="outline" disabled>
                Review Submitted
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        
        {displayReviews.length > 0 ? (
          <div className="space-y-6">
            {displayReviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be first to review this product and share your experience!
            </p>
            <Button onClick={() => setShowReviewForm(true)}>
              Write First Review
            </Button>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Review {productName}</h2>
                <Button variant="ghost" onClick={() => setShowReviewForm(false)}>
                  X
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <Label>Rating</Label>
                <div className="flex justify-center mt-2">
                  {renderStars(reviewData.rating, true, (rating) => 
                    setReviewData(prev => ({ ...prev, rating }))
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reviewTitle">Review Title</Label>
                <Input
                  id="reviewTitle"
                  value={reviewData.title}
                  onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                />
              </div>

              <div>
                <Label htmlFor="reviewContent">Your Review</Label>
                <Textarea
                  id="reviewContent"
                  value={reviewData.content}
                  onChange={(e) => setReviewData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Tell us about your experience with this product..."
                  rows={5}
                />
              </div>

              {hasPurchased && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-green-800">
                      Your review will be marked as &quot;Verified Purchase&quot; since you bought this product.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewSubmit}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}