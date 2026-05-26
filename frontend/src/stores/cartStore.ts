import { create } from 'zustand';
import type { Product } from '../types';

export interface CartItem {
  product: Product;
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
  
  addItem: (product: Product) => void;
  addCustomItem: (name: string, price: number) => void;
  removeItem: (productId: number, customIdx?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: string) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setWarrantyInfo: (info: string) => void;
  clearCart: () => void;
  
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'CASH',
  customerName: '',
  customerPhone: '',
  warrantyInfo: '',
  
  addItem: (product: Product) => {
    const { items } = get();
    const existing = items.find(item => item.product.id === product.id);
    
    if (existing) {
      if (existing.quantity >= product.stock) return;
      set({
        items: items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      if (product.stock <= 0) return;
      set({ items: [...items, { product, quantity: 1 }] });
    }
  },
  
  addCustomItem: (name: string, price: number) => {
    const { items } = get();
    const idx = items.findIndex(i => i.customName === name);
    if (idx >= 0) {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + 1 };
      set({ items: newItems });
    } else {
      // Create a minimal fake product for type compat
      const fakeProduct: Product = {
        id: -Date.now(), // unique negative id
        uuid: '', name, sku: '',
        category_id: 0, price, cost: 0,
        stock: 9999, low_stock_limit: 0,
        created_at: ''
      };
      set({ items: [...items, { product: fakeProduct, quantity: 1, customName: name, customPrice: price }] });
    }
  },
  
  removeItem: (productId: number) => {
    set({ items: get().items.filter(item => item.product.id !== productId) });
  },
  
  updateQuantity: (productId: number, quantity: number) => {
    const { items } = get();
    const item = items.find(i => i.product.id === productId);
    if (!item) return;
    
    const maxStock = item.customName ? 9999 : item.product.stock;
    const targetQty = Math.max(1, Math.min(quantity, maxStock));
    
    set({
      items: items.map(i =>
        i.product.id === productId ? { ...i, quantity: targetQty } : i
      )
    });
  },
  
  setDiscount: (discount: number) => set({ discount: Math.max(0, discount) }),
  setPaymentMethod: (paymentMethod: string) => set({ paymentMethod }),
  setCustomerInfo: (customerName: string, customerPhone: string) => 
    set({ customerName, customerPhone }),
  setWarrantyInfo: (warrantyInfo: string) => set({ warrantyInfo }),
  
  clearCart: () => set({
    items: [],
    discount: 0,
    paymentMethod: 'CASH',
    customerName: '',
    customerPhone: '',
    warrantyInfo: ''
  }),
  
  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const price = item.customPrice ?? item.product.price;
      return sum + (price * item.quantity);
    }, 0);
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    return Math.max(0, subtotal - get().discount);
  }
}));
