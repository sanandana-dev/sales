import React from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle,
  CheckCircle2,
  Package
} from 'lucide-react';

export default function ProductTable({
  products = [],
  loading,
  search,
  setSearch,
  sortBy,
  order,
  onSort
}) {
  const formatCur = val =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val || 0);

  const getSortIcon = field => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return order === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
    );
  };

  const renderBadge = badge => {
    switch (badge) {
      case 'Best Seller':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <Star className="w-3 h-3 mr-1 fill-emerald-500 text-emerald-500" />
            Best Seller
          </span>
        );
      case 'Slow Mover':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
            Slow Mover
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-3 h-3 mr-1 text-slate-400" />
            Moderate
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
      {/* Header bar with title and search */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            Product Performance & Profitability
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed breakdown of units sold, revenue, gross margin, and inventory rank
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th
                onClick={() => onSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Product</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th className="py-3.5 px-4">Category</th>
              <th
                onClick={() => onSort('costPrice')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Cost</span>
                  {getSortIcon('costPrice')}
                </div>
              </th>
              <th
                onClick={() => onSort('sellingPrice')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Price</span>
                  {getSortIcon('sellingPrice')}
                </div>
              </th>
              <th
                onClick={() => onSort('unitsSold')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Units</span>
                  {getSortIcon('unitsSold')}
                </div>
              </th>
              <th
                onClick={() => onSort('revenue')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Revenue</span>
                  {getSortIcon('revenue')}
                </div>
              </th>
              <th
                onClick={() => onSort('profit')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Profit</span>
                  {getSortIcon('profit')}
                </div>
              </th>
              <th
                onClick={() => onSort('margin')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Margin</span>
                  {getSortIcon('margin')}
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Loading product metrics...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No products found matching your search criteria.
                </td>
              </tr>
            ) : (
              products.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {p.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                    {formatCur(p.costPrice)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900 dark:text-slate-200 font-medium">
                    {formatCur(p.sellingPrice)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-semibold">
                    {p.unitsSold.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatCur(p.totalRevenue)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCur(p.totalProfit)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-600 dark:text-amber-400">
                    {p.profitMargin}%
                  </td>
                  <td className="py-3 px-4 text-center">{renderBadge(p.badge)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="p-3.5 px-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Showing {products.length} products</span>
        <span className="text-[11px] text-slate-400">
          Sorted by {sortBy} ({order.toUpperCase()})
        </span>
      </div>
    </div>
  );
}
