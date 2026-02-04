import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Review {
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

export interface ReviewStore {
  // State
  reviews: Review[];
  userReviews: Record<string, boolean>; // Track if user has reviewed a product
  
  // Actions
  setReviews: (productId: string, reviews: Review[]) => void;
  addReview: (review: Review) => void;
  updateReview: (reviewId: string, updates: Partial<Review>) => void;
  deleteReview: (reviewId: string) => void;
  markUserReviewed: (productId: string) => void;
  
  // Getters
  getProductReviews: (productId: string) => Review[];
  hasUserReviewed: (productId: string) => boolean;
  getAverageRating: (productId: string) => number;
  getRatingDistribution: (productId: string) => Record<number, number>;
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      userReviews: {},

      setReviews: (productId, reviews) => {
        const state = get();
        const filteredReviews = state.reviews.filter(r => r.productId !== productId);
        set({ reviews: [...filteredReviews, ...reviews] });
      },

      addReview: (review) => {
        const state = get();
        set({ 
          reviews: [...state.reviews, review],
          userReviews: { ...state.userReviews, [review.productId]: true }
        });
      },

      updateReview: (reviewId, updates) => {
        const state = get();
        const newReviews = state.reviews.map(review =>
          review._id === reviewId ? { ...review, ...updates } : review
        );
        set({ reviews: newReviews });
      },

      deleteReview: (reviewId) => {
        const state = get();
        const reviewToDelete = state.reviews.find(r => r._id === reviewId);
        const newReviews = state.reviews.filter(review => review._id !== reviewId);
        const newUserReviews = { ...state.userReviews };
        if (reviewToDelete) {
          delete newUserReviews[reviewToDelete.productId];
        }
        set({ 
          reviews: newReviews,
          userReviews: newUserReviews
        });
      },

      markUserReviewed: (productId) => {
        const state = get();
        set({ 
          userReviews: { ...state.userReviews, [productId]: true }
        });
      },

      getProductReviews: (productId) => {
        return get().reviews.filter(review => review.productId === productId);
      },

      hasUserReviewed: (productId) => {
        return get().userReviews[productId] || false;
      },

      getAverageRating: (productId) => {
        const reviews = get().getProductReviews(productId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
      },

      getRatingDistribution: (productId) => {
        const reviews = get().getProductReviews(productId);
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(review => {
          distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        });
        return distribution;
      },
    }),
    {
      name: 'review-storage',
      partialize: (state) => ({
        reviews: state.reviews,
        userReviews: state.userReviews,
      }),
    }
  )
);

// Hook for easier usage
export const useReviews = () => {
  const reviewStore = useReviewStore();
  
  return {
    ...reviewStore,
    // Convenience getters
    averageRating: (productId: string) => reviewStore.getAverageRating(productId),
    ratingDistribution: (productId: string) => reviewStore.getRatingDistribution(productId),
  };
};