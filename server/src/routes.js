const express = require('express');
const router = express.Router();
const db = require('./db');
const analyticsModule = require('../../shared/analytics');
const analytics = analyticsModule.default || analyticsModule;
const schemasModule = require('../../shared/schemas');
const {
  createSaleSchema,
  summaryQuerySchema,
  salesTrendQuerySchema,
  productsPerformanceQuerySchema,
  categoriesQuerySchema
} = schemasModule.default || schemasModule;

// Schema validation middleware
function validate(schema, source = 'query') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Validation failed';
      return res.status(400).json({
        error: firstError,
        code: 'VALIDATION_ERROR',
        details: result.error.format()
      });
    }
    req.validated = result.data;
    next();
  };
}

// 1. GET /api/summary
// Query: startDate, endDate, category
router.get('/summary', validate(summaryQuerySchema, 'query'), (req, res) => {
  try {
    const { startDate, endDate, category } = req.validated;

    const hasCustomDates = Boolean(startDate && endDate);

    let whereClauses = [];
    let params = [];

    if (hasCustomDates) {
      whereClauses.push('s.sale_date >= ?');
      params.push(startDate);
      whereClauses.push('s.sale_date <= ?');
      params.push(endDate);
    } else {
      if (startDate) {
        whereClauses.push('s.sale_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('s.sale_date <= ?');
        params.push(endDate);
      }
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
    const totalRevenue = analytics.toDollars(analytics.toCents(currentStats.totalRevenue));
    const totalProfit = analytics.toDollars(analytics.toCents(currentStats.totalProfit));
    const totalSales = currentStats.totalSales;
    const totalUnits = currentStats.totalUnits;
    const profitMargin = analytics.calculateProfitMargin(totalRevenue, totalProfit);

    // Previous period calculation for % change
    let prevStats = { totalSales: 0, totalRevenue: 0, totalProfit: 0 };

    if (hasCustomDates) {
      const { prevStart, prevEnd } = analytics.getPriorDateRange(startDate, endDate);

      const prevWhere = ['s.sale_date >= ?', 's.sale_date <= ?'];
      const prevParams = [prevStart, prevEnd];
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
      const maxDateRow = db
        .prepare('SELECT MAX(sale_date) as maxDate, MIN(sale_date) as minDate FROM sales')
        .get();
      const maxDateStr = maxDateRow?.maxDate || analytics.formatUtcDate(new Date());
      const minDateStr = maxDateRow?.minDate || maxDateStr;

      const totalSpanDays = analytics.daysBetweenUtc(minDateStr, maxDateStr);
      if (totalSpanDays > 0) {
        const prevEnd = analytics.addDaysUtc(minDateStr, -1);
        const prevStart = analytics.addDaysUtc(prevEnd, -totalSpanDays);

        const prevWhere = ['s.sale_date >= ?', 's.sale_date <= ?'];
        const prevParams = [prevStart, prevEnd];
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
      }
    }

    const prevRev = analytics.toDollars(analytics.toCents(prevStats.totalRevenue));
    const prevProf = analytics.toDollars(analytics.toCents(prevStats.totalProfit));
    const prevSales = prevStats.totalSales;
    const prevMargin = analytics.calculateProfitMargin(prevRev, prevProf);

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
        salesChangePct: analytics.calculatePercentageChange(totalSales, prevSales),
        revenueChangePct: analytics.calculatePercentageChange(totalRevenue, prevRev),
        profitChangePct: analytics.calculatePercentageChange(totalProfit, prevProf),
        marginChangePct: Number((profitMargin - prevMargin).toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error in /api/summary:', error);
    res
      .status(500)
      .json({ error: 'Failed to retrieve sales summary', code: 'SUMMARY_QUERY_ERROR' });
  }
});

// 2. GET /api/sales-trend?range=monthly|weekly
router.get('/sales-trend', validate(salesTrendQuerySchema, 'query'), (req, res) => {
  try {
    const { range, startDate, endDate, category } = req.validated;

    let whereClauses = [];
    let params = [];

    if (startDate) {
      whereClauses.push('s.sale_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
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
      groupExpression = "strftime('%Y-W%W', s.sale_date)";
    } else if (range === 'daily') {
      groupExpression = 's.sale_date';
    } else {
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

    const formatted = rows.map(r => {
      const label = analytics.formatPeriodLabel(r.periodKey, range);
      const rev = analytics.toDollars(analytics.toCents(r.revenue));
      const prof = analytics.toDollars(analytics.toCents(r.profit));
      const margin = analytics.calculateProfitMargin(rev, prof);

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
    res.status(500).json({ error: 'Failed to retrieve sales trends', code: 'TREND_QUERY_ERROR' });
  }
});

// 3. GET /api/products/performance
router.get(
  '/products/performance',
  validate(productsPerformanceQuerySchema, 'query'),
  (req, res) => {
    try {
      const { search, category, sortBy, order, startDate, endDate } = req.validated;

      let productWhereClauses = [];
      let productParams = [];

      if (search) {
        productWhereClauses.push('p.name LIKE ?');
        productParams.push(`%${search}%`);
      }
      if (category && category !== 'All') {
        productWhereClauses.push('p.category = ?');
        productParams.push(category);
      }

      const productWhereSql =
        productWhereClauses.length > 0 ? `WHERE ${productWhereClauses.join(' AND ')}` : '';

      let salesDateConditions = [];
      let salesParams = [];

      if (startDate) {
        salesDateConditions.push('s.sale_date >= ?');
        salesParams.push(startDate);
      }
      if (endDate) {
        salesDateConditions.push('s.sale_date <= ?');
        salesParams.push(endDate);
      }

      const salesJoinCondition =
        salesDateConditions.length > 0 ? `AND ${salesDateConditions.join(' AND ')}` : '';

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
      LEFT JOIN sales s ON p.id = s.product_id ${salesJoinCondition}
      ${productWhereSql}
      GROUP BY p.id
    `;

      const allParams = [...salesParams, ...productParams];
      let rows = db.prepare(query).all(...allParams);

      rows = rows.map(item => {
        const rev = analytics.toDollars(analytics.toCents(item.totalRevenue));
        const prof = analytics.toDollars(analytics.toCents(item.totalProfit));
        const margin = analytics.calculateProfitMargin(rev, prof);
        return {
          ...item,
          costPrice: analytics.toDollars(analytics.toCents(item.costPrice)),
          sellingPrice: analytics.toDollars(analytics.toCents(item.sellingPrice)),
          totalRevenue: rev,
          totalProfit: prof,
          profitMargin: margin
        };
      });

      rows = analytics.assignProductBadges(rows);

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
      const isAsc = order === 'asc';

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
      res
        .status(500)
        .json({ error: 'Failed to retrieve product performance', code: 'PERFORMANCE_QUERY_ERROR' });
    }
  }
);

// 4. GET /api/categories
router.get('/categories', validate(categoriesQuerySchema, 'query'), (req, res) => {
  try {
    const { startDate, endDate } = req.validated;

    let salesDateConditions = [];
    let params = [];

    if (startDate) {
      salesDateConditions.push('s.sale_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      salesDateConditions.push('s.sale_date <= ?');
      params.push(endDate);
    }

    const salesJoinCondition =
      salesDateConditions.length > 0 ? `AND ${salesDateConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.category,
        COALESCE(SUM(s.quantity), 0) as unitsSold,
        COALESCE(SUM(s.revenue), 0) as revenue,
        COALESCE(SUM(s.profit), 0) as profit,
        COUNT(s.id) as transactionCount
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id ${salesJoinCondition}
      GROUP BY p.category
      ORDER BY revenue DESC
    `;

    const rows = db.prepare(query).all(...params);

    const totalRev = rows.reduce(
      (acc, cur) => acc + analytics.toDollars(analytics.toCents(cur.revenue)),
      0
    );

    const categories = rows.map(r => {
      const rev = analytics.toDollars(analytics.toCents(r.revenue));
      const prof = analytics.toDollars(analytics.toCents(r.profit));
      const share = totalRev > 0 ? Number(((rev / totalRev) * 100).toFixed(1)) : 0;
      const margin = analytics.calculateProfitMargin(rev, prof);

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
    res
      .status(500)
      .json({ error: 'Failed to retrieve category performance', code: 'CATEGORIES_QUERY_ERROR' });
  }
});

// 5. GET /api/products (Catalogue for Add Sale dropdown)
router.get('/products', (_req, res) => {
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

    const formatted = products.map(p => ({
      ...p,
      costPrice: analytics.toDollars(analytics.toCents(p.costPrice)),
      sellingPrice: analytics.toDollars(analytics.toCents(p.sellingPrice))
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({ error: 'Failed to retrieve products', code: 'PRODUCTS_QUERY_ERROR' });
  }
});

// 6. POST /api/sales
router.post('/sales', validate(createSaleSchema, 'body'), (req, res) => {
  try {
    const { productId, quantity, saleDate, sellingPrice } = req.validated;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.', code: 'NOT_FOUND' });
    }

    const finalDate = saleDate || analytics.formatUtcDate(new Date());
    const unitPrice = sellingPrice !== undefined ? sellingPrice : product.selling_price;
    const unitCost = product.cost_price;

    const revenue = analytics.calculateRevenue(quantity, unitPrice);
    const cost = analytics.calculateCost(quantity, unitCost);
    const profit = analytics.calculateProfit(revenue, cost);

    const insertStmt = db.prepare(`
      INSERT INTO sales (product_id, quantity, unit_cost, unit_price, revenue, profit, sale_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      product.id,
      quantity,
      unitCost,
      unitPrice,
      revenue,
      profit,
      finalDate
    );

    const newSale = {
      id: result.lastInsertRowid,
      productId: product.id,
      productName: product.name,
      category: product.category,
      quantity,
      unitCost: analytics.toDollars(analytics.toCents(unitCost)),
      unitPrice: analytics.toDollars(analytics.toCents(unitPrice)),
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
    res.status(500).json({ error: 'Failed to record sale', code: 'SALE_CREATION_ERROR' });
  }
});

module.exports = router;
