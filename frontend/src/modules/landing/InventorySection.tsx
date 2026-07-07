import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicInventorySearch } from '../../hooks/useApiQueries';
import { useCartStore } from '../../stores/cartStore';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import type { PublicInventoryResult, PublicProduct } from '../../types';

const C = {
  text: '#FFFFFF',
  textSec: '#A5A5A5',
  textTer: 'rgba(255,255,255,0.3)',
  primary: '#2F2FE4',
  accent: '#00C8F8',
  surface: '#0F1120',
  border: 'rgba(255,255,255,0.06)',
  hover: 'rgba(255,255,255,0.04)',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

function ProductCard({ product, index }: { product: PublicInventoryResult; index: number }) {
  const addItem = useCartStore(s => s.addItem);
  const cartItems = useCartStore(s => s.items);
  const inCart = cartItems.some(i => i.product.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cp: PublicProduct = {
      id: product.id, name: product.name, price: product.price,
      product_type: product.product_type, stock: product.stock,
      ...(product.category_name ? { category: { id: product.category_id, uuid: '', name: product.category_name } } : {}),
    };
    addItem(cp);
  };

  const stockText = product.is_repuesto
    ? product.stock > 0 ? `${product.stock} en stock` : 'Sin stock'
    : product.in_stock ? 'Disponible' : 'Sin stock';

  const stockColor = (product.is_repuesto ? product.stock > 0 : product.in_stock) ? '#00C8F8' : 'rgba(255,255,255,0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group rounded-[20px] overflow-hidden transition-all duration-300"
      style={{ backgroundColor: '#0F1120', border: `1px solid ${C.border}` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(47,47,228,0.2)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,47,228,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: '#0A0C14' }}>
        <MaterialIcon icon="inventory_2" size={28} style={{ color: 'rgba(255,255,255,0.08)' }} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        {product.category_name && (
          <span className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: C.accent }}>
            {product.category_name}
          </span>
        )}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stockColor }} />
          <span className="text-[11px]" style={{ color: stockColor }}>{stockText}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          className="mt-2 w-full py-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-200"
          style={{
            backgroundColor: inCart ? 'rgba(0,200,248,0.08)' : 'rgba(47,47,228,0.12)',
            color: inCart ? '#00C8F8' : '#FFFFFF',
          }}
          onMouseEnter={e => { if (!inCart) e.currentTarget.style.backgroundColor = 'rgba(47,47,228,0.2)'; }}
          onMouseLeave={e => { if (!inCart) e.currentTarget.style.backgroundColor = 'rgba(47,47,228,0.12)'; }}
        >
          {inCart ? 'En carrito' : 'Agregar'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[20px] overflow-hidden animate-pulse" style={{ backgroundColor: '#0F1120', border: `1px solid ${C.border}` }}>
      <div className="aspect-[4/3]" style={{ backgroundColor: '#0A0C14' }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-2 w-16 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 w-full rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="h-9 w-full rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  );
}

export function InventorySection() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim();

  const { data: allItems = [], isLoading, isError, refetch } = usePublicInventorySearch(trimmed, 50);

  const categories = useMemo(() => {
    const cats = new Set(allItems.map(i => i.category_name).filter(Boolean));
    return ['', ...Array.from(cats)] as string[];
  }, [allItems]);

  const items = useMemo(() => {
    if (!categoryFilter) return allItems;
    return allItems.filter(i => i.category_name === categoryFilter);
  }, [allItems, categoryFilter]);

  const hasSearch = trimmed.length > 0;
  const state = isError ? 'error' : isLoading ? 'loading' : !hasSearch && !items.length ? 'idle' : items.length === 0 ? 'empty' : 'results';

  return (
    <section id="inventario" className="py-24 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] block mb-3" style={{ color: '#2F2FE4' }}>
          INVENTARIO
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}>
          Buscá tu repuesto
        </h2>
      </motion.div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <MaterialIcon icon="search" size={18} style={{ color: 'rgba(255,255,255,0.3)', position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscá por nombre, modelo o SKU..."
            className="w-full h-14 bg-transparent outline-none text-sm rounded-[20px] pl-12 pr-4"
            style={{ color: '#FFFFFF', border: `1px solid ${C.border}`, backgroundColor: '#0F1120' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(47,47,228,0.3)'}
            onBlur={e => e.currentTarget.style.borderColor = C.border}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-14 px-5 rounded-[20px] text-sm outline-none cursor-pointer"
          style={{ color: '#A5A5A5', backgroundColor: '#0F1120', border: `1px solid ${C.border}` }}
        >
          <option value="">Todas las categorías</option>
          {categories.filter(Boolean).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <div key="loading" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {state === 'error' && (
            <div key="error" className="flex flex-col items-center justify-center py-24 gap-4">
              <MaterialIcon icon="error" size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-sm" style={{ color: C.textSec }}>Error al cargar el inventario</p>
              <button onClick={() => refetch()} className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ backgroundColor: 'rgba(47,47,228,0.12)', color: '#FFFFFF' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(47,47,228,0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(47,47,228,0.12)'}>
                Reintentar
              </button>
            </div>
          )}
          {(state === 'results' || (state === 'idle' && items.length > 0)) && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              {hasSearch && (
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.textTer }}>
                  {items.length} {items.length === 1 ? 'resultado' : 'resultados'}
                </span>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </motion.div>
          )}
          {state === 'empty' && (
            <div key="empty" className="flex flex-col items-center justify-center py-24 gap-4">
              <MaterialIcon icon="search_off" size={48} style={{ color: 'rgba(255,255,255,0.08)' }} />
              <h3 className="text-lg font-semibold" style={{ color: C.text }}>Sin resultados</h3>
              <p className="text-sm" style={{ color: C.textSec }}>Probá con otro término o categoría</p>
            </div>
          )}
          {state === 'idle' && items.length === 0 && (
            <div key="idle" className="flex flex-col items-center justify-center py-24 gap-4">
              <MaterialIcon icon="inventory_2" size={48} style={{ color: 'rgba(255,255,255,0.08)' }} />
              <p className="text-sm" style={{ color: C.textSec }}>Escribí algo para empezar a buscar</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
