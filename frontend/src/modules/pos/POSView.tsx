import { useState, useEffect, useCallback } from 'react';
import { useCategories, useCreateSale } from '../../hooks/useApiQueries';
import { useCartStore } from '../../stores/cartStore';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../services/api';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const debouncedSearch = useDebounce(search, 300);

  const fetchCatalog = useCallback(async () => {
    try {
      const data = await api.getProducts(debouncedSearch, selectedCatId, page, 24);
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
      setShowCustomModal(false);
      clearCart();
    } catch (err: any) {
      showToast?.('error', err.message || t('pos.failedToCreate'));
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
      clearCart();
      setShowCheckout(false);
    } catch (err: any) {
      showToast?.('error', err.message || t('pos.failedToCreate'));
    }
  };

  const handlePrint = (sale: Sale) => {
    api.printPdf('sale', sale.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 max-w-6xl mx-auto lg:h-[calc(100vh-100px)]">
      <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6 lg:h-full lg:overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight text-on-surface">{t('pos.title')}</h1>
            <span className="text-[10px] text-on-surface-variant"><span className="keyboard-key">/</span> {t('pos.focusHint')}</span>
          </div>
          <div className="relative flex items-center">
            <MaterialIcon icon="search" size={16} wght={300} className="absolute left-3.5 text-on-surface-variant" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('pos.searchPlaceholder')} className="neo-input w-full pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedCatId ?? ''} onChange={e => { setSelectedCatId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              className="neo-input flex-1 py-2.5 text-xs" aria-label={t('pos.filterCategory')}>
              <option value="">{t('pos.allCategories')}</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button onClick={() => { setCustomForm({ name: '', price: 0 }); setCustomSaleInfo({ customerName: '', customerPhone: '', paymentMethod: 'CASH', warrantyDays: 0 }); setShowCustomModal(true); }}
              className="neo-btn h-[38px] px-3 text-xs shrink-0 text-cyan-accent" title={t('pos.addNonInventory')}>
              <MaterialIcon icon="inventory" size={16} wght={300} />
            </button>
          </div>
        </div>

        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(p => (
              <div key={p.id} onClick={() => p.stock > 0 && addItem(p as any)}
                className={`relative rounded-xl p-3 flex flex-col gap-2 cursor-pointer transition-all duration-200 ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  backgroundColor: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                }}
                onMouseEnter={(e) => {
                  if (p.stock <= 0) return;
                  e.currentTarget.style.borderColor = 'var(--c-primary-40)';
                  e.currentTarget.style.boxShadow = '0 4px 20px var(--c-primary-8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                {/* SKU */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--c-text-sec)' }}>
                    SKU
                  </span>
                  <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--c-text-sec)' }}>
                    {p.sku}
                  </span>
                </div>

                {/* Name */}
                <span className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--c-text)' }}>
                  {p.name}
                </span>

                {/* Price */}
                <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--c-primary)', fontFamily: '"Space Grotesk", sans-serif' }}>
                  ${p.price.toFixed(2)}
                </span>

                {/* Stock + Add button */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-[11px] font-medium tabular-nums" style={{
                    color: p.stock <= 0 ? 'var(--c-danger)' : p.stock <= p.low_stock_limit ? 'var(--c-warning)' : 'var(--c-success)',
                  }}>
                    Stock: {p.stock}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (p.stock > 0) addItem(p as any); }}
                    disabled={p.stock <= 0}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 disabled:opacity-40"
                    style={{
                      backgroundColor: p.stock > 0 ? 'var(--c-primary-10)' : 'transparent',
                      color: p.stock > 0 ? 'var(--c-primary)' : 'var(--c-text-sec)',
                    }}
                  >
                    <MaterialIcon icon="add" size={12} wght={400} />
                    {t('pos.add')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t pt-4 dark:border-[#15132d]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">{t('pos.previous')}</button>
            <span className="text-xs">{t('pos.page', { page, totalPages })}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">{t('pos.next')}</button>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 lg:p-6 flex flex-col justify-between lg:h-full lg:overflow-hidden">
        <div className="flex flex-col gap-4 lg:h-full lg:overflow-hidden">
          <h3 className="font-bold text-sm border-b pb-2 border-outline-variant/10 flex justify-between items-center">
            <span>{t('pos.cartTitle')}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-accent/10 text-cyan-accent">{items.length}</span>
          </h3>
          <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2 flex flex-col gap-3">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-surface-container-high/50">
                <div className="flex flex-col flex-1 truncate mr-2">
                  <span className="font-bold truncate">{item.customName || item.product.name}</span>
                  <span className="text-[10px] text-green-400 font-semibold">${(item.customPrice ?? item.product.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 mr-2">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-6 w-6 rounded-md neo-btn p-0"><MaterialIcon icon="remove" size={12} wght={300} /></button>
                  <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= (item.customName ? 9999 : (item.product.stock ?? 0))} className="h-6 w-6 rounded-md neo-btn p-0"><MaterialIcon icon="add" size={12} wght={300} /></button>
                </div>
                <button onClick={() => removeItem(item.product.id)} className="h-6 w-6 rounded-md neo-btn text-red-400"><MaterialIcon icon="delete" size={12} wght={300} /></button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="flex flex-col h-full items-center justify-center text-center py-12 gap-3 text-on-surface-variant">
                <MaterialIcon icon="shopping_cart" size={32} wght={300} className="opacity-30" />
                <span className="text-xs">{t('pos.cartEmpty')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 dark:border-outline-variant/10 flex flex-col gap-3 mt-4">
          <div className="flex justify-between text-xs"><span>{t('pos.subtotal')}</span><span className="font-semibold">${getSubtotal().toFixed(2)}</span></div>
          <div className="flex items-center justify-between text-xs">
            <span>{t('pos.discount')}</span>
            <input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} placeholder="0" className="neo-input w-20 py-1 text-right text-xs" />
          </div>
          <div className="flex justify-between font-extrabold text-sm text-green-400 border-t border-dashed py-2 dark:border-outline-variant/10">
            <span>{t('pos.total')}</span>
            <span>${getTotal().toFixed(2)}</span>
          </div>
          <button onClick={() => setShowCheckout(true)} disabled={!items.length} className="neo-btn w-full py-3 text-sm font-semibold bg-green-500 text-white hover:bg-emerald-700 disabled:opacity-40">
            {t('pos.checkout')}
          </button>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg max-w-md w-full max-h-[90vh] flex flex-col relative">
            {/* Header fijo */}
            <div className="flex items-center justify-between p-5 pb-3 border-b border-outline-variant/10 shrink-0">
              <h3 className="font-extrabold text-base">{t('pos.confirmSale')}</h3>
              <button onClick={() => setShowCheckout(false)} className="neo-btn h-8 w-8 rounded-full">
                <MaterialIcon icon="close" size={16} wght={300} />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-5 pt-4 flex flex-col gap-4 text-xs">
              {/* Cliente */}
              <div className="flex flex-col gap-3">
                <span className="font-bold text-[11px] uppercase tracking-widest text-on-surface-variant">{t('pos.customerInfo')}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-[11px]">{t('pos.customerName')}</label>
                    <input type="text" value={customerName} onChange={e => setCustomerInfo(e.target.value, customerPhone)}
                      placeholder={t('pos.optional')} className="neo-input w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-[11px]">{t('pos.phone')}</label>
                    <input type="text" value={customerPhone} onChange={e => setCustomerInfo(customerName, e.target.value)}
                      placeholder={t('pos.optional')} className="neo-input w-full" />
                  </div>
                </div>
              </div>

              {/* Pago */}
              <div className="flex flex-col gap-3">
                <span className="font-bold text-[11px] uppercase tracking-widest text-on-surface-variant">{t('pos.paymentInfo')}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-[11px]">{t('pos.payment')}</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="neo-input w-full">
                      <option value="CASH">{t('pos.cash')}</option>
                      <option value="CARD">{t('pos.card')}</option>
                      <option value="TRANSFER">{t('pos.transfer')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-[11px]">{t('pos.warranty')}</label>
                    <input type="number" min="0" value={warrantyInfo ? parseInt(warrantyInfo) : ''}
                      onChange={e => setWarrantyInfo(e.target.value ? `${e.target.value} days warranty` : '')}
                      className="neo-input w-full" placeholder={t('pos.none')} />
                  </div>
                </div>
              </div>

              {/* Resumen de total */}
              <div className="border-t border-dashed border-outline-variant/10 pt-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-on-surface-variant">
                  <span>{t('pos.subtotal')}</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>{t('pos.discount')}</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-green-400 border-t border-outline-variant/10 pt-1.5 mt-0.5">
                  <span>{t('pos.total')}</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* WhatsApp */}
              {customerPhone && (
                <a href={`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customerName}! Your purchase at Infinity Technology: $${getTotal().toFixed(2)} via ${paymentMethod}. Thank you!`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="neo-btn py-2 text-xs font-semibold flex items-center justify-center gap-2 border-emerald-500/20 text-green-400 shrink-0">
                  <MaterialIcon icon="share" size={14} wght={300} /> {t('pos.whatsapp')}
                </a>
              )}
            </div>

            {/* Botones fijos al final */}
            <div className="flex gap-3 p-5 pt-0 shrink-0">
              <button onClick={() => setShowCheckout(false)} className="neo-btn flex-1 py-3 text-xs font-semibold">
                {t('common.cancel')}
              </button>
              <button onClick={handleCheckout} disabled={createSale.isPending}
                className="neo-btn flex-1 py-3 text-xs font-semibold bg-green-500 text-white disabled:opacity-40">
                {createSale.isPending ? t('common.saving') : t('pos.completeSale')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom item + checkout modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg max-w-md w-full p-6 relative">
            <button onClick={() => setShowCustomModal(false)} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><MaterialIcon icon="close" size={16} wght={300} /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-outline-variant/10 mb-4">{t('pos.customSale')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCustomCheckout(); }} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b dark:border-outline-variant/10">
                <div>
                  <label className="font-semibold">{t('pos.itemName')}</label>
                  <input required value={customForm.name} onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))} className="neo-input mt-1 w-full" placeholder={t('pos.itemNamePlaceholder')} />
                </div>
                <div>
                  <label className="font-semibold">{t('pos.price')}</label>
                  <input type="number" step="0.01" required value={customForm.price || ''} onChange={e => setCustomForm(f => ({ ...f, price: Number(e.target.value) }))} className="neo-input mt-1 w-full" placeholder={t('pos.pricePlaceholder')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold">{t('pos.customerName')}</label>
                  <input type="text" value={customSaleInfo.customerName} onChange={e => setCustomSaleInfo(s => ({ ...s, customerName: e.target.value }))} className="neo-input mt-1 w-full" placeholder={t('pos.optional')} />
                </div>
                <div>
                  <label className="font-semibold">{t('pos.phone')}</label>
                  <input type="text" value={customSaleInfo.customerPhone} onChange={e => setCustomSaleInfo(s => ({ ...s, customerPhone: e.target.value }))} className="neo-input mt-1 w-full" placeholder={t('pos.optional')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold">{t('pos.payment')}</label>
                  <select value={customSaleInfo.paymentMethod} onChange={e => setCustomSaleInfo(s => ({ ...s, paymentMethod: e.target.value }))} className="neo-input mt-1 w-full">
                    <option value="CASH">{t('pos.cash')}</option>
                    <option value="CARD">{t('pos.card')}</option>
                    <option value="TRANSFER">{t('pos.transfer')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold">{t('pos.warranty')}</label>
                  <input type="number" min="0" value={customSaleInfo.warrantyDays || ''} onChange={e => setCustomSaleInfo(s => ({ ...s, warrantyDays: Number(e.target.value) }))} className="neo-input mt-1 w-full" placeholder={t('pos.none')} />
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b dark:border-outline-variant/10">
                <span className="text-on-surface-variant">{t('pos.totalLabel')}</span>
                <span className="font-extrabold text-lg text-green-400">${customForm.price.toFixed(2)}</span>
              </div>
              {customSaleInfo.customerPhone && (
                <a href={`https://wa.me/${customSaleInfo.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customSaleInfo.customerName || 'customer'}! Your purchase at Infinity Technology: $${customForm.price.toFixed(2)} via ${customSaleInfo.paymentMethod}. Thank you!`)}`} target="_blank" rel="noopener noreferrer"
                  className="neo-btn py-2 text-xs font-semibold flex items-center justify-center gap-2 border-emerald-500/20 text-green-400">
                  <MaterialIcon icon="share" size={14} wght={300} /> {t('pos.whatsapp')}
                </a>
              )}
              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setShowCustomModal(false)} className="neo-btn flex-1 py-3 text-xs font-semibold">{t('common.cancel')}</button>
                <button type="submit" disabled={createSale.isPending} className="neo-btn flex-1 py-3 text-xs font-semibold bg-green-500 text-white disabled:opacity-40">
                {createSale.isPending ? t('common.saving') : t('pos.completeSale')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 flex flex-col gap-3 shadow-lg animate-in slide-in-from-bottom-4 min-w-[200px]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-sm text-green-400">{t('pos.saleCompleted', { id: lastSale.id })}</div>
              <div className="text-xs text-on-surface-variant">{t('pos.saleCompletedDetail', { total: lastSale.total.toFixed(2), method: lastSale.payment_method })}</div>
            </div>
            <button onClick={() => setLastSale(null)} className="neo-btn h-7 w-7 rounded-full text-on-surface-variant shrink-0"><MaterialIcon icon="close" size={14} wght={300} /></button>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => handlePrint(lastSale)} className="neo-btn py-2 px-3 text-xs font-semibold text-cyan-accent flex items-center justify-center gap-1 w-full">
              <MaterialIcon icon="print" size={14} wght={300} /> {t('pos.print')}
            </button>
            <button onClick={() => api.sharePdfOnWhatsApp('sale', lastSale.id, `Sale #${lastSale.id} - Receipt`)} className="neo-btn py-2 px-3 text-xs font-semibold text-green-600 flex items-center justify-center gap-1 w-full">
              <MaterialIcon icon="chat" size={14} wght={300} /> {t('pos.whatsapp')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
