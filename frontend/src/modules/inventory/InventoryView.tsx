import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, useCreateCategory } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import type { Product } from '../../types';

/* ─── Color palette — via CSS vars (light/dark aware) ── */
const C = {
  bg: 'var(--c-bg)',
  surface: 'var(--c-surface)',
  hover: 'var(--c-hover)',
  primary: 'var(--c-primary)',
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  text: 'var(--c-text)',
  textSec: 'var(--c-text-sec)',
  border: 'var(--c-border)',
} as const;

/* ─── Status helper ──────────────────────────────── */
function statusBadge(stock: number, limit: number) {
  if (stock <= 0) return { label: 'Out of Stock', color: C.danger, bg: 'var(--c-danger-18)' };
  if (stock <= limit) return { label: 'Low Stock', color: C.warning, bg: 'var(--c-warning-18)' };
  return { label: 'Good', color: C.success, bg: 'var(--c-success-18)' };
}

/* ════════════════════════════════════════════════════ */

export function InventoryView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [stockFilter, setStockFilter] = useState<'all' | 'good' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [compact, setCompact] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [lowStockCount, setLowStockCount] = useState(0);
  const [dismissedLowStock, setDismissedLowStock] = useState(() =>
    localStorage.getItem('dismissedLowStock') === 'true',
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const { t } = useTranslation();
  const debouncedSearch = useDebounce(search, 300);

  const [form, setForm] = useState({
    name: '', sku: '', category_id: 0, price: 0, cost: 0, stock: 0, low_stock_limit: 5,
  });

  useEffect(() => {
    if (categories?.length && !form.category_id) setForm(f => ({ ...f, category_id: categories[0].id }));
  }, [categories]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts(debouncedSearch, selectedCatId, page, 25);
      setProducts(data.items);
      setTotalPages(Math.ceil(data.total / 25));
    } catch { /* empty */ }
  }, [debouncedSearch, selectedCatId, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.getLowStockCount().then(res => setLowStockCount(res.count)).catch(() => {});
  }, []);

  /* ── Keyboard shortcut: Ctrl+K / / ── */
  const isModalOpen = showCreate || showEdit || showCategoryModal;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  /* ── Client-side filter + sort ── */
  const filtered = (() => {
    let list = [...products];
    if (stockFilter === 'good') list = list.filter(p => p.stock > p.low_stock_limit);
    else if (stockFilter === 'low') list = list.filter(p => p.stock > 0 && p.stock <= p.low_stock_limit);
    else if (stockFilter === 'out') list = list.filter(p => p.stock <= 0);

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'stock-asc': return a.stock - b.stock;
        case 'stock-desc': return b.stock - a.stock;
        default: return 0;
      }
    });
    return list;
  })();

  /* ── Handlers ── */
  const dismissLowStock = () => {
    setDismissedLowStock(true);
    localStorage.setItem('dismissedLowStock', 'true');
  };

  const resetForm = () =>
    setForm({
      name: '', sku: '', category_id: categories?.[0]?.id || 0,
      price: 0, cost: 0, stock: 0, low_stock_limit: 5,
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync(form);
      setShowCreate(false);
      resetForm();
      fetchProducts();
    } catch { /* empty */ }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateProduct.mutateAsync({ id: editing.id, data: form });
      setShowEdit(false);
      setEditing(null);
      fetchProducts();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('inventory.deleteConfirm', 'Delete this product? This cannot be undone.'))) return;
    try {
      await deleteProduct.mutateAsync(id);
      fetchProducts();
    } catch { /* empty */ }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, category_id: p.category_id,
      price: p.price, cost: p.cost, stock: p.stock, low_stock_limit: p.low_stock_limit,
    });
    setShowEdit(true);
  };

  const clearFilters = () => {
    setSelectedCatId(undefined);
    setStockFilter('all');
    setSortBy('name-asc');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = selectedCatId !== undefined || stockFilter !== 'all' || sortBy !== 'name-asc' || search !== '';

  /* ── Shared styles ── */
  const selectClass =
    'rounded-lg px-3 py-[7px] text-xs font-medium outline-none cursor-pointer appearance-none';
  const inputBox =
    'w-full rounded-lg px-3 py-[7px] text-xs outline-none transition-all duration-150 placeholder:text-xs';

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto" style={{ color: C.text }}>
      {/* ════════════════ HEADER ════════════════ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left */}
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase mb-1.5"
            style={{ backgroundColor: 'var(--c-primary-18)', color: 'var(--c-primary)' }}
          >
            <MaterialIcon icon="inventory_2" wght={400} size={12} />
            Inventory System v4.0
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            {t('inventory.title')}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: C.textSec }}>
            {t('inventory.subtitle')}
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <MaterialIcon
              icon="search"
              size={14}
              wght={400}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--c-muted)' }}
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={`${t('inventory.searchPlaceholder')}  (/)`}
              className={inputBox}
              style={{
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                color: C.text,
                paddingLeft: '34px',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-primary-60)')}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-xs font-semibold transition-all duration-200 shrink-0"
            style={{ backgroundColor: C.primary, color: C.bg }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            <MaterialIcon icon="add" size={14} wght={400} />
            {t('inventory.addProduct')}
          </button>
        </div>
      </header>

      {/* ════════════════ FILTERS BAR ════════════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category */}
        <select
          value={selectedCatId ?? ''}
          onChange={e => { setSelectedCatId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className={`${selectClass} w-full sm:w-auto`}
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        >
          <option value="" style={{ backgroundColor: C.surface }}>{t('inventory.allCategories')}</option>
          {categories?.map(c => (
            <option key={c.id} value={c.id} style={{ backgroundColor: C.surface }}>{c.name}</option>
          ))}
        </select>

        {/* Stock filter */}
        <select
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value as typeof stockFilter)}
          className={`${selectClass} w-full sm:w-auto`}
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        >
          <option value="all" style={{ backgroundColor: C.surface }}>{t('inventory.allStock', 'All Stock')}</option>
          <option value="good" style={{ backgroundColor: C.surface }}>{t('inventory.good')}</option>
          <option value="low" style={{ backgroundColor: C.surface }}>{t('inventory.lowStock')}</option>
          <option value="out" style={{ backgroundColor: C.surface }}>{t('inventory.outOfStock', 'Out of Stock')}</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className={`${selectClass} w-full sm:w-auto`}
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        >
          <option value="name-asc" style={{ backgroundColor: C.surface }}>{t('inventory.sortName', 'Name A-Z')}</option>
          <option value="price-asc" style={{ backgroundColor: C.surface }}>{t('inventory.sortPriceAsc', 'Price ↑')}</option>
          <option value="price-desc" style={{ backgroundColor: C.surface }}>{t('inventory.sortPriceDesc', 'Price ↓')}</option>
          <option value="stock-asc" style={{ backgroundColor: C.surface }}>{t('inventory.sortStockAsc', 'Stock ↑')}</option>
          <option value="stock-desc" style={{ backgroundColor: C.surface }}>{t('inventory.sortStockDesc', 'Stock ↓')}</option>
        </select>

        {/* Reset */}
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-3 py-[7px] text-xs font-medium transition-all duration-150"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${hasActiveFilters ? 'var(--c-primary-40)' : C.border}`,
            color: hasActiveFilters ? 'var(--c-primary)' : C.textSec,
            opacity: hasActiveFilters ? 1 : 0.5,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary-60)'; }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = hasActiveFilters ? 'var(--c-primary-40)' : C.border;
          }}
        >
          <MaterialIcon icon="close" size={12} wght={400} />
          Reset
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Compact toggle */}
        <button
          onClick={() => setCompact(c => !c)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-xs font-medium transition-all duration-150"
          style={{
            backgroundColor: compact ? 'var(--c-primary-18)' : C.surface,
            border: `1px solid ${compact ? 'var(--c-primary-40)' : C.border}`,
            color: compact ? 'var(--c-primary)' : C.textSec,
          }}
        >
          <MaterialIcon icon={compact ? 'density_small' : 'density_medium'} size={14} wght={400} />
          {compact ? t('inventory.normalView', 'Normal') : t('inventory.compactView', 'Compact')}
        </button>

        {/* Add category */}
        <button
          onClick={() => { setCatForm({ name: '', description: '' }); setShowCategoryModal(true); }}
          className="flex items-center justify-center rounded-lg w-[31px] h-[31px] transition-all duration-150"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          title={t('inventory.addCategory')}
        >
          <MaterialIcon icon="add" size={14} style={{ color: C.textSec }} />
        </button>
      </div>

      {/* ════════════════ LOW STOCK ALERT ════════════════ */}
      {!dismissedLowStock && lowStockCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: 'var(--c-danger-12)', border: '1px solid var(--c-danger-30)' }}
        >
          <MaterialIcon icon="warning" size={16} style={{ color: C.danger }} />
          <span className="text-xs font-semibold" style={{ color: C.danger }}>
            {t('inventory.lowStockAlert', { count: lowStockCount })}
          </span>
          <button onClick={dismissLowStock} className="ml-auto" style={{ color: 'var(--c-danger-60)' }}>
            <MaterialIcon icon="close" size={14} />
          </button>
        </div>
      )}

      {/* ════════════════ TABLE ════════════════ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Sticky header */}
            <thead>
              <tr style={{ backgroundColor: 'var(--c-surface-alt)' }}>
                {(['id', 'sku', 'product', 'category', 'price', 'stock', 'status', 'actions'] as const).map(col => (
                  <th
                    key={col}
                    className={`text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                      col === 'id' || col === 'sku' ? 'hidden sm:table-cell' : ''
                    } ${col === 'category' ? 'hidden md:table-cell' : ''}`}
                    style={{
                      color: C.textSec,
                      padding: compact ? '8px 12px' : '12px 16px',
                      textAlign: col === 'price' || col === 'stock' || col === 'status' || col === 'actions' ? 'right' : 'left',
                    }}
                  >
                    {t(`inventory.${col === 'product' ? 'product' : col === 'sku' ? 'sku' : col === 'actions' ? 'actions' : col}`,
                      col === 'id' ? 'ID' : col === 'sku' ? 'SKU' : col === 'category' ? 'Category' : col === 'price' ? 'Price' : col === 'stock' ? 'Stock' : col === 'status' ? 'Status' : col === 'actions' ? 'Actions' : col,
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((p, idx) => {
                const badge = statusBadge(p.stock, p.low_stock_limit);
                return (
                  <tr
                    key={p.id}
                    className="group transition-colors duration-150"
                    style={{ borderTop: idx > 0 ? '1px solid var(--c-divider)' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.hover; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* ID */}
                    <td
                      className="font-mono tabular-nums whitespace-nowrap hidden sm:table-cell"
                      style={{
                        color: C.textSec,
                        padding: compact ? '8px 12px' : '12px 16px',
                        fontSize: compact ? '11px' : '12px',
                      }}
                    >
                      #{p.id}
                    </td>

                    {/* SKU — badge */}
                    <td className="hidden sm:table-cell" style={{ padding: compact ? '8px 12px' : '12px 16px' }}>
                      <span
                        className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider whitespace-nowrap"
                        style={{
                          backgroundColor: 'var(--c-divider)',
                          border: `1px solid ${C.border}`,
                          color: 'var(--c-text-sec)',
                        }}
                      >
                        {p.sku}
                      </span>
                    </td>

                    {/* Product name */}
                    <td
                      className="font-medium truncate max-w-[220px]"
                      style={{
                        color: C.text,
                        padding: compact ? '8px 12px' : '12px 16px',
                        fontSize: compact ? '12px' : '13px',
                      }}
                    >
                      {p.name}
                    </td>

                    {/* Category */}
                    <td
                      className="whitespace-nowrap hidden md:table-cell"
                      style={{
                        color: C.textSec,
                        padding: compact ? '8px 12px' : '12px 16px',
                        fontSize: compact ? '11px' : '12px',
                      }}
                    >
                      {p.category?.name || '-'}
                    </td>

                    {/* Price */}
                    <td
                      className="text-right font-semibold tabular-nums whitespace-nowrap"
                      style={{
                        color: C.primary,
                        padding: compact ? '8px 12px' : '12px 16px',
                        fontSize: compact ? '12px' : '13px',
                      }}
                    >
                      ${p.price.toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td
                      className="text-right font-semibold tabular-nums"
                      style={{
                        color: p.stock <= 0 ? C.danger : p.stock <= p.low_stock_limit ? C.warning : C.text,
                        padding: compact ? '8px 12px' : '12px 16px',
                        fontSize: compact ? '12px' : '13px',
                      }}
                    >
                      {p.stock}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: compact ? '8px 12px' : '12px 16px' }}>
                      <div className="flex justify-end">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {p.stock <= 0
                            ? t('inventory.outOfStock', 'Out of Stock')
                            : p.stock <= p.low_stock_limit
                              ? t('inventory.lowStock')
                              : t('inventory.good')}
                        </span>
                      </div>
                    </td>

                    {/* Actions — visible on hover */}
                    <td style={{ padding: compact ? '8px 12px' : '12px 16px' }}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex items-center justify-center w-7 h-7 rounded transition-all duration-150"
                          style={{ color: C.textSec }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-hover)'; e.currentTarget.style.color = C.text; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textSec; }}
                          title={t('inventory.edit')}
                        >
                          <MaterialIcon icon="edit" size={13} wght={400} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="flex items-center justify-center w-7 h-7 rounded transition-all duration-150"
                          style={{ color: C.textSec }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-18)'; e.currentTarget.style.color = C.danger; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textSec; }}
                          title={t('inventory.delete', 'Delete')}
                        >
                          <MaterialIcon icon="delete" size={13} wght={400} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filtered.length && (
          <div className="py-12 text-center text-xs" style={{ color: C.textSec }}>
            {t('inventory.noProducts')}
          </div>
        )}
      </div>

      {/* ════════════════ PAGINATION ════════════════ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg px-3 py-[7px] text-xs font-medium transition-all duration-150 disabled:opacity-30"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          >
            <MaterialIcon icon="chevron_left" size={14} wght={400} />
            {t('inventory.previous')}
          </button>

          <span className="text-xs" style={{ color: C.textSec }}>
            {t('inventory.page', { page, totalPages })}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg px-3 py-[7px] text-xs font-medium transition-all duration-150 disabled:opacity-30"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          >
            {t('inventory.next')}
            <MaterialIcon icon="chevron_right" size={14} wght={400} />
          </button>
        </div>
      )}

      {/* ════════════════ MODALS (create / edit) ════════════════ */}
      {(showCreate || (showEdit && editing)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="rounded-xl p-6 max-w-md w-full relative"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => { setShowCreate(false); setShowEdit(false); setEditing(null); resetForm(); }}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: C.textSec }}
            >
              <MaterialIcon icon="close" size={16} />
            </button>

            <h3 className="text-base font-bold mb-5" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              {showCreate ? t('inventory.addProductTitle') : t('inventory.editProductTitle', { id: editing?.id })}
            </h3>

            <form onSubmit={showCreate ? handleCreate : handleEdit} className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.name')}</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div className="col-span-2">
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.skuLabel')}</label>
                <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150 font-mono text-xs" />
              </div>
              <div className="col-span-2">
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.categoryLabel')}</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150 text-xs">
                  {categories?.map(c => <option key={c.id} value={c.id} style={{ backgroundColor: C.bg }}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.priceLabel')}</label>
                <input type="number" step="0.01" required value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div>
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.cost')}</label>
                <input type="number" step="0.01" required value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div>
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.stockLabel')}</label>
                <input type="number" required value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div>
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.lowStockLimit')}</label>
                <input type="number" required value={form.low_stock_limit} onChange={e => setForm(f => ({ ...f, low_stock_limit: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div className="flex gap-3 col-span-2 mt-2">
                <button type="button" onClick={() => { setShowCreate(false); setShowEdit(false); setEditing(null); resetForm(); }}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}>
                  {t('inventory.cancel')}
                </button>
                <button type="submit" disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 disabled:opacity-40"
                  style={{ backgroundColor: C.primary, color: C.bg }}>
                  {t('inventory.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════ CATEGORY MODAL ════════════════ */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-xl p-6 max-w-md w-full relative"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded"
              style={{ color: C.textSec }}>
              <MaterialIcon icon="close" size={16} />
            </button>
            <h3 className="text-base font-bold mb-5" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              {t('inventory.addCategory')}
            </h3>
            <form onSubmit={async (e) => { e.preventDefault(); try { await createCategory.mutateAsync(catForm); setShowCategoryModal(false); } catch {} }}
              className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.name')}</label>
                <input required value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div>
                <label className="font-semibold block mb-1" style={{ color: C.textSec }}>{t('inventory.description')}</label>
                <input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  className="w-full rounded-lg px-3 py-2 outline-none transition-all duration-150" />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}>
                  {t('inventory.cancel')}
                </button>
                <button type="submit" disabled={createCategory.isPending}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 disabled:opacity-40"
                  style={{ backgroundColor: C.primary, color: C.bg }}>
                  {t('inventory.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
