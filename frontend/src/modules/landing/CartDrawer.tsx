import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cartStore';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { WHATSAPP_NUMBER } from '../../config';

const C = {
  text: 'var(--c-text)',
  textSec: 'var(--c-text-sec)',
  primary: 'var(--c-primary)',
  surface: 'var(--c-surface)',
  hover: 'var(--c-hover)',
  border: 'var(--c-border)',
  divider: 'var(--c-divider)',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const digitalItems = items.filter((i) => i.product.product_type === 'digital_service');
  const physicalItems = items.filter((i) => i.product.product_type !== 'digital_service');
  const subtotal = getSubtotal();
  const serviceTotal = digitalItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const productCount = physicalItems.reduce((sum, i) => sum + i.quantity, 0);
  const serviceCount = digitalItems.reduce((sum, i) => sum + i.quantity, 0);
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [popupError, setPopupError] = useState(false);

  if (!open) return null;

  /* ─── Compose WhatsApp message ────────────────────────── */
  const composeMessage = (name: string, phone: string): string => {
    const allItems = [...physicalItems, ...digitalItems];
    const lines: string[] = [];
    lines.push('🛒 *Nuevo pedido - Infinity Technology*');
    lines.push('─────────────────────');
    lines.push('');
    allItems.forEach((item, i) => {
      const price = item.customPrice ?? item.product.price;
      const total = price * item.quantity;
      lines.push(`${i + 1}. *${item.product.name}*`);
      lines.push(`   Cantidad: ${item.quantity}`);
      lines.push(`   Precio: $${price.toFixed(2)} c/u`);
      lines.push(`   Total: $${total.toFixed(2)}`);
      lines.push('');
    });
    lines.push('─────────────────────');
    const totalPrice = allItems.reduce((sum, item) => sum + (item.customPrice ?? item.product.price) * item.quantity, 0);
    lines.push(`*Subtotal:* $${totalPrice.toFixed(2)}`);
    lines.push(`*Total:* $${totalPrice.toFixed(2)}`);
    lines.push('');
    lines.push(`👤 *Cliente:* ${name}`);
    lines.push(`📱 *Teléfono:* ${phone}`);
    return lines.join('\n');
  };

  /* ─── Send WhatsApp order ─────────────────────────────── */
  const handleSendOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    setSending(true);
    setPopupError(false);
    const message = composeMessage(customerName.trim(), customerPhone.trim());
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const win = window.open(url, '_blank');
    if (!win) {
      setPopupError(true);
      setSending(false);
      return;
    }
    clearCart();
    onClose();
  };

  const canSend = customerName.trim().length > 0 && customerPhone.trim().length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200 cursor-pointer"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col transition-all duration-300 shadow-2xl"
        style={{
          backgroundColor: C.surface,
          borderLeft: '1px solid var(--c-divider)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--c-divider)' }}>
          <div className="flex items-center gap-2">
            <MaterialIcon icon="shopping_cart" wght={400} style={{ color: C.primary }} size={20} />
            <span className="text-sm font-bold tracking-tight" style={{ color: C.text }}>
              {t('cart.title', 'Carrito')}
            </span>
            {items.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--c-primary-soft)', color: C.primary }}>
                {productCount + serviceCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer"
                style={{ color: 'var(--c-danger)', backgroundColor: 'var(--c-danger-30)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-40)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-30)'; }}
              >
                {t('cart.clear', 'Vaciar')}
              </button>
            )}
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{ color: C.textSec, backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <MaterialIcon icon="close" wght={400} size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: C.hover }}
              >
                <MaterialIcon icon="shopping_cart" wght={300} style={{ color: 'var(--c-muted)' }} size={32} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold" style={{ color: C.text }}>
                  {t('cart.empty', 'Tu carrito está vacío')}
                </span>
                <span className="text-xs" style={{ color: C.textSec }}>
                  {t('cart.emptyHint', 'Agregá productos o servicios para empezar')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Physical products */}
              {physicalItems.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <MaterialIcon icon="inventory_2" wght={300} style={{ color: C.primary }} size={14} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textSec }}>
                      {t('cart.products', 'Productos')}
                    </span>
                  </div>
                  {physicalItems.map((item) => (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      onRemove={removeItem}
                      onUpdateQty={updateQuantity}
                    />
                  ))}
                </div>
              )}

              {/* Digital services */}
              {digitalItems.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <MaterialIcon icon="cloud" wght={300} style={{ color: C.primary }} size={14} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textSec }}>
                      {t('cart.digitalServices', 'Servicios digitales')}
                    </span>
                  </div>
                  {digitalItems.map((item) => (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      onRemove={removeItem}
                      onUpdateQty={updateQuantity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-5 flex flex-col gap-4" style={{ borderColor: 'var(--c-divider)', backgroundColor: C.hover }}>
            {/* Summary lines */}
            <div className="flex flex-col gap-2">
              {physicalItems.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: C.textSec }}>{t('cart.subtotal', 'Subtotal')}</span>
                  <span className="text-xs font-semibold" style={{ color: C.text }}>${subtotal.toFixed(2)}</span>
                </div>
              )}
              {digitalItems.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: C.textSec }}>{t('cart.services', 'Servicios')}</span>
                  <span className="text-xs font-semibold" style={{ color: C.text }}>${serviceTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="h-px" style={{ backgroundColor: 'var(--c-divider)' }} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: C.text }}>{t('cart.total', 'Total')}</span>
                <span className="text-lg font-bold tracking-tight" style={{ color: C.primary, fontFamily: '"Space Grotesk", sans-serif' }}>
                  ${(subtotal + serviceTotal).toFixed(2)}
                </span>
              </div>
            </div>

            {/* WhatsApp order button / form */}
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 12px rgba(37,211,102,0.35)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(37,211,102,0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <MaterialIcon icon="chat" wght={400} size={16} />
                  {t('cart.whatsapp', 'Pedir por WhatsApp')}
                </div>
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-3"
                >
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                    style={{
                      backgroundColor: C.surface,
                      color: C.text,
                      border: '1px solid var(--c-border-input)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Tu teléfono (ej: 71234567)"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                    style={{
                      backgroundColor: C.surface,
                      color: C.text,
                      border: '1px solid var(--c-border-input)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                  />

                  {popupError && (
                    <p className="text-xs" style={{ color: 'var(--c-danger)' }}>
                      Permití ventanas emergentes para enviar el pedido.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowForm(false); setPopupError(false); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer"
                      style={{ backgroundColor: C.hover, color: C.textSec }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendOrder}
                      disabled={!canSend || sending}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                      }}
                    >
                      {sending ? (
                        <div className="flex items-center justify-center gap-2">
                          <MaterialIcon icon="sync" wght={400} size={14} className="animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <MaterialIcon icon="send" wght={400} size={14} />
                          Enviar pedido
                        </div>
                      )}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// --- CartItemRow ---

interface CartItemRowProps {
  item: { product: { id: number; name: string; price: number; product_type: string }; quantity: number };
  onRemove: (productId: number) => void;
  onUpdateQty: (productId: number, qty: number) => void;
}

function CartItemRow({ item, onRemove, onUpdateQty }: CartItemRowProps) {
  const { t } = useTranslation();
  const isDigital = item.product.product_type === 'digital_service';

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3 transition-all duration-150"
      style={{
        backgroundColor: C.hover,
        border: `1px solid var(--c-divider)`,
      }}
    >
      {/* Icon */}
      <div
        className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: isDigital ? 'rgba(0,217,255,0.12)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <MaterialIcon
          icon={isDigital ? 'cloud' : 'inventory_2'}
          wght={300}
          style={{ color: isDigital ? '#00D9FF' : C.textSec }}
          size={17}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: C.text }}>
              {item.product.name}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.textSec }}>
              ${item.product.price.toFixed(2)}
              {isDigital ? ` · ${t('cart.digitalService', 'Servicio digital')}` : ''}
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove(item.product.id)}
            className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-30)'; e.currentTarget.style.color = 'var(--c-danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-muted)'; }}
          >
            <MaterialIcon icon="close" wght={400} size={14} />
          </button>
        </div>

        {/* Quantity for physical products */}
        {!isDigital && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onUpdateQty(item.product.id, Math.max(1, item.quantity - 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{ backgroundColor: 'transparent', color: C.textSec, border: `1px solid var(--c-divider)` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <MaterialIcon icon="remove" wght={400} size={14} />
            </button>
            <span className="text-xs font-semibold w-6 text-center" style={{ color: C.text }}>
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
              className="h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{ backgroundColor: 'transparent', color: C.textSec, border: `1px solid var(--c-divider)` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <MaterialIcon icon="add" wght={400} size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
