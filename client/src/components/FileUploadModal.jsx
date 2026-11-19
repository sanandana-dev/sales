import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  X,
  FileText
} from 'lucide-react';
import { uploadSales, resetSampleData } from '../api';

export default function FileUploadModal({ isOpen, onClose, onDataImported }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [columnsDetected, setColumnsDetected] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = e => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  const processSelectedFile = incomingFile => {
    setError(null);
    setSuccessMessage(null);
    setFile(incomingFile);

    const fileName = incomingFile.name.toLowerCase();
    const isExcelOrCsv =
      fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!isExcelOrCsv) {
      setError('Please upload an Excel spreadsheet (.xlsx, .xls) or a CSV file (.csv).');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, {
          type: typeof data === 'string' ? 'binary' : 'array',
          cellDates: true
        });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Workbook contains no sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('The uploaded sheet is empty.');
        }

        const detectedCols = Object.keys(rawJson[0]);
        setColumnsDetected(detectedCols);

        // Normalize rows
        const normalized = rawJson.map(row => {
          // Flexible mapping
          const dateVal =
            row.Date ||
            row.date ||
            row['Sale Date'] ||
            row['Transaction Date'] ||
            row.timestamp ||
            new Date().toISOString().slice(0, 10);

          let dateStr = dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : String(dateVal);

          return {
            date: dateStr,
            product:
              row.Product ||
              row.product ||
              row['Product Name'] ||
              row.Item ||
              row.item ||
              row.Name ||
              'Item',
            category:
              row.Category ||
              row.category ||
              row.Department ||
              row.department ||
              'General',
            quantity: Number(row.Quantity || row.quantity || row.Qty || row.qty || row.Units || 1) || 1,
            price: Number(row.Price || row.price || row['Selling Price'] || row['Unit Price'] || 19.99) || 19.99,
            cost: row.Cost || row.cost || row['Cost Price'] || row['Unit Cost'] ? Number(row.Cost || row.cost || row['Cost Price'] || row['Unit Cost']) : undefined,
            discount: Number(row.Discount || row.discount || 0) || 0,
            stock: Number(row.Stock || row.stock || row['Stock Quantity'] || 50) || 50,
            time: String(row.Time || row.time || row['Sale Time'] || row.Hour || '14:00').slice(0, 5)
          };
        });

        setParsedRows(normalized);
        setPreviewRows(normalized.slice(0, 4));
      } catch (err) {
        console.error('File parsing error:', err);
        setError(`Failed to read spreadsheet: ${err.message}`);
      }
    };

    if (fileName.endsWith('.csv')) {
      reader.readAsText(incomingFile);
    } else {
      reader.readAsArrayBuffer(incomingFile);
    }
  };

  const handleUploadSubmit = async () => {
    if (!parsedRows || parsedRows.length === 0) {
      setError('No parsed rows to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await uploadSales(parsedRows, replaceExisting);
      setSuccessMessage(response.message || `Loaded ${parsedRows.length} transactions successfully!`);
      setTimeout(() => {
        onDataImported();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to submit sales data to server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database back to the clean 12-month sample dataset?')) return;
    setIsProcessing(true);
    setError(null);
    try {
      await resetSampleData();
      setSuccessMessage('Database reset to clean 12-month sample data!');
      setTimeout(() => {
        onDataImported();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to reset sample data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleHeaders = [
      'Date,Product Name,Category,Quantity,Selling Price,Cost Price,Discount,Stock Quantity,Sale Time\n'
    ];
    const sampleData = [
      '2026-11-15,Ultra-wide 34" Curved Monitor,Electronics,1,449.99,220.00,0,45,14:30\n',
      '2026-11-16,Pro Wireless Mechanical Keyboard,Electronics,2,119.99,45.00,10,35,11:15\n',
      '2026-11-17,Motorized Standing Desk Converter,Office,1,229.99,90.00,0,25,16:45\n',
      '2026-11-18,Full-Grain Leather Desk Pad,Office,3,39.99,12.00,0,60,13:20\n',
      '2026-11-19,Organic Cotton Heavyweight Hoodie,Apparel,2,68.00,22.00,5,50,18:00\n'
    ];

    const blob = new Blob([sampleHeaders.concat(sampleData).join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_dashboard_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 transition-colors animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          aria-label="Close upload dialog"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 id="upload-modal-title" className="text-lg font-bold">
              Import Excel or CSV Sales Data
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload your own business sales file to instantly update all charts & insights
            </p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 mx-auto text-blue-500 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">
            {file ? file.name : 'Click to select or drag and drop an Excel (.xlsx, .xls) or CSV file'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Columns supported: Date, Product, Category, Quantity, Price, Cost, Discount, Stock
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Parsed Preview */}
        {parsedRows.length > 0 && (
          <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {parsedRows.length} transactions detected in sheet
              </span>
              <span className="text-slate-400">
                Columns: {columnsDetected.slice(0, 5).join(', ')}
                {columnsDetected.length > 5 ? '...' : ''}
              </span>
            </div>

            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="py-1">Date</th>
                    <th className="py-1">Product</th>
                    <th className="py-1">Category</th>
                    <th className="py-1">Qty</th>
                    <th className="py-1">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-1">{r.date}</td>
                      <td className="py-1 font-medium text-slate-800 dark:text-slate-100">{r.product}</td>
                      <td className="py-1">{r.category}</td>
                      <td className="py-1">{r.quantity}</td>
                      <td className="py-1">${r.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="flex items-center gap-2 mt-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={e => setReplaceExisting(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Replace current dashboard data with this file (recommended for clean analytics)</span>
            </label>
          </div>
        )}

        {/* Demo Helper Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
            <button
              type="button"
              onClick={handleResetData}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-amber-200 dark:border-amber-800/50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={parsedRows.length === 0 || isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Data...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Update Dashboard with File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
