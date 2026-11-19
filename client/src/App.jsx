import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import TakeawaysBanner from './components/TakeawaysBanner';
import ProductMatrixCard from './components/ProductMatrixCard';
import PeakTimesCard from './components/PeakTimesCard';
import ProfitSimulatorCard from './components/ProfitSimulatorCard';
import SlowMovingStockCard from './components/SlowMovingStockCard';
import ProductTable from './components/ProductTable';
import ErrorBoundary from './components/ErrorBoundary';
import analytics from '../../shared/analytics';
import {
  fetchSummary,
  fetchSalesTrend,
  fetchProductsPerformance,
  fetchCategories,
  fetchProducts,
  fetchTakeaways,
  fetchProductMatrix,
  fetchPeakTimes,
  fetchSlowMoving,
  resetSampleData
} from './api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Code-split heavy visualization & modal components
const TrendChart = React.lazy(() => import('./components/TrendChart'));
const ProductBarChart = React.lazy(() => import('./components/ProductBarChart'));
const CategoryPieChart = React.lazy(() => import('./components/CategoryPieChart'));
const AddSaleModal = React.lazy(() => import('./components/AddSaleModal'));
const FileUploadModal = React.lazy(() => import('./components/FileUploadModal'));

function ChartLoadingSkeleton({ height = 'h-72' }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors animate-pulse ${height} flex items-center justify-center`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400">Loading visualization...</span>
      </div>
    </div>
  );
}

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

  // Modal States
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Data States
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [productsPerformance, setProductsPerformance] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [takeawaysData, setTakeawaysData] = useState({ takeaways: [], margin: 0 });
  const [matrixData, setMatrixData] = useState(null);
  const [peakData, setPeakData] = useState(null);
  const [slowMovingData, setSlowMovingData] = useState(null);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Calculate dates when preset changes
  useEffect(() => {
    if (rangePreset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const todayUtc = new Date().toISOString().slice(0, 10);
    const anchor =
      trendData.length > 0 && trendData[trendData.length - 1]?.date
        ? trendData[trendData.length - 1].date
        : todayUtc;

    const range = analytics.getRollingRange(rangePreset, anchor);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }, [rangePreset, trendData]);

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
        const [
          summaryRes,
          trendRes,
          perfRes,
          catRes,
          catalogRes,
          takeawaysRes,
          matrixRes,
          peakRes,
          slowRes
        ] = await Promise.all([
          fetchSummary(filterParams),
          fetchSalesTrend({ ...filterParams, range: trendRange }),
          fetchProductsPerformance({
            ...filterParams,
            search,
            sortBy,
            order
          }),
          fetchCategories({ startDate: filterParams.startDate, endDate: filterParams.endDate }),
          fetchProducts(),
          fetchTakeaways(filterParams),
          fetchProductMatrix(filterParams),
          fetchPeakTimes(filterParams),
          fetchSlowMoving()
        ]);

        setSummary(summaryRes);
        setTrendData(trendRes);
        setProductsPerformance(perfRes);
        setCategories(catRes);
        setProductsCatalog(catalogRes);
        setTakeawaysData(takeawaysRes);
        setMatrixData(matrixRes);
        setPeakData(peakRes);
        setSlowMovingData(slowRes);
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

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset the database to the 12-month sample dataset?')) return;
    setIsResetting(true);
    try {
      await resetSampleData();
      handleResetFilters();
      await loadData(false);
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Navigation */}
      <Navbar
        onOpenAddSale={() => setIsAddSaleOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetData={handleResetDemoData}
        totalProducts={productsCatalog.length}
        isResetting={isResetting}
      />

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

        {/* FEATURE 3: Plain-English "Today's / Period Takeaway" Summary Box */}
        <ErrorBoundary title="Owner Takeaways Unavailable" onReset={() => loadData(false)}>
          <TakeawaysBanner
            takeaways={takeawaysData?.takeaways || []}
            margin={takeawaysData?.margin || summary?.profitMargin || 0}
            loading={loading}
          />
        </ErrorBoundary>

        {/* FEATURE 2: KPI Cards (Revenue vs Real Profit Clarity) */}
        <ErrorBoundary title="KPI Metrics Unavailable" onReset={() => loadData(false)}>
          <KpiCards summary={summary} loading={loading} />
        </ErrorBoundary>

        {/* Charts Section: Line Trend Chart Full Width */}
        <div className="mb-6">
          <ErrorBoundary title="Trend Visualizations Unavailable" onReset={() => loadData(false)}>
            <Suspense fallback={<ChartLoadingSkeleton height="h-72" />}>
              <TrendChart
                data={trendData}
                range={trendRange}
                setRange={setTrendRange}
                loading={loading}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* FEATURE 4: Product Performance Matrix (4-Bucket Classification) */}
        <div className="mb-6">
          <ErrorBoundary title="Product Matrix Unavailable" onReset={() => loadData(false)}>
            <ProductMatrixCard matrixData={matrixData} loading={loading} />
          </ErrorBoundary>
        </div>

        {/* Top 5 Bar & Category Donut in 2 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ErrorBoundary title="Product Rankings Unavailable" onReset={() => loadData(false)}>
            <Suspense fallback={<ChartLoadingSkeleton height="h-64" />}>
              <ProductBarChart products={productsPerformance} loading={loading} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary title="Category Breakdown Unavailable" onReset={() => loadData(false)}>
            <Suspense fallback={<ChartLoadingSkeleton height="h-64" />}>
              <CategoryPieChart categories={categories} loading={loading} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* FEATURE 5 & FEATURE 6: Peak Days/Hours and "What-If" Profit Simulator in 2 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ErrorBoundary title="Peak Hours Unavailable" onReset={() => loadData(false)}>
            <PeakTimesCard peakData={peakData} loading={loading} />
          </ErrorBoundary>
          <ErrorBoundary title="Profit Simulator Unavailable" onReset={() => loadData(false)}>
            <ProfitSimulatorCard products={productsPerformance} summary={summary} />
          </ErrorBoundary>
        </div>

        {/* FEATURE 7: Slow-Moving Stock Alert ("Cash Stuck on Shelves") */}
        <div className="mb-6">
          <ErrorBoundary title="Inventory Alerts Unavailable" onReset={() => loadData(false)}>
            <SlowMovingStockCard slowMovingData={slowMovingData} loading={loading} />
          </ErrorBoundary>
        </div>

        {/* Product Performance Detailed Table */}
        <ErrorBoundary
          title="Product Performance Table Unavailable"
          onReset={() => loadData(false)}
        >
          <ProductTable
            products={productsPerformance}
            loading={loading}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
          />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <p>
          SalesPulse • Small Business Sales & Margin Intelligence • React + Vite + Tailwind CSS +
          SQLite
        </p>
      </footer>

      {/* Add Sale Modal */}
      {isAddSaleOpen && (
        <Suspense fallback={null}>
          <AddSaleModal
            isOpen={isAddSaleOpen}
            onClose={() => setIsAddSaleOpen(false)}
            products={productsCatalog}
            onSaleCreated={() => loadData(true)}
          />
        </Suspense>
      )}

      {/* FEATURE 1: Excel & CSV File Upload Modal */}
      {isUploadOpen && (
        <Suspense fallback={null}>
          <FileUploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onDataImported={() => {
              handleResetFilters();
              loadData(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
