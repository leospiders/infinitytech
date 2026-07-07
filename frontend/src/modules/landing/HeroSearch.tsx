import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicInventorySearch } from "../../hooks/useApiQueries";
import { useCartStore } from "../../stores/cartStore";
import { MaterialIcon } from "../../components/ui/MaterialIcon";
import type { PublicInventoryResult, PublicProduct } from "../../types";

/* ─── Color palette — CSS vars ─────────────────────────────────── */
const C = {
  text: "var(--c-text)",
  textSec: "var(--c-text-sec)",
  textTer: "var(--c-text-ter)",
  primary: "var(--c-primary)",
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  success: "var(--c-success)",
  danger: "var(--c-danger)",
  hover: "var(--c-hover)",
  bg: "var(--c-bg)",
};

/* ─── Debounce ─────────────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

/* ─── Product Card ─────────────────────────────────────────────── */
function ProductCard({
  product,
  index,
}: {
  product: PublicInventoryResult;
  index: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const inCart = cartItems.some((i) => i.product.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cartProduct: PublicProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      product_type: product.product_type,
      stock: product.stock,
      ...(product.category_name
        ? { category: { id: product.category_id, uuid: '', name: product.category_name } }
        : {}),
    };
    addItem(cartProduct);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4 }}
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: '#1A1E27',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,217,255,0.2)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,217,255,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Image placeholder — compacto */}
      <div
        className="aspect-[4/3] flex items-center justify-center"
        style={{ backgroundColor: '#13161C' }}
      >
        <MaterialIcon
          icon="inventory_2"
          size={24}
          style={{ color: C.textTer, opacity: 0.2 }}
        />
      </div>

      {/* Content — compacto */}
      <div className="p-3.5 flex flex-col gap-1.5">
        {product.category_name && (
          <span
            className="text-[9px] font-medium uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {product.category_name}
          </span>
        )}

        <h3
          className="text-xs font-semibold leading-snug line-clamp-2"
          style={{ color: '#FFFFFF' }}
        >
          {product.name}
        </h3>

        {/* Repuesto → stock numérico | No repuesto → precio + disponibilidad */}
        {product.is_repuesto ? (
          <span className="text-[11px] font-medium" style={{ color: product.stock > 0 ? 'rgba(0,217,255,0.7)' : '#FF4D4D' }}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock por el momento'}
          </span>
        ) : (
          <>
            <span className="text-sm font-bold tracking-tight" style={{ color: '#FFFFFF' }}>
              ${product.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: product.in_stock ? '#00D9FF' : '#FF4D4D' }}
              />
              <span className="text-[11px]" style={{ color: product.in_stock ? 'rgba(0,217,255,0.7)' : '#FF4D4D' }}>
                {product.in_stock ? 'En stock' : 'Sin stock por el momento'}
              </span>
            </div>
          </>
        )}

        {/* Add button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          className="mt-2 w-full py-2 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-200"
          style={{
            backgroundColor: inCart ? 'rgba(0,217,255,0.1)' : '#00D9FF',
            color: inCart ? '#00D9FF' : '#0F1115',
          }}
          onMouseEnter={e => { if (!inCart) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,217,255,0.25)'; } }}
          onMouseLeave={e => { if (!inCart) { e.currentTarget.style.boxShadow = 'none'; } }}
        >
          {inCart ? "En carrito" : "Agregar"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton Card ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: '#1A1E27', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div
        className="aspect-[4/3] animate-pulse"
        style={{ backgroundColor: '#13161C' }}
      />
      <div className="p-3.5 flex flex-col gap-3">
        <div
          className="h-2 w-12 rounded-full animate-pulse"
          style={{ backgroundColor: '#252A36' }}
        />
        <div
          className="h-2.5 w-full rounded-full animate-pulse"
          style={{ backgroundColor: '#252A36' }}
        />
        <div
          className="h-2.5 w-16 rounded-full animate-pulse"
          style={{ backgroundColor: '#252A36' }}
        />
        <div
          className="h-2 w-10 rounded-full animate-pulse"
          style={{ backgroundColor: '#252A36' }}
        />
        <div
          className="h-8 w-full rounded-xl animate-pulse"
          style={{ backgroundColor: '#252A36' }}
        />
      </div>
    </div>
  );
}

/* ─── Grid wrapper ─────────────────────────────────────────────── */
function ProductGrid({ items }: { items: PublicInventoryResult[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mx-auto">
      {items.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mx-auto">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ─── HeroSearch main component ────────────────────────────────── */
export function HeroSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim();
  const hasSearch = trimmed.length > 0;

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = usePublicInventorySearch(trimmed, 20);

  /* ─── State machine ──────────────────────────────────────── */
  const state = (() => {
    if (isError) return "error" as const;
    if (isLoading) return "loading" as const;
    if (!hasSearch) return "idle" as const;
    // hasSearch && !isLoading
    return items.length === 0 ? ("empty" as const) : ("results" as const);
  })();

  const gridKey = `${state}-${trimmed}`;

  return (
    <section className="flex flex-col items-center gap-10 w-full">
      {/* ─── Headline ───────────────────────────────────────── */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-center max-w-3xl leading-[1.08]"
        style={{ color: C.text, fontFamily: '"Space Grotesk", sans-serif' }}
      >
        El repuesto exacto para tu modelo
      </motion.h1>

      {/* ─── Subheadline ────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm sm:text-base text-center max-w-lg leading-relaxed"
        style={{ color: C.textSec }}
      >
        Pantallas, baterías y componentes originales, con garantía escrita, para cientos de
        modelos.
      </motion.p>

      {/* ─── Search bar — Apple Spotlight style ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-auto"
      >
        <label className="sr-only" htmlFor="hero-search">
          Ej: pantalla iPhone 13, batería Samsung A54...
        </label>
        <div
          className="relative flex items-center transition-all duration-250"
          style={{
            height: 68,
            borderRadius: 9999,
            backgroundColor: C.surface,
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <MaterialIcon
            icon="search"
            size={20}
            style={{
              color: C.textTer,
              position: "absolute",
              left: 28,
              pointerEvents: "none",
            }}
          />
          <input
            id="hero-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: pantalla iPhone 13, batería Samsung A54..."
            className="w-full h-full bg-transparent outline-none text-sm sm:text-base"
            style={{
              padding: "0 28px 0 60px",
              color: C.text,
              borderRadius: 9999,
              caretColor: C.primary,
            }}
            onFocus={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.boxShadow = `0 0 0 2px ${getComputedStyle(document.documentElement).getPropertyValue("--c-primary").trim() || "#00D9FF"}, 0 4px 20px rgba(0,0,0,0.1)`;
                parent.style.transform = "scale(1.01)";
              }
            }}
            onBlur={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.boxShadow =
                  "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)";
                parent.style.transform = "scale(1)";
              }
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 p-1.5 rounded-full transition-all duration-150 cursor-pointer"
              style={{ color: C.textTer }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Limpiar búsqueda"
            >
              <MaterialIcon icon="close" size={18} wght={400} />
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Results area ───────────────────────────────────── */}
      <div className="w-full min-h-[320px]">
        <AnimatePresence mode="wait">
          {/* Idle — featured products */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              {items.length > 0 && (
                <>
                  <span
                    className="text-xs font-medium uppercase tracking-widest"
                    style={{ color: C.textTer }}
                  >
                    Los más buscados
                  </span>
                  <ProductGrid items={items} />
                </>
              )}
            </motion.div>
          )}

          {/* Loading — skeleton */}
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SkeletonGrid />
            </motion.div>
          )}

          {/* Results — product grid */}
          {state === "results" && (
            <motion.div
              key={gridKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: C.textTer }}
              >
                {items.length} {items.length === 1 ? "repuesto encontrado" : "repuestos encontrados"}
              </span>
              <ProductGrid items={items} />
            </motion.div>
          )}

          {/* Empty — no matches */}
          {state === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 py-20"
            >
              <MaterialIcon
                icon="search_off"
                size={48}
                style={{ color: C.textTer, opacity: 0.4 }}
              />
              <h3 className="text-lg font-semibold" style={{ color: C.text }}>
                No encontramos ese modelo
              </h3>
              <p
                className="text-sm max-w-xs text-center"
                style={{ color: C.textSec }}
              >
                Probá con otra marca o escribinos, seguro te ayudamos
              </p>
            </motion.div>
          )}

          {/* Error — fetch failed */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 py-20"
            >
              <MaterialIcon
                icon="error"
                size={32}
                style={{ color: C.textTer, opacity: 0.4 }}
              />
              <p className="text-sm" style={{ color: C.textSec }}>
                Hubo un problema con la búsqueda.
              </p>
              <button
                onClick={() => refetch()}
                className="px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer"
                style={{
                  color: C.primary,
                  backgroundColor: "var(--c-primary-12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--c-primary-20)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--c-primary-12)";
                }}
              >
                Intentar de nuevo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
