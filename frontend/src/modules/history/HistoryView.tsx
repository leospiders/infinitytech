import { useState } from 'react';
import { useHistory } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, ChevronDown, ChevronUp, Printer, RefreshCw, MessageCircle } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatDate } from '../../utils/formatDate';
import type { Sale, WorkOrder, HistoryItem } from '../../types';

export function HistoryView() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useHistory(debouncedSearch, typeFilter, page);

  const handlePrint = (item: HistoryItem) => {
    const url = item.type === 'sale'
      ? api.getReceiptPdfUrl(item.id)
      : api.getWorkOrderPdfUrl(item.id);
    window.open(url, '_blank');
  };

  const toggleExpand = (key: string) => {
    setExpandedId(expandedId === key ? null : key);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-deep">Unified History</h1>
          <p className="text-xs text-muted dark:text-dim">Sales receipts and repair orders</p>
        </div>
        <button onClick={() => refetch()} className="neo-btn py-2 px-4 text-xs font-semibold">
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 h-4 w-4 text-dim" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer, phone, ID..." className="neo-input w-full pl-10" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="neo-input w-full md:w-48 text-xs">
          <option value="">All Types</option>
          <option value="sale">Sales Only</option>
          <option value="repair">Repairs Only</option>
        </select>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? <TableSkeleton rows={5} /> : data?.items.map(item => {
          const key = `${item.type}-${item.id}`;
          const isExpanded = expandedId === key;
          return (
            <div key={key} onClick={() => toggleExpand(key)} className="neo-card p-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${item.type === 'sale' ? 'bg-success/15 text-success' : 'bg-brand/15 text-brand'}`}>
                    {item.type === 'sale' ? 'SALE' : 'REPAIR'}
                  </span>
                  <div>
                    <span className="font-bold text-sm ">#{item.id}</span>
                    <span className="text-xs text-muted dark:text-dim ml-2">{item.customer_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm">${item.total.toFixed(2)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    item.status === 'DELIVERED' || item.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
                  }`}>{item.status}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-muted" />}
                </div>
              </div>
              <div className="flex gap-4 mt-1 text-[10px] text-muted">
                <span>{formatDate(item.created_at)}</span>
                {item.payment_method && <span>Payment: {item.payment_method}</span>}
              </div>

              {isExpanded && (
                <div className="border-t pt-3 mt-3 flex flex-col gap-2 text-xs animate-in slide-in-from-top-2">
                  {item.type === 'sale' ? (
                    <>
                      <div className="font-semibold text-muted">Items:</div>
                      {(item.data as Sale).items.map(si => (
                        <div key={si.id} className="flex justify-between py-1 border-b dark:border-[#1F1E2E]">
                          <span>{(si as any).product?.name || `Product #${si.product_id}`} x{si.quantity}</span>
                          <span className="font-semibold">${si.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      {(item.data as Sale).discount > 0 && (
                        <div className="text-danger">Discount: -${(item.data as Sale).discount.toFixed(2)}</div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); handlePrint(item); }} className="neo-btn flex-1 py-2 text-[10px] font-semibold text-success flex items-center justify-center gap-2">
                          <Printer className="h-3.5 w-3.5" /> Reprint PDF
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); api.sharePdfOnWhatsApp(api.getReceiptPdfUrl(item.id), `Sale #${item.id} - Receipt`); }} className="neo-btn flex-1 py-2 text-[10px] font-semibold text-green-600 flex items-center justify-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><b>Device:</b> {(item.data as WorkOrder).brand} {(item.data as WorkOrder).model}</div>
                      <div><b>Defect:</b> {(item.data as WorkOrder).desperfecto}</div>
                      {(item.data as WorkOrder).diagnostico && <div><b>Diagnosis:</b> {(item.data as WorkOrder).diagnostico}</div>}
                      <div className="grid grid-cols-2 gap-2 border-t pt-2 dark:border-[#1F1E2E]">
                        <div>Total: <b>${(item.data as WorkOrder).total_cost.toFixed(2)}</b></div>
                        <div>Paid: <b>${(item.data as WorkOrder).amount_paid.toFixed(2)}</b></div>
                        <div className="col-span-2 font-extrabold text-danger">
                          Balance: ${((item.data as WorkOrder).total_cost - (item.data as WorkOrder).amount_paid).toFixed(2)}
                        </div>
                      </div>
                      {(item.data as WorkOrder).security_type && (
                        <div className="border-t pt-2 dark:border-[#1F1E2E]">
                          <span className="font-bold text-muted">Device Security:</span>
                          <div className="text-xs mt-1">
                            {(item.data as WorkOrder).security_type === 'PIN' ? (
                              <span><b>PIN:</b> <span className="font-mono text-brand">{(item.data as WorkOrder).security_value}</span></span>
                            ) : (
                              <span><b>Pattern:</b> <span className="text-brand">{(item.data as WorkOrder).security_value}</span></span>
                            )}
                          </div>
                        </div>
                      )}
                      {(item.data as WorkOrder).assignments?.length > 0 && (
                        <div className="border-t pt-2 dark:border-[#1F1E2E]">
                          <span className="font-bold text-muted">Transfer History:</span>
                          {(item.data as WorkOrder).assignments.map(a => (
                            <div key={a.id} className="text-[10px] bg-black/5 dark:bg-white/5 p-1 rounded mt-1">
                              {a.from_employee?.name || 'Intake'} → {a.to_employee.name}
                              {a.reason && <span className="italic text-muted">: "{a.reason}"</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); handlePrint(item); }} className="neo-btn flex-1 py-2 text-[10px] font-semibold text-brand flex items-center justify-center gap-2">
                          <Printer className="h-3.5 w-3.5" /> Print Work Order
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); api.sharePdfOnWhatsApp(api.getWorkOrderPdfUrl(item.id), `Work Order #${item.id}`); }} className="neo-btn flex-1 py-2 text-[10px] font-semibold text-green-600 flex items-center justify-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && !data?.items.length && (
          <div className="text-center text-xs text-dim py-12">No history records found.</div>
        )}
      </div>

      {data && data.total > data.limit && (
        <div className="flex justify-center items-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs">Page {data.page} of {Math.ceil(data.total / data.limit)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / data.limit)} className="neo-btn py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
