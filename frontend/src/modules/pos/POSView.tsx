import { useState, useEffect, useCallback } from 'react';
import { useCategories, useCreateSale } from '../../hooks/useApiQueries';
import { useCartStore } from '../../stores/cartStore';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../services/api';
import { Search, Minus, Plus, Trash2, ShoppingCart, Share2, X, Printer, PackagePlus, MessageCircle } from 'lucide-react';
import type { Product, Sale } from '../../types';

export function POSView({ showToast }: { showToast?: (type: 'success' | 'error', msg: string) => void }) {
  const { items, discount, paymentMethod, customerName, customerPhone, warrantyInfo,
    addItem, removeItem, updateQuantity, setDiscount, setPaymentMethod,
    setCustomerInfo, setWarrantyInfo, clearCart, getSubtotal, getTotal } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  useEffect(() => { if (!lastSale) return; const t = setTimeout(() => setLastSale(null), 5000); return () => clearTimeout(t); }, [lastSale]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: 0 });
  const [customSaleInfo, setCustomSaleInfo] = useState({
    customerName: '', customerPhone: '', paymentMethod: 'CASH', warrantyDays: 0,
  });

  const { data: categories } = useCategories();
  const createSale = useCreateSale();
  const debouncedSearch = useDebounce(search, 300);

  const fetchCatalog = useCallback(async () => {
    try {
      const data = await api.getProducts(debouncedSearch, selectedCatId, page, 8);
      setProducts(data.items);
      setTotalPages(Math.ceil(data.total / 8));
    } catch {}
  }, [debouncedSearch, selectedCatId, page]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const handleCustomCheckout = async () => {
    try {
      const sale = await createSale.mutateAsync({
        customer_name: customSaleInfo.customerName || null,
        customer_phone: customSaleInfo.customerPhone || null,
        discount: 0,
        payment_method: customSaleInfo.paymentMethod,
        warranty_info: customSaleInfo.warrantyDays > 0 ? `${customSaleInfo.warrantyDays} days warranty` : '',
        items: [{ product_id: null, custom_name: customForm.name, quantity: 1, unit_price: customForm.price }],
      });
      setLastSale(sale);
      showToast?.('success', `Sale #${sale.id} completed — $${sale.total.toFixed(2)}`);
      setShowCustomModal(false);
      clearCart();
    } catch (e: any) {
      showToast?.('error', e?.message || 'Failed to create sale');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      const sale = await createSale.mutateAsync({
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        discount,
        payment_method: paymentMethod,
        warranty_info: warrantyInfo,
        items: items.map(i => ({
          product_id: i.customName ? null : i.product.id,
          custom_name: i.customName || null,
          quantity: i.quantity,
          unit_price: i.customPrice ?? i.product.price,
        })),
      });
      setLastSale(sale);
      showToast?.('success', `Sale #${sale.id} completed — $${sale.total.toFixed(2)}`);
      clearCart();
      setShowCheckout(false);
    } catch (e: any) {
      showToast?.('error', e?.message || 'Failed to create sale');
    }
  };

  const handlePrint = (sale: Sale) => {
    const pdfUrl = api.getReceiptPdfUrl(sale.id);
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 max-w-6xl mx-auto lg:h-[calc(100vh-100px)]">
      <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6 lg:h-full lg:overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight text-brand-deep">Quick POS Checkout</h1>
            <span className="text-[10px] text-dim"><span className="keyboard-key">/</span> focus search</span>
          </div>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-dim" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name..." className="neo-input w-full pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedCatId ?? ''} onChange={e => { setSelectedCatId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              className="neo-input flex-1 py-2.5 text-xs" aria-label="Filter by category">
              <option value="">All categories</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button onClick={() => { setCustomForm({ name: '', price: 0 }); setCustomSaleInfo({ customerName: '', customerPhone: '', paymentMethod: 'CASH', warrantyDays: 0 }); setShowCustomModal(true); }}
              className="neo-btn h-[38px] px-3 text-xs shrink-0 text-brand" title="Add non-inventory item">
              <PackagePlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {products.map(p => (
              <div key={p.id} onClick={() => p.stock > 0 && addItem(p)}
                className={`neo-card p-4 flex flex-col justify-between border hover:border-brand/40 cursor-pointer ${p.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-xs  truncate">{p.name}</span>
                    <span className="font-extrabold text-success text-xs shrink-0">${p.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t dark:border-[#1F1E2E] text-[10px]">
                  <span className={p.stock <= p.low_stock_limit ? 'text-danger font-bold' : 'text-muted dark:text-dim'}>
                    Stock: {p.stock}
                  </span>
                  <span className="text-brand font-bold">Add +</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t pt-4 dark:border-[#15132d]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">Previous</button>
            <span className="text-xs">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      <div className="neo-card p-4 lg:p-6 flex flex-col justify-between lg:h-full lg:overflow-hidden">
        <div className="flex flex-col gap-4 lg:h-full lg:overflow-hidden">
          <h3 className="font-bold text-sm border-b pb-2 border-brand/10 dark:border-brand/20 flex justify-between items-center">
            <span>Cart</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand/10 text-brand">{items.length}</span>
          </h3>
          <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2 flex flex-col gap-3">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#F8FAFC]/50 dark:bg-black/10">
                <div className="flex flex-col flex-1 truncate mr-2">
                  <span className="font-bold truncate">{item.customName || item.product.name}</span>
                  <span className="text-[10px] text-success font-semibold">${(item.customPrice ?? item.product.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 mr-2">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-6 w-6 rounded-md neo-btn p-0"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= (item.customName ? 9999 : item.product.stock)} className="h-6 w-6 rounded-md neo-btn p-0"><Plus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => removeItem(item.product.id)} className="h-6 w-6 rounded-md neo-btn text-danger"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="flex flex-col h-full items-center justify-center text-center py-12 gap-3 text-dim">
                <ShoppingCart className="h-8 w-8 opacity-30" />
                <span className="text-xs">Cart is empty.</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 dark:border-[#1F1E2E] flex flex-col gap-3 mt-4">
          <div className="flex justify-between text-xs"><span>Subtotal</span><span className="font-semibold">${getSubtotal().toFixed(2)}</span></div>
          <div className="flex items-center justify-between text-xs">
            <span>Discount</span>
            <input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} placeholder="0" className="neo-input w-20 py-1 text-right text-xs" />
          </div>
          <div className="flex justify-between font-extrabold text-sm text-success border-t border-dashed py-2 dark:border-[#1F1E2E]">
            <span>TOTAL</span>
            <span>${getTotal().toFixed(2)}</span>
          </div>
          <button onClick={() => setShowCheckout(true)} disabled={!items.length} className="neo-btn w-full py-3 text-sm font-semibold bg-success text-white hover:bg-emerald-700 disabled:opacity-40">
            Checkout
          </button>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-md w-full p-6 flex flex-col gap-4 relative">
            <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><X className="h-4 w-4" /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-brand/10 dark:border-[#1F1E2E]">Confirm Sale</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold">Customer Name</label>
                <input type="text" value={customerName} onChange={e => setCustomerInfo(e.target.value, customerPhone)} placeholder="Optional" className="neo-input mt-1" />
              </div>
              <div>
                <label className="font-semibold">Phone</label>
                <input type="text" value={customerPhone} onChange={e => setCustomerInfo(customerName, e.target.value)} placeholder="Optional" className="neo-input mt-1" />
              </div>
              <div>
                <label className="font-semibold">Payment</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="neo-input mt-1">
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                <label className="font-semibold">Warranty (days)</label>
                <input type="number" min="0" value={warrantyInfo ? parseInt(warrantyInfo) : ''} onChange={e => setWarrantyInfo(e.target.value ? `${e.target.value} days warranty` : '')} className="neo-input mt-1" placeholder="None" />
              </div>
            </div>
            {customerPhone && (
              <a href={`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customerName}! Your purchase at Infinity Technology: $${getTotal().toFixed(2)} via ${paymentMethod}. Thank you!`)}`} target="_blank" rel="noopener noreferrer"
                className="neo-btn py-2 text-xs font-semibold flex items-center justify-center gap-2 border-emerald-500/20 text-success">
                <Share2 className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            <div className="flex gap-4 mt-2">
              <button onClick={() => setShowCheckout(false)} className="neo-btn flex-1 py-3 text-xs font-semibold">Cancel</button>
              <button onClick={handleCheckout} disabled={createSale.isPending} className="neo-btn flex-1 py-3 text-xs font-semibold bg-success text-white disabled:opacity-40">
                {createSale.isPending ? 'Saving...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom item + checkout modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-md w-full p-6 relative">
            <button onClick={() => setShowCustomModal(false)} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><X className="h-4 w-4" /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-brand/10 dark:border-[#1F1E2E] mb-4">Custom Sale</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCustomCheckout(); }} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b dark:border-[#1F1E2E]">
                <div>
                  <label className="font-semibold">Item Name *</label>
                  <input required value={customForm.name} onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))} className="neo-input mt-1 w-full" placeholder="e.g. Labor" />
                </div>
                <div>
                  <label className="font-semibold">Price *</label>
                  <input type="number" step="0.01" required value={customForm.price || ''} onChange={e => setCustomForm(f => ({ ...f, price: Number(e.target.value) }))} className="neo-input mt-1 w-full" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold">Customer Name</label>
                  <input type="text" value={customSaleInfo.customerName} onChange={e => setCustomSaleInfo(s => ({ ...s, customerName: e.target.value }))} className="neo-input mt-1 w-full" placeholder="Optional" />
                </div>
                <div>
                  <label className="font-semibold">Phone</label>
                  <input type="text" value={customSaleInfo.customerPhone} onChange={e => setCustomSaleInfo(s => ({ ...s, customerPhone: e.target.value }))} className="neo-input mt-1 w-full" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold">Payment</label>
                  <select value={customSaleInfo.paymentMethod} onChange={e => setCustomSaleInfo(s => ({ ...s, paymentMethod: e.target.value }))} className="neo-input mt-1 w-full">
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold">Warranty (days)</label>
                  <input type="number" min="0" value={customSaleInfo.warrantyDays || ''} onChange={e => setCustomSaleInfo(s => ({ ...s, warrantyDays: Number(e.target.value) }))} className="neo-input mt-1 w-full" placeholder="None" />
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b dark:border-[#1F1E2E]">
                <span className="text-muted">Total</span>
                <span className="font-extrabold text-lg text-success">${customForm.price.toFixed(2)}</span>
              </div>
              {customSaleInfo.customerPhone && (
                <a href={`https://wa.me/${customSaleInfo.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customSaleInfo.customerName || 'customer'}! Your purchase at Infinity Technology: $${customForm.price.toFixed(2)} via ${customSaleInfo.paymentMethod}. Thank you!`)}`} target="_blank" rel="noopener noreferrer"
                  className="neo-btn py-2 text-xs font-semibold flex items-center justify-center gap-2 border-emerald-500/20 text-success">
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setShowCustomModal(false)} className="neo-btn flex-1 py-3 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={createSale.isPending} className="neo-btn flex-1 py-3 text-xs font-semibold bg-success text-white disabled:opacity-40">
                  {createSale.isPending ? 'Saving...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="fixed bottom-6 right-6 z-50 neo-card p-4 flex items-center gap-4 shadow-lg animate-in slide-in-from-bottom-4">
          <div>
            <div className="font-bold text-sm text-success">Sale #{lastSale.id} completed</div>
            <div className="text-xs text-muted">${lastSale.total.toFixed(2)} — {lastSale.payment_method}</div>
          </div>
          <button onClick={() => handlePrint(lastSale)} className="neo-btn py-2 px-3 text-xs font-semibold text-brand flex items-center gap-1">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={() => api.sharePdfOnWhatsApp(api.getReceiptPdfUrl(lastSale.id), `Sale #${lastSale.id} - Receipt`)} className="neo-btn py-2 px-3 text-xs font-semibold text-green-600 flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button onClick={() => setLastSale(null)} className="neo-btn h-7 w-7 rounded-full text-dim"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}
