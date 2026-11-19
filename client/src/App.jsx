import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import TrendChart from './components/TrendChart';
import ProductBarChart from './components/ProductBarChart';
import CategoryPieChart from './components/CategoryPieChart';
import ProductTable from './components/ProductTable';
import AddSaleModal from './components/AddSaleModal';
import {
  fetchSummary,
  fetchSalesTrend,
  fetchProductsPerformance,
  fetchCategories,
  fetchProducts
} from './api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  // Filter States
  const [rangePreset, setRangePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('All');

  // Trend Chart interval
  const [trendRange, setTrendRange] = useState('monthly');

  // Product Table filters & sorting
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [order, setOrder] = useState('desc');

  // Modal State
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);

  // Data States
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [productsPerformance, setProductsPerformance] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Calculate dates when preset changes
  useEffect(() => {
    const today = new Date('2026-11-19T23:59:59'); // Anchor date for dataset
    const formatDate = d => d.toISOString().slice(0, 10);

    if (rangePreset === '30d') {
      const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (rangePreset === '90d') {
      const start = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (rangePreset === '12m') {
      const start = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (rangePreset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, [rangePreset]);

  // Load all dashboard data
  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const filterParams = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: category !== 'All' ? category : undefined
      };

      try {
        const [summaryRes, trendRes, perfRes, catRes, catalogRes] = await Promise.all([
          fetchSummary(filterParams),
          fetchSalesTrend({ ...filterParams, range: trendRange }),
          fetchProductsPerformance({
            ...filterParams,
            search,
            sortBy,
            order
          }),
          fetchCategories({ startDate: filterParams.startDate, endDate: filterParams.endDate }),
          fetchProducts()
        ]);

        setSummary(summaryRes);
        setTrendData(trendRes);
        setProductsPerformance(perfRes);
        setCategories(catRes);
        setProductsCatalog(catalogRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Error communicating with Sales API');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [startDate, endDate, category, trendRange, search, sortBy, order]
  );

  // Trigger load on filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = field => {
    if (sortBy === field) {
      setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setRangePreset('all');
    setStartDate('');
    setEndDate('');
    setCategory('All');
    setSearch('');
    setSortBy('revenue');
    setOrder('desc');
  };

  const handleSaleCreated = () => {
    loadData(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Navigation */}
      <Navbar onOpenAddSale={() => setIsAddSaleOpen(true)} totalProducts={productsCatalog.length} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert if any */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Failed to connect to Analytics Server</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Filters Controls */}
        <FilterBar
          rangePreset={rangePreset}
          setRangePreset={setRangePreset}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          category={category}
          setCategory={setCategory}
          categories={categories}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
          onReset={handleResetFilters}
        />

        {/* KPI Cards Top Row */}
        <KpiCards summary={summary} loading={loading} />

        {/* Charts Section: Line Trend Chart Full Width */}
        <div className="mb-6">
          <TrendChart
            data={trendData}
            range={trendRange}
            setRange={setTrendRange}
            loading={loading}
          />
        </div>

        {/* Charts Section: Top 5 Bar & Category Donut in 2 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ProductBarChart products={productsPerformance} loading={loading} />
          <CategoryPieChart categories={categories} loading={loading} />
        </div>

        {/* Product Performance Detailed Table */}
        <ProductTable
          products={productsPerformance}
          loading={loading}
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          order={order}
          onSort={handleSort}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <p>
          Small Business Sales Analytics Dashboard • React + Vite + Tailwind CSS + Recharts + SQLite
        </p>
      </footer>

      {/* Add Sale Modal */}
      <AddSaleModal
        isOpen={isAddSaleOpen}
        onClose={() => setIsAddSaleOpen(false)}
        products={productsCatalog}
        onSaleCreated={handleSaleCreated}
      />
    </div>
  );
}
