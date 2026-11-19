import React from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle,
  CheckCircle2,
  Package,
  RotateCcw
} from 'lucide-react';
import analytics from '../../../shared/analytics';

export default function ProductTable({
  products = [],
  loading,
  search,
  setSearch,
  sortBy,
  order,
  onSort
}) {
  const formatCur = val => analytics.formatCurrency(val);

  const getSortIcon = field => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown
          className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      );
    }
    return order === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
    );
  };

  const getAriaSort = field => {
    if (sortBy !== field) return 'none';
    return order === 'asc' ? 'ascending' : 'descending';
  };

  const renderBadge = badge => {
    switch (badge) {
      case 'Best Seller':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <Star className="w-3 h-3 mr-1 fill-emerald-500 text-emerald-500" aria-hidden="true" />
            <span>Best Seller</span>
          </span>
        );
      case 'Slow Mover':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-500" aria-hidden="true" />
            <span>Slow Mover</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-3 h-3 mr-1 text-slate-400" aria-hidden="true" />
            <span>Moderate</span>
          </span>
        );
    }
  };

  return (
    <section
      aria-labelledby="product-performance-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors overflow-hidden"
    >
      {/* Header bar with title and search */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            id="product-performance-heading"
            className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span>Product Performance & Profitability</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed breakdown of units sold, revenue, gross margin, and inventory rank
          </p>
        </div>

        {/* Search Input with explicit label */}
        <div className="relative min-w-[260px]">
          <label htmlFor="product-search-input" className="sr-only">
            Search products by name
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="product-search-input"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name..."
            aria-label="Search products by name"
            className="min-h-[40px] w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-xs tabular-nums"
          aria-label="Product performance metrics table"
        >
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th scope="col" aria-sort={getAriaSort('name')} className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSort('name')}
                  className="min-h-[36px] flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Product Name"
                >
                  <span>Product</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4">
                Category
              </th>
              <th
                scope="col"
                aria-sort={getAriaSort('costPrice')}
                className="py-3.5 px-4 text-right"
              >
                <button
                  type="button"
                  onClick={() => onSort('costPrice')}
                  className="min-h-[36px] ml-auto flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Cost Price"
                >
                  <span>Cost</span>
                  {getSortIcon('costPrice')}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={getAriaSort('sellingPrice')}
                className="py-3.5 px-4 text-right"
              >
                <button
                  type="button"
                  onClick={() => onSort('sellingPrice')}
                  className="min-h-[36px] ml-auto flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Selling Price"
                >
                  <span>Price</span>
                  {getSortIcon('sellingPrice')}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={getAriaSort('unitsSold')}
                className="py-3.5 px-4 text-right"
              >
                <button
                  type="button"
                  onClick={() => onSort('unitsSold')}
                  className="min-h-[36px] ml-auto flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Units Sold"
                >
                  <span>Units</span>
                  {getSortIcon('unitsSold')}
                </button>
              </th>
              <th scope="col" aria-sort={getAriaSort('revenue')} className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onSort('revenue')}
                  className="min-h-[36px] ml-auto flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Total Revenue"
                >
                  <span>Revenue</span>
                  {getSortIcon('revenue')}
                </button>
              </th>
              <th scope="col" aria-sort={getAriaSort('profit')} className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onSort('profit')}
                  className="min-h-[36px] ml-auto flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Gross Profit"
                >
                  <span>Profit</span>
                  {getSortIcon('profit')}
                </button>
              </th>
              <th scope="col" aria-sort={getAriaSort('margin')} className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onSort('margin')}
                  className="min-h-[36px] ml-auto flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                  aria-label="Sort by Profit Margin"
                >
                  <span>Margin</span>
                  {getSortIcon('margin')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-16"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-10 ml-auto"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-5 bg-slate-100 dark:bg-slate-800/60 rounded-full w-20 mx-auto"></div>
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No products found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No catalog items match your search or filter parameters.
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="mt-3 inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear search</span>
                    </button>
                  )}
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
    </section>
  );
}
