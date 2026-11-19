const express = require('express');
const router = express.Router();
const db = require('./db');

// Helper to sanitize dates
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

// 1. GET /api/summary
// Query: startDate, endDate, category
router.get('/summary', (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    let whereClauses = [];
    let params = [];

    if (startDate && isValidDate(startDate)) {
      whereClauses.push('s.sale_date >= ?');
      params.push(startDate);
    }
    if (endDate && isValidDate(endDate)) {
      whereClauses.push('s.sale_date <= ?');
      params.push(endDate);
    }
    if (category && category !== 'All') {
      whereClauses.push('p.category = ?');
      params.push(category);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const currentQuery = `
      SELECT 
        COUNT(s.id) as totalSales,
        COALESCE(SUM(s.quantity), 0) as totalUnits,
        COALESCE(SUM(s.revenue), 0) as totalRevenue,
        COALESCE(SUM(s.profit), 0) as totalProfit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereSql}
    `;

    const currentStats = db.prepare(currentQuery).get(...params);
    const totalRevenue = Number(currentStats.totalRevenue.toFixed(2));
    const totalProfit = Number(
      currentStats.profit
        ? currentStats.totalProfit.toFixed(2)
        : currentStats.totalProfit.toFixed(2)
    );
    const totalSales = currentStats.totalSales;
    const totalUnits = currentStats.totalUnits;
    const profitMargin =
      totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(2)) : 0;

    // Previous period calculation for % change
    let prevStats = { totalSales: 0, totalRevenue: 0, totalProfit: 0 };
    if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      const prevStart = new Date(prevEnd.getTime() - diffMs);

      const prevStartStr = prevStart.toISOString().slice(0, 10);
      const prevEndStr = prevEnd.toISOString().slice(0, 10);

      let prevWhere = ['s.sale_date >= ?', 's.sale_date <= ?'];
      let prevParams = [prevStartStr, prevEndStr];
      if (category && category !== 'All') {
        prevWhere.push('p.category = ?');
        prevParams.push(category);
      }

      const prevQuery = `
        SELECT 
          COUNT(s.id) as totalSales,
          COALESCE(SUM(s.quantity), 0) as totalUnits,
          COALESCE(SUM(s.revenue), 0) as totalRevenue,
          COALESCE(SUM(s.profit), 0) as totalProfit
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE ${prevWhere.join(' AND ')}
      `;
      prevStats = db.prepare(prevQuery).get(...prevParams);
    } else {
      // If no date range specified, compare current 30 days vs previous 30 days
      const maxDateRow = db.prepare('SELECT MAX(sale_date) as maxDate FROM sales').get();
      const maxDate = maxDateRow && maxDateRow.maxDate ? new Date(maxDateRow.maxDate) : new Date();
      const prev30Start = new Date(maxDate.getTime() - 59 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const prev30End = new Date(maxDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      let pWhere = ['s.sale_date >= ?', 's.sale_date <= ?'];
      let pParams = [prev30Start, prev30End];
      if (category && category !== 'All') {
        pWhere.push('p.category = ?');
        pParams.push(category);
      }

      const prevQuery = `
        SELECT 
          COUNT(s.id) as totalSales,
          COALESCE(SUM(s.quantity), 0) as totalUnits,
          COALESCE(SUM(s.revenue), 0) as totalRevenue,
          COALESCE(SUM(s.profit), 0) as totalProfit
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE ${pWhere.join(' AND ')}
      `;
      prevStats = db.prepare(prevQuery).get(...pParams);
    }

    const prevRev = Number(prevStats.totalRevenue.toFixed(2));
    const prevProf = Number(prevStats.totalProfit.toFixed(2));
    const prevSales = prevStats.totalSales;
    const prevMargin = prevRev > 0 ? Number(((prevProf / prevRev) * 100).toFixed(2)) : 0;

    const calcPct = (curr, prev) => {
      if (!prev || prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    res.json({
      totalSales,
      totalUnits,
      totalRevenue,
      totalProfit,
      profitMargin,
      previousPeriod: {
        totalSales: prevSales,
        totalRevenue: prevRev,
        totalProfit: prevProf,
        profitMargin: prevMargin
      },
      changes: {
        salesChangePct: calcPct(totalSales, prevSales),
        revenueChangePct: calcPct(totalRevenue, prevRev),
        profitChangePct: calcPct(totalProfit, prevProf),
        marginChangePct: Number((profitMargin - prevMargin).toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error in /api/summary:', error);
    res.status(500).json({ error: 'Failed to retrieve sales summary' });
  }
});

// 2. GET /api/sales-trend?range=monthly|weekly
router.get('/sales-trend', (req, res) => {
  try {
    const { range = 'monthly', startDate, endDate, category } = req.query;

    let whereClauses = [];
    let params = [];

    if (startDate && isValidDate(startDate)) {
      whereClauses.push('s.sale_date >= ?');
      params.push(startDate);
    }
    if (endDate && isValidDate(endDate)) {
      whereClauses.push('s.sale_date <= ?');
      params.push(endDate);
    }
    if (category && category !== 'All') {
      whereClauses.push('p.category = ?');
      params.push(category);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let groupExpression;

    if (range === 'weekly') {
      // Group by Year and Week
      groupExpression = "strftime('%Y-W%W', s.sale_date)";
    } else if (range === 'daily') {
      groupExpression = 's.sale_date';
    } else {
      // Monthly default
      groupExpression = "strftime('%Y-%m', s.sale_date)";
    }

    const query = `
      SELECT 
        ${groupExpression} as periodKey,
        MIN(s.sale_date) as sampleDate,
        COUNT(s.id) as salesCount,
        COALESCE(SUM(s.quantity), 0) as unitsSold,
        COALESCE(SUM(s.revenue), 0) as revenue,
        COALESCE(SUM(s.profit), 0) as profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereSql}
      GROUP BY periodKey
      ORDER BY periodKey ASC
    `;

    const rows = db.prepare(query).all(...params);

    // Format human-friendly labels
    const formatted = rows.map(r => {
      let label = r.periodKey;
      if (range === 'monthly') {
        const [year, month] = r.periodKey.split('-');
        const dateObj = new Date(year, parseInt(month, 10) - 1, 1);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (range === 'weekly') {
        const parts = r.periodKey.split('-W');
        label = `W${parts[1]} '${parts[0].slice(2)}`;
      } else {
        const dateObj = new Date(r.periodKey);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      const rev = Number(r.revenue.toFixed(2));
      const prof = Number(r.profit.toFixed(2));
      const margin = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0;

      return {
        key: r.periodKey,
        label,
        date: r.sampleDate,
        salesCount: r.salesCount,
        unitsSold: r.unitsSold,
        revenue: rev,
        profit: prof,
        profitMargin: margin
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error in /api/sales-trend:', error);
    res.status(500).json({ error: 'Failed to retrieve sales trends' });
  }
});

// 3. GET /api/products/performance
router.get('/products/performance', (req, res) => {
  try {
    const {
      search = '',
      category = '',
      sortBy = 'revenue',
      order = 'desc',
      startDate,
      endDate
    } = req.query;

    let whereClauses = [];
    let params = [];

    if (search.trim()) {
      whereClauses.push('p.name LIKE ?');
      params.push(`%${search.trim()}%`);
    }
    if (category && category !== 'All') {
      whereClauses.push('p.category = ?');
      params.push(category);
    }
    if (startDate && isValidDate(startDate)) {
      whereClauses.push('s.sale_date >= ?');
      params.push(startDate);
    }
    if (endDate && isValidDate(endDate)) {
      whereClauses.push('s.sale_date <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.cost_price as costPrice,
        p.selling_price as sellingPrice,
        COALESCE(SUM(s.quantity), 0) as unitsSold,
        COALESCE(SUM(s.revenue), 0) as totalRevenue,
        COALESCE(SUM(s.profit), 0) as totalProfit,
        COUNT(s.id) as transactionCount
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      ${whereSql}
      GROUP BY p.id
    `;

    let rows = db.prepare(query).all(...params);

    // Calculate margins and numeric formatting
    rows = rows.map(item => {
      const rev = Number(item.totalRevenue.toFixed(2));
      const prof = Number(item.totalProfit.toFixed(2));
      const margin = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0;
      return {
        ...item,
        totalRevenue: rev,
        totalProfit: prof,
        profitMargin: margin
      };
    });

    // Assign Best Seller / Underperforming badges based on relative ranking
    if (rows.length > 0) {
      // Sort by total revenue descending to assign rankings
      const sortedByRev = [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue);
      const topCount = Math.max(1, Math.ceil(rows.length * 0.25));
      const bottomThreshold = Math.max(1, Math.floor(rows.length * 0.25));

      const topIds = new Set(sortedByRev.slice(0, topCount).map(r => r.id));
      const bottomIds = new Set(sortedByRev.slice(rows.length - bottomThreshold).map(r => r.id));

      rows = rows.map(r => {
        let badge = 'Moderate';
        if (topIds.has(r.id)) badge = 'Best Seller';
        else if (bottomIds.has(r.id)) badge = 'Slow Mover';
        return {
          ...r,
          badge
        };
      });
    }

    // Apply requested sort
    const validSortFields = {
      revenue: 'totalRevenue',
      profit: 'totalProfit',
      unitsSold: 'unitsSold',
      margin: 'profitMargin',
      name: 'name',
      costPrice: 'costPrice',
      sellingPrice: 'sellingPrice'
    };

    const sortField = validSortFields[sortBy] || 'totalRevenue';
    const isAsc = String(order).toLowerCase() === 'asc';

    rows.sort((a, b) => {
      if (typeof a[sortField] === 'string') {
        return isAsc
          ? a[sortField].localeCompare(b[sortField])
          : b[sortField].localeCompare(a[sortField]);
      }
      return isAsc ? a[sortField] - b[sortField] : b[sortField] - a[sortField];
    });

    res.json(rows);
  } catch (error) {
    console.error('Error in /api/products/performance:', error);
    res.status(500).json({ error: 'Failed to retrieve product performance' });
  }
});

// 4. GET /api/categories
router.get('/categories', (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClauses = [];
    let params = [];

    if (startDate && isValidDate(startDate)) {
      whereClauses.push('s.sale_date >= ?');
      params.push(startDate);
    }
    if (endDate && isValidDate(endDate)) {
      whereClauses.push('s.sale_date <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.category,
        COALESCE(SUM(s.quantity), 0) as unitsSold,
        COALESCE(SUM(s.revenue), 0) as revenue,
        COALESCE(SUM(s.profit), 0) as profit,
        COUNT(s.id) as transactionCount
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      ${whereSql}
      GROUP BY p.category
      ORDER BY revenue DESC
    `;

    const rows = db.prepare(query).all(...params);

    const totalRev = rows.reduce((acc, cur) => acc + cur.revenue, 0);

    const categories = rows.map(r => {
      const rev = Number(r.revenue.toFixed(2));
      const prof = Number(r.profit.toFixed(2));
      const share = totalRev > 0 ? Number(((rev / totalRev) * 100).toFixed(1)) : 0;
      const margin = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0;

      return {
        category: r.category,
        unitsSold: r.unitsSold,
        revenue: rev,
        profit: prof,
        profitMargin: margin,
        revenueSharePct: share,
        transactionCount: r.transactionCount
      };
    });

    res.json(categories);
  } catch (error) {
    console.error('Error in /api/categories:', error);
    res.status(500).json({ error: 'Failed to retrieve category performance' });
  }
});

// 5. GET /api/products (Catalogue for Add Sale dropdown)
router.get('/products', (req, res) => {
  try {
    const products = db
      .prepare(
        `
      SELECT id, name, category, cost_price as costPrice, selling_price as sellingPrice
      FROM products
      ORDER BY name ASC
    `
      )
      .all();

    res.json(products);
  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// 6. POST /api/sales
router.post('/sales', (req, res) => {
  try {
    const { productId, quantity, saleDate, sellingPrice } = req.body;

    // Validate productId
    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({ error: 'A valid Product ID is required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Validate quantity
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      return res.status(400).json({ error: 'Quantity must be an integer between 1 and 1000.' });
    }

    // Validate sale date (defaults to today)
    let finalDate = saleDate;
    if (!finalDate) {
      finalDate = new Date().toISOString().slice(0, 10);
    } else if (!isValidDate(finalDate)) {
      return res.status(400).json({ error: 'Sale date must be in YYYY-MM-DD format.' });
    }

    // Determine unit price and unit cost
    let unitPrice = product.selling_price;
    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') {
      const parsedPrice = parseFloat(sellingPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ error: 'Selling price must be a positive number.' });
      }
      unitPrice = parsedPrice;
    }

    const unitCost = product.cost_price;
    const revenue = Number((qty * unitPrice).toFixed(2));
    const cost = Number((qty * unitCost).toFixed(2));
    const profit = Number((revenue - cost).toFixed(2));

    const insertStmt = db.prepare(`
      INSERT INTO sales (product_id, quantity, unit_cost, unit_price, revenue, profit, sale_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(product.id, qty, unitCost, unitPrice, revenue, profit, finalDate);

    const newSale = {
      id: result.lastInsertRowid,
      productId: product.id,
      productName: product.name,
      category: product.category,
      quantity: qty,
      unitCost,
      unitPrice,
      revenue,
      profit,
      saleDate: finalDate
    };

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      sale: newSale
    });
  } catch (error) {
    console.error('Error in POST /api/sales:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

module.exports = router;
