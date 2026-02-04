import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  _id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  originalPrice: number;
  discount: number;
  variant: {
    _id: string;
    sku: string;
    name: string;
    attributes: Record<string, any>;
  };
  quantity: number;
  inStock: boolean;
  addedAt: Date;
}

export interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
  isOpen: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity' | 'addedAt'>) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (open: boolean) => void;
  
  // Computed
  getItemQuantity: (productId: string, variantId: string) => number;
  isInCart: (productId: string, variantId: string) => boolean;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalDiscount: () => number;
  
  // Helper methods
  getTotalItemsFromItems: (items: CartItem[]) => number;
  getTotalPriceFromItems: (items: CartItem[]) => number;
  getTotalDiscountFromItems: (items: CartItem[]) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      totalDiscount: 0,
      isOpen: false,

      addItem: (item) => {
        const state = get();
        const existingItemIndex = state.items.findIndex(
          (i) => i._id === item._id && i.variant._id === item.variant._id
        );

        let newItems;
        if (existingItemIndex > -1) {
          // Update quantity of existing item
          newItems = state.items.map((i, index) =>
            index === existingItemIndex
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          // Add new item
          newItems = [...state.items, { ...item, quantity: 1, addedAt: new Date() }];
        }

        const newState = { items: newItems };
        set({
          ...newState,
          totalItems: state.getTotalItemsFromItems(newItems),
          totalPrice: state.getTotalPriceFromItems(newItems),
          totalDiscount: state.getTotalDiscountFromItems(newItems),
        });
      },

      removeItem: (productId, variantId) => {
        const state = get();
        const newItems = state.items.filter(
          (i) => !(i._id === productId && i.variant._id === variantId)
        );

        set({
          items: newItems,
          totalItems: state.getTotalItemsFromItems(newItems),
          totalPrice: state.getTotalPriceFromItems(newItems),
          totalDiscount: state.getTotalDiscountFromItems(newItems),
        });
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        const state = get();
        const newItems = state.items.map((i) =>
          i._id === productId && i.variant._id === variantId
            ? { ...i, quantity }
            : i
        );

        set({
          items: newItems,
          totalItems: state.getTotalItemsFromItems(newItems),
          totalPrice: state.getTotalPriceFromItems(newItems),
          totalDiscount: state.getTotalDiscountFromItems(newItems),
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalDiscount: 0,
        });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      setIsOpen: (open) => {
        set({ isOpen: open });
      },

      getItemQuantity: (productId, variantId) => {
        const item = get().items.find(
          (i) => i._id === productId && i.variant._id === variantId
        );
        return item?.quantity || 0;
      },

      isInCart: (productId, variantId) => {
        return get().items.some(
          (i) => i._id === productId && i.variant._id === variantId
        );
      },

      getTotalItemsFromItems: (items: CartItem[]) => {
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPriceFromItems: (items: CartItem[]) => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotalDiscountFromItems: (items: CartItem[]) => {
        return items.reduce((total, item) => {
          const itemDiscount = (item.originalPrice - item.price) * item.quantity;
          return total + itemDiscount;
        }, 0);
      },

      getTotalItems: () => get().getTotalItemsFromItems(get().items),
      getTotalPrice: () => get().getTotalPriceFromItems(get().items),
      getTotalDiscount: () => get().getTotalDiscountFromItems(get().items),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        totalDiscount: state.totalDiscount,
      }),
    }
  )
);

// Hook for easier usage
export const useCart = () => {
  const cart = useCartStore();
  
  return {
    ...cart,
    // Convenience getters that update automatically
    totalItems: cart.getTotalItems(),
    totalPrice: cart.getTotalPrice(),
    totalDiscount: cart.getTotalDiscount(),
  };
};