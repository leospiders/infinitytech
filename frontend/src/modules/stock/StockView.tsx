import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRepuestoStock } from '../../hooks/useApiQueries';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';

export function StockView() {
  const [search, setSearch] = useState('');
  const { data: items, isLoading, refetch } = useRepuestoStock(search);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {t('stock.title')}
          </h1>
          <p className="text-xs text-on-surface-variant">{t('stock.subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="neo-btn py-2 px-4 text-xs font-semibold self-start md:self-auto"
        >
          <MaterialIcon icon="refresh" size={12} wght={300} className="mr-2 animate-pulse" /> {t('stock.refresh')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
          <MaterialIcon icon="search" size={16} wght={300} />
        </span>
        <input
          type="text"
          placeholder={t('stock.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="neo-input pl-10 w-full"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 dark:border-outline-variant/10 text-on-surface-variant">
                  <th className="py-3 px-4">{t('stock.product')}</th>
                  <th className="py-3 px-4">{t('stock.sku')}</th>
                  <th className="py-3 px-4">{t('stock.category')}</th>
                  <th className="py-3 px-4 text-center">{t('stock.stock')}</th>
                  <th className="py-3 px-4 text-center">{t('stock.minLimit')}</th>
                  <th className="py-3 px-4 text-center">{t('stock.status')}</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(item => {
                  const isLow = item.stock <= item.low_stock_limit;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-outline-variant/10 dark:border-outline-variant/10 hover:bg-black/5 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold">{item.name}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{item.sku}</td>
                      <td className="py-4 px-4">{item.category?.name || '—'}</td>
                      <td className={`py-4 px-4 text-center font-bold ${isLow ? 'text-red-400' : ''}`}>
                        {item.stock}
                      </td>
                      <td className="py-4 px-4 text-center text-on-surface-variant">{item.low_stock_limit}</td>
                      <td className="py-4 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                            <MaterialIcon icon="warning" size={12} wght={300} /> {t('stock.lowStock')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                            {t('stock.ok')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!items?.length && (
            <div className="text-center py-12 text-on-surface-variant flex flex-col items-center gap-2">
              <MaterialIcon icon="inventory_2" size={40} wght={300} className="text-cyan-accent/30" />
              <span>{t('stock.empty')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
