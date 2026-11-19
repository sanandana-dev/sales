import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import SalesPerformanceBanner from './components/SalesPerformanceBanner';
import KPICardsRow from './components/KPICardsRow';
import MainRevenueProfitChart from './components/MainRevenueProfitChart';
import InsightsPanel from './components/InsightsPanel';
import TopProductsSection from './components/TopProductsSection';
import UpgradeBanner from './components/UpgradeBanner';
import AdvancedAnalyticsDrawer from './components/AdvancedAnalyticsDrawer';
import ErrorBoundary from './components/ErrorBoundary';
import analytics from '../../shared/analytics';
import {
  fetchSummary,
  fetchSalesTrend,
  fetchProductsPerformance,
  fetchCategories,
  fetchProducts,
  fetchProductMatrix,
  fetchPeakTimes,
  fetchSlowMoving,
  clearAllData,
  resetSampleData
} from './api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const AddSaleModal = React.lazy(() => import('./components/AddSaleModal'));
const FileUploadModal = React.lazy(() => import('./components/FileUploadModal'));

export default function App() {
  // Navigation & Drawer states
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Filter States
  const [rangePreset, setRangePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Trend Chart interval
  const [trendRange, setTrendRange] = useState('monthly');

  // Modal States
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Data States
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [productsPerformance, setProductsPerformance] = useState([]);
  const [, setCategories] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [peakData, setPeakData] = useState(null);
  const [slowMovingData, setSlowMovingData] = useState(null);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [, setIsRefreshing] = useState(false);
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
        endDate: endDate || undefined
      };

      try {
        const [summaryRes, trendRes, perfRes, catRes, catalogRes, matrixRes, peakRes, slowRes] =
          await Promise.all([
            fetchSummary(filterParams),
            fetchSalesTrend({ ...filterParams, range: trendRange }),
            fetchProductsPerformance({
              ...filterParams,
              search,
              sortBy: 'revenue',
              order: 'desc'
            }),
            fetchCategories({ startDate: filterParams.startDate, endDate: filterParams.endDate }),
            fetchProducts(),
            fetchProductMatrix(filterParams),
            fetchPeakTimes(filterParams),
            fetchSlowMoving()
          ]);

        setSummary(summaryRes);
        setTrendData(trendRes);
        setProductsPerformance(perfRes);
        setCategories(catRes);
        setProductsCatalog(catalogRes);
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
    [startDate, endDate, trendRange, search]
  );

  // Trigger load on filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNavClick = navId => {
    setActiveNav(navId);
    if (navId === 'analytics' || navId === 'products' || navId === 'reports') {
      setIsAdvancedOpen(true);
    }
  };

  const handleClearAllData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to clear all sales and demo data from the database? This cannot be undone.'
      )
    ) {
      return;
    }
    setIsClearing(true);
    try {
      await clearAllData();
      setRangePreset('all');
      setStartDate('');
      setEndDate('');
      setSearch('');
      await loadData(false);
    } catch (err) {
      alert(`Clear failed: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset database to the 12-month sample dataset?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetSampleData();
      setRangePreset('all');
      setStartDate('');
      setEndDate('');
      setSearch('');
      await loadData(false);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-[#172033] dark:text-[#E2E8F0] flex transition-colors font-sans antialiased">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={handleNavClick}
        onOpenAdvanced={() => setIsAdvancedOpen(true)}
        onClearData={handleClearAllData}
        onResetData={handleResetDemoData}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[175px]">
        {/* 2. Top Navigation & Action Bar */}
        <TopNavbar
          rangePreset={rangePreset}
          setRangePreset={setRangePreset}
          search={search}
          setSearch={setSearch}
          onOpenAddSale={() => setIsAddSaleOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onClearData={handleClearAllData}
          onResetDemoData={handleResetDemoData}
          isClearing={isClearing}
          isResetting={isResetting}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Dashboard Main Workspace */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-7 py-5">
          {/* Error Alert if API error occurs */}
          {error && (
            <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Failed to connect to SalesPulse API</p>
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

          {/* 3. Sales Performance Header Banner */}
          <div className="mb-5">
            <SalesPerformanceBanner
              growthPct={summary?.changes?.revenueChangePct || 0}
              hasSales={Boolean(summary && summary.totalSales > 0)}
            />
          </div>

          {/* 4. Top Row of 4 KPI Cards */}
          <div className="mb-5">
            <ErrorBoundary title="KPI Metrics Unavailable" onReset={() => loadData(false)}>
              <KPICardsRow summary={summary} trendData={trendData} loading={loading} />
            </ErrorBoundary>
          </div>

          {/* 5. Main Revenue/Profit Chart & 6. Right Insights Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-stretch">
            <div className="lg:col-span-8 flex flex-col">
              <ErrorBoundary
                title="Trend Visualizations Unavailable"
                onReset={() => loadData(false)}
              >
                <MainRevenueProfitChart
                  trendData={trendData}
                  range={trendRange}
                  setRange={setTrendRange}
                  loading={loading}
                />
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-4 flex flex-col">
              <ErrorBoundary title="Insights Unavailable" onReset={() => loadData(false)}>
                <InsightsPanel
                  summary={summary}
                  topProduct={productsPerformance[0]}
                  onViewAll={() => setIsAdvancedOpen(true)}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* 7. Top Products Section & 8. Upgrade Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-stretch">
            <div className="lg:col-span-8 flex flex-col">
              <ErrorBoundary title="Top Products Unavailable" onReset={() => loadData(false)}>
                <TopProductsSection
                  products={productsPerformance}
                  onViewAll={() => setIsAdvancedOpen(true)}
                />
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-4 flex flex-col">
              <UpgradeBanner onUpgradeClick={() => setIsAdvancedOpen(true)} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E2E8F0] dark:border-[#1E2436] py-4 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-[#151927]/50 transition-colors">
          <p>SalesPulse • Small Business Analytics & Intelligence • Exact Visual Edition</p>
        </footer>
      </div>

      {/* Slide-over Advanced Analytics Drawer (Matrix, Peak Hours, Simulator, Slow Stock, Full Table) */}
      <AdvancedAnalyticsDrawer
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        matrixData={matrixData}
        peakData={peakData}
        slowMovingData={slowMovingData}
        productsPerformance={productsPerformance}
        summary={summary}
        loading={loading}
      />

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

      {/* Excel & CSV File Upload Modal */}
      {isUploadOpen && (
        <Suspense fallback={null}>
          <FileUploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onDataImported={() => {
              setRangePreset('all');
              loadData(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
