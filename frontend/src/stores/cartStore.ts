import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicProduct } from '../types';

export interface CartItem {
  product: PublicProduct;
  quantity: number;
  customName?: string;
  customPrice?: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  warrantyInfo: string;
  addItem: (product: PublicProduct) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (amount: number) => void;
  setPaymentMethod: (method: string) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setWarrantyInfo: (info: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      paymentMethod: 'CASH',
      customerName: '',
      customerPhone: '',
      warrantyInfo: '',

      addItem: (product: PublicProduct) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i,
          ),
        }));
      },

      setDiscount: (amount: number) => set({ discount: amount }),
      setPaymentMethod: (method: string) => set({ paymentMethod: method }),
      setCustomerInfo: (name: string, phone: string) =>
        set({ customerName: name, customerPhone: phone }),
      setWarrantyInfo: (info: string) => set({ warrantyInfo: info }),

      clearCart: () =>
        set({
          items: [],
          discount: 0,
          paymentMethod: 'CASH',
          customerName: '',
          customerPhone: '',
          warrantyInfo: '',
        }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.customPrice ?? i.product.price) * i.quantity,
          0,
        ),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return Math.max(0, subtotal - get().discount);
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + (i.customPrice ?? i.product.price) * i.quantity,
          0,
        ),
    }),
    {
      name: 'infinity-cart',
    },
  ),
);
