import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  _id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  originalPrice: number;
  discount: number;
  averageRating: number;
  reviewCount: number;
  inStock: boolean;
  addedAt: Date;
}

export interface WishlistStore {
  items: WishlistItem[];
  
  // Actions
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  
  // Computed
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const state = get();
        const existingItem = state.items.find(i => i._id === item._id);

        if (!existingItem) {
          const newItems = [...state.items, { ...item, addedAt: new Date() }];
          set({ items: newItems });
        }
      },

      removeItem: (productId) => {
        const state = get();
        const newItems = state.items.filter(item => item._id !== productId);
        set({ items: newItems });
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      isInWishlist: (productId) => {
        return get().items.some(item => item._id === productId);
      },

      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

// Hook for easier usage
export const useWishlist = () => {
  const wishlist = useWishlistStore();
  
  return {
    ...wishlist,
    itemCount: wishlist.getItemCount(),
  };
};