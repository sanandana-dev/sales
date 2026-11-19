import React, { useState, useEffect } from 'react';
import { X, Plus, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSale } from '../api';
import analytics from '../../../shared/analytics';

export default function AddSaleModal({ isOpen, onClose, products = [], onSaleCreated }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Set default product when products list is available
  useEffect(() => {
    if (products.length > 0 && !productId) {
      setProductId(products[0].id);
      setSellingPrice(products[0].sellingPrice);
    }
  }, [products, productId]);

  // Update default selling price when selected product changes
  const handleProductChange = id => {
    setProductId(id);
    const prod = products.find(p => p.id === Number(id));
    if (prod) {
      setSellingPrice(prod.sellingPrice);
    }
  };

  const selectedProduct = products.find(p => p.id === Number(productId));

  // Calculations for live preview using pure business logic functions
  const currentPrice = parseFloat(sellingPrice) || selectedProduct?.sellingPrice || 0;
  const currentCost = selectedProduct?.costPrice || 0;
  const currentQty = parseInt(quantity, 10) || 1;
  const estRevenue = analytics.calculateRevenue(currentQty, currentPrice);
  const estCost = analytics.calculateCost(currentQty, currentCost);
  const estProfit = analytics.calculateProfit(estRevenue, estCost);
  const estMargin = analytics.calculateProfitMargin(estRevenue, estProfit);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!productId) {
      setError('Please select a product.');
      return;
    }
    if (!quantity || quantity < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createSale({
        productId: Number(productId),
        quantity: Number(quantity),
        sellingPrice: Number(currentPrice),
        saleDate
      });

      setSuccessMsg(
        `Sale recorded! Revenue: $${res.sale.revenue.toFixed(2)}, Profit: $${res.sale.profit.toFixed(2)}`
      );

      if (onSaleCreated) {
        onSaleCreated(res.sale);
      }

      // Close modal after short delay
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Record New Sale
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Post transaction directly to SQLite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              value={productId}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — Default ${p.sellingPrice.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Price in 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center text-xs bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sale Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sale Date *
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2.5">
              <Calculator className="w-3.5 h-3.5 mr-1 text-blue-500" />
              Live Margin Calculation
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">Total Rev</div>
                <div className="font-bold text-blue-600 dark:text-blue-400">${estRevenue}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">COGS</div>
                <div className="font-bold text-slate-600 dark:text-slate-300">${estCost}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">Profit</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">${estProfit}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">Margin</div>
                <div className="font-bold text-amber-600 dark:text-amber-400">{estMargin}%</div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Sale</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
