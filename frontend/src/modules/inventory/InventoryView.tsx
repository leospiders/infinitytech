import { useState, useEffect, useCallback } from 'react';
import { useCategories, useCreateProduct, useUpdateProduct, useCreateCategory } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, X, Plus, AlertTriangle } from 'lucide-react';
import type { Product } from '../../types';

export function InventoryView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [lowStockCount, setLowStockCount] = useState(0);
  const [dismissedLowStock, setDismissedLowStock] = useState(() =>
    localStorage.getItem('dismissedLowStock') === 'true'
  );

  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategory = useCreateCategory();
  const debouncedSearch = useDebounce(search, 300);

  const [form, setForm] = useState({ name: '', sku: '', category_id: 0, price: 0, cost: 0, stock: 0, low_stock_limit: 5 });

  useEffect(() => {
    if (categories?.length && !form.category_id) setForm(f => ({ ...f, category_id: categories[0].id }));
  }, [categories]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts(debouncedSearch, selectedCatId, page, 10);
      setProducts(data.items);
      setTotalPages(Math.ceil(data.total / 10));
    } catch {}
  }, [debouncedSearch, selectedCatId, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.getLowStockCount().then(res => setLowStockCount(res.count)).catch(() => {});
  }, []);

  const dismissLowStock = () => {
    setDismissedLowStock(true);
    localStorage.setItem('dismissedLowStock', 'true');
  };

  const resetForm = () => setForm({ name: '', sku: '', category_id: categories?.[0]?.id || 0, price: 0, cost: 0, stock: 0, low_stock_limit: 5 });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await createProduct.mutateAsync(form); setShowCreate(false); resetForm(); } catch {}
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try { await updateProduct.mutateAsync({ id: editing.id, data: form }); setShowEdit(false); setEditing(null); } catch {}
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, category_id: p.category_id, price: p.price, cost: p.cost, stock: p.stock, low_stock_limit: p.low_stock_limit });
    setShowEdit(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-deep">Inventory</h1>
          <p className="text-xs text-muted dark:text-dim">Manage products and stock alerts</p>
        </div>
          <button onClick={() => { resetForm(); setShowCreate(true); }} className="neo-btn py-2.5 px-4 text-xs font-semibold bg-brand text-white">+ Add Product</button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 h-4 w-4 text-dim" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or SKU..." className="neo-input w-full pl-10" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={selectedCatId || ''} onChange={e => { setSelectedCatId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} className="neo-input w-full md:w-48 text-xs">
            <option value="">All Categories</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
            <button onClick={() => { setCatForm({ name: '', description: '' }); setShowCategoryModal(true); }} className="neo-btn py-2.5 px-3 text-xs font-semibold shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
      </div>

      {!dismissedLowStock && lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-sm">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
          <span className="font-semibold text-danger"><strong>{lowStockCount}</strong> product{lowStockCount !== 1 ? 's' : ''} with low stock — consider reordering</span>
          <button onClick={dismissLowStock} className="ml-auto text-danger/50 hover:text-danger transition-colors" title="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {products.map(p => {
          const low = p.stock <= p.low_stock_limit;
          return (
            <div key={p.id} className={`neo-card p-4 flex flex-col gap-2 text-xs ${low ? 'border-red-500/20' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold ">#{p.id}</span>
                <span className="font-extrabold text-success">${p.price.toFixed(2)}</span>
              </div>
              <div className="font-semibold">{p.name}</div>
              <div className="flex justify-between text-muted">
                <span className="tracking-widest">{p.sku}</span>
                <span>{p.category?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={low ? 'text-danger font-bold' : ''}>Stock: {p.stock}</span>
                {low ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-danger/10 text-danger">Low Stock</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-success/10 text-success">Good</span>
                )}
              </div>
              <button onClick={() => openEdit(p)} className="neo-btn w-full py-2 text-xs font-semibold text-brand">Edit</button>
            </div>
          );
        })}
        {!products.length && (
          <div className="text-center text-xs text-dim py-12">No products found.</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block neo-card p-6 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-[#D2D6DC] dark:border-[#1F1E2E] text-muted">
              <th className="py-3">ID</th>
              <th className="py-3">Product</th>
              <th className="py-3">SKU</th>
              <th className="py-3">Category</th>
              <th className="py-3 text-right">Price</th>
              <th className="py-3 text-right">Stock</th>
              <th className="py-3 text-right">Status</th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const low = p.stock <= p.low_stock_limit;
              return (
                <tr key={p.id} className={`border-b border-[#E5E7EB] dark:border-black/5 hover:bg-black/5 ${low ? 'bg-red-500/5' : ''}`}>
                  <td className="py-3.5 font-bold ">#{p.id}</td>
                  <td className="py-3.5 font-semibold truncate">{p.name}</td>
                  <td className="py-3.5 font-mono text-[10px] tracking-widest">{p.sku}</td>
                  <td className="py-3.5">{p.category?.name || '-'}</td>
                  <td className="py-3.5 text-right font-extrabold text-success">${p.price.toFixed(2)}</td>
                  <td className="py-3.5 text-right font-bold">{p.stock}</td>
                  <td className="py-3.5 text-right">
                    {low ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-danger/10 text-danger">Low Stock</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-success/10 text-success">Good</span>
                    )}
                  </td>
                    <td className="py-3.5 text-right">
                      <button onClick={() => openEdit(p)} className="neo-btn py-1 px-2.5 text-[9px] font-semibold text-brand">Edit</button>
                    </td>
                </tr>
              );
            })}
            {!products.length && (
              <tr><td colSpan={8} className="py-8 text-center text-xs text-dim">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create/Edit Modals */}
      {(showCreate || (showEdit && editing)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-md w-full p-6 relative">
            <button onClick={() => { setShowCreate(false); setShowEdit(false); setEditing(null); resetForm(); }} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><X className="h-4 w-4" /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-brand/10 dark:border-[#1F1E2E] mb-4">
              {showCreate ? 'Add Product' : `Edit Product #${editing?.id}`}
            </h3>
            <form onSubmit={showCreate ? handleCreate : handleEdit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="font-semibold">Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div className="col-span-2">
                <label className="font-semibold">SKU *</label>
                <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div className="col-span-2">
                <label className="font-semibold">Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))} className="neo-input mt-1 w-full">
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold">Price</label>
                <input type="number" step="0.01" required value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Cost</label>
                <input type="number" step="0.01" required value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Stock</label>
                <input type="number" required value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Low Stock Limit</label>
                <input type="number" required value={form.low_stock_limit} onChange={e => setForm(f => ({ ...f, low_stock_limit: Number(e.target.value) }))} className="neo-input mt-1 w-full" />
              </div>
              <div className="flex gap-4 col-span-2 mt-2">
                <button type="button" onClick={() => { setShowCreate(false); setShowEdit(false); setEditing(null); resetForm(); }} className="neo-btn flex-1 py-3 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="neo-btn flex-1 py-3 text-xs font-semibold bg-brand text-white disabled:opacity-40">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category creation modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-sm w-full p-6 relative">
            <button onClick={() => setShowCategoryModal(false)} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><X className="h-4 w-4" /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-brand/10 dark:border-[#1F1E2E] mb-4">Add Category</h3>
            <form onSubmit={async (e) => { e.preventDefault(); try { await createCategory.mutateAsync(catForm); setShowCategoryModal(false); } catch {} }} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold">Name *</label>
                <input required value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Description</label>
                <input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="neo-btn flex-1 py-3 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={createCategory.isPending} className="neo-btn flex-1 py-3 text-xs font-semibold bg-brand text-white disabled:opacity-40">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
