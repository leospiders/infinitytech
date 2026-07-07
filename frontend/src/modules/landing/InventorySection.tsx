import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicInventorySearch } from '../../hooks/useApiQueries';
import { useCartStore } from '../../stores/cartStore';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import type { PublicInventoryResult, PublicProduct } from '../../types';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

function ProductCard({ product, index }: { product: PublicInventoryResult; index: number }) {
  const addItem = useCartStore(s => s.addItem);
  const cartItems = useCartStore(s => s.items);
  const inCart = cartItems.some(i => i.product.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cp: PublicProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      product_type: product.product_type,
      stock: product.stock,
      ...(product.category_name ? { category: { id: product.category_id, uuid: '', name: product.category_name } } : {}),
    };
    addItem(cp);
  };

  const isAvailable = product.is_repuesto ? product.stock > 0 : product.in_stock;
  const stockText = product.is_repuesto
    ? product.stock > 0
      ? `${product.stock} unidades en stock`
      : 'Agotado'
    : product.in_stock
    ? 'Disponible en taller'
    : 'Agotado';

  const stockColor = isAvailable ? 'var(--color-cyan-accent)' : 'var(--c-text-sec)';

  const getProductIcon = (catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes('celular') || name.includes('phone') || name.includes('móvil')) return 'smartphone';
    if (name.includes('laptop') || name.includes('comput') || name.includes('notebook')) return 'laptop';
    if (name.includes('pantalla') || name.includes('screen') || name.includes('display')) return 'tv';
    if (name.includes('bater') || name.includes('power') || name.includes('battery')) return 'battery_saver';
    if (name.includes('repuesto') || name.includes('pieza') || name.includes('chip')) return 'developer_board';
    if (name.includes('herramienta') || name.includes('tool')) return 'handyman';
    if (name.includes('gaming') || name.includes('consola')) return 'sports_esports';
    return 'inventory_2';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.03, ease: easeOutExpo }}
      whileHover={{ y: -6 }}
      className="group rounded-[24px] overflow-hidden border transition-all duration-500 flex flex-col justify-between"
      style={{
        backgroundColor: 'var(--c-surface)',
        borderColor: 'var(--c-border)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-cyan-accent)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 229, 255, 0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--c-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        {/* Sleek Image Container */}
        <div className="aspect-[4/3] flex items-center justify-center relative border-b overflow-hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', borderColor: 'var(--c-border)' }}>
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
          {/* Blue ambient light behind icon */}
          <div className="absolute w-20 h-20 rounded-full opacity-10 blur-xl bg-[var(--c-primary)] group-hover:scale-125 transition-transform duration-700" />
          <MaterialIcon
            icon={getProductIcon(product.category_name || '')}
            size={36}
            wght={200}
            style={{ color: 'var(--color-cyan-accent)', opacity: 0.7 }}
            className="relative z-10 transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        {/* Info */}
        <div className="p-6">
          {product.category_name && (
            <span
              className="text-[9px] font-bold uppercase tracking-[0.2em] block mb-2"
              style={{ color: 'var(--color-cyan-accent)' }}
            >
              {product.category_name}
            </span>
          )}
          <h3
            className="text-sm font-semibold leading-relaxed tracking-tight line-clamp-2"
            style={{ color: 'var(--c-text)', minHeight: '2.5rem' }}
          >
            {product.name}
          </h3>

          {/* Availability and Stock */}
          <div className="flex items-center gap-2 mt-4">
            <span className="w-1.5 h-1.5 rounded-full relative flex">
              {isAvailable && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: stockColor }} />
              )}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: stockColor }} />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: stockColor }}>
              {stockText}
            </span>
          </div>
        </div>
      </div>

      {/* Button container */}
      <div className="px-6 pb-6 pt-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
          className="w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
          style={{
            backgroundColor: inCart ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 229, 255, 0.1)',
            border: inCart ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid var(--c-border)',
            color: inCart ? 'var(--color-cyan-accent)' : 'var(--c-text)',
          }}
          onMouseEnter={e => {
            if (!inCart) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.2)';
              e.currentTarget.style.borderColor = 'var(--color-cyan-accent)';
            }
          }}
          onMouseLeave={e => {
            if (!inCart) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--c-border)';
            }
          }}
        >
          {inCart ? 'En carrito' : 'Solicitar'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-[24px] overflow-hidden border"
      style={{
        backgroundColor: 'var(--c-surface)',
        borderColor: 'var(--c-border)',
      }}
    >
      <div className="aspect-[4/3] bg-white/3 animate-pulse" />
      <div className="p-6 flex flex-col gap-3">
        <div className="h-2 w-12 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
        <div className="h-2 w-20 bg-white/5 rounded animate-pulse mt-2" />
        <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse mt-4" />
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
    <section className="py-32 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: easeOutExpo }}
        className="mb-16"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] block mb-4" style={{ color: 'var(--color-cyan-accent)' }}>
          PROTAGONISTA / CATÁLOGO
        </span>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-tight text-[var(--c-text)]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          Taller de partes & equipos.
        </h2>
      </motion.div>

      {/* Modern Search & Elegant Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-14 relative z-20">
        {/* Wide Search Bar */}
        <div className="relative flex-1">
          <MaterialIcon
            icon="search"
            size={20}
            style={{
              color: 'var(--c-text-sec)',
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscá componentes por modelo, SKU o nombre..."
            className="w-full h-16 bg-[var(--c-surface)]/60 outline-none text-sm rounded-[24px] pl-14 pr-6 transition-all duration-300 border focus:border-[var(--color-cyan-accent)]/50 shadow-inner"
            style={{
              color: 'var(--c-text)',
              borderColor: 'var(--c-border)',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          />
        </div>

        {/* Elegant Select Dropdown */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="h-16 px-6 pr-12 rounded-[24px] text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border appearance-none transition-all duration-300"
            style={{
              color: 'var(--c-text)',
              backgroundColor: 'var(--c-surface)',
              borderColor: 'var(--c-border)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-cyan-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
          >
            <option value="" style={{ backgroundColor: 'var(--c-surface)', color: 'var(--c-text)' }}>Todas las categorías</option>
            {categories.filter(Boolean).map(cat => (
              <option key={cat} value={cat} style={{ backgroundColor: 'var(--c-surface)', color: 'var(--c-text)' }}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>
          {/* Custom Select Indicator Arrow */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <MaterialIcon icon="keyboard_arrow_down" size={18} />
          </div>
        </div>
      </div>

      {/* Grid Results Container */}
      <div className="min-h-[450px]">
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5"
            >
              <MaterialIcon icon="error" size={40} style={{ color: 'var(--color-cyan-accent)', opacity: 0.6 }} />
              <p className="text-sm font-medium" style={{ color: 'var(--c-text-sec)' }}>
                No se pudo establecer conexión con el inventario
              </p>
              <button
                onClick={() => refetch()}
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border"
                style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.1)'}
              >
                Reintentar
              </button>
            </motion.div>
          )}

          {(state === 'results' || (state === 'idle' && items.length > 0)) && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-8"
            >
              {hasSearch && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-cyan-accent)]">
                  Encontrados: {items.length} {items.length === 1 ? 'componente' : 'componentes'}
                </span>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </motion.div>
          )}

          {state === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <MaterialIcon icon="search_off" size={48} style={{ color: 'var(--c-text-sec)', opacity: 0.3 }} />
              <h3 className="text-lg font-bold" style={{ color: 'var(--c-text)', fontFamily: '"Space Grotesk", sans-serif' }}>
                Sin resultados
              </h3>
              <p className="text-sm font-light" style={{ color: 'var(--c-text-sec)' }}>
                Verifique la ortografía o intente con otra categoría.
              </p>
            </motion.div>
          )}

          {state === 'idle' && items.length === 0 && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <MaterialIcon icon="cloud_sync" size={48} style={{ color: 'var(--c-text-sec)', opacity: 0.2 }} />
              <p className="text-sm font-light" style={{ color: 'var(--c-text-sec)' }}>
                Ingrese un término de búsqueda para consultar en tiempo real.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
