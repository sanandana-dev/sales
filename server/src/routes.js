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

// ============================================================================
// HACKATHON ENHANCEMENTS: UPLOAD, RESET, PEAK TIMES, MATRIX, SLOW-MOVING, TAKEAWAYS
// ============================================================================

// 7. POST /api/reset — Reset database to realistic 12-month sample dataset
router.post('/reset', (_req, res) => {
  try {
    const { seedDatabase } = require('./seed');
    seedDatabase(true);
    res.json({
      success: true,
      message: 'Database successfully reset to clean 12-month sample data!'
    });
  } catch (error) {
    console.error('Error in /api/reset:', error);
    res.status(500).json({ error: 'Failed to reset sample data', code: 'RESET_ERROR' });
  }
});

// 8. POST /api/upload — Process batch parsed Excel / CSV rows
router.post('/upload', (req, res) => {
  try {
    const { sales, replaceExisting = true } = req.body;

    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({
        error: 'No sales records found in uploaded file. Please verify sheet format.',
        code: 'EMPTY_UPLOAD'
      });
    }

    const insertProductStmt = db.prepare(`
      INSERT INTO products (name, category, cost_price, selling_price, stock_quantity)
      VALUES (?, ?, ?, ?, ?)
    `);

    const findProductStmt = db.prepare('SELECT * FROM products WHERE LOWER(name) = LOWER(?)');

    const insertSaleStmt = db.prepare(`
      INSERT INTO sales (product_id, quantity, unit_cost, unit_price, revenue, profit, sale_date, sale_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const processUpload = db.transaction(items => {
      if (replaceExisting) {
        db.prepare('DELETE FROM sales').run();
        db.prepare('DELETE FROM products').run();
      }

      const productCache = new Map();
      let importedCount = 0;

      for (const row of items) {
        // Flexible field resolution with safe fallbacks
        const rawDate =
          row.date ||
          row.Date ||
          row.sale_date ||
          row['Sale Date'] ||
          row['Transaction Date'] ||
          row.timestamp;
        let dateStr = analytics.formatUtcDate(new Date());
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().slice(0, 10);
          }
        }

        const rawTime =
          row.time ||
          row.Time ||
          row.sale_time ||
          row['Sale Time'] ||
          row.hour ||
          row.Hour ||
          '14:00';
        const timeStr = String(rawTime).slice(0, 5);

        const productName = String(
          row.product ||
            row.Product ||
            row.product_name ||
            row['Product Name'] ||
            row.item ||
            row.Item ||
            row.name ||
            row.Name ||
            'Standard Item'
        ).trim();

        const category = String(
          row.category || row.Category || row.department || row.Department || 'General Merchandise'
        ).trim();

        const rawPrice =
          row.price ??
          row.Price ??
          row.unit_price ??
          row['Unit Price'] ??
          row['Selling Price'] ??
          row.selling_price ??
          row.revenue ??
          row.Revenue ??
          19.99;
        const unitPrice = Math.max(0.01, Number(rawPrice) || 19.99);

        const rawCost =
          row.cost ??
          row.Cost ??
          row.unit_cost ??
          row['Unit Cost'] ??
          row['Cost Price'] ??
          row.cost_price;
        // Safe fallback: default unit cost to 50% of price if unspecified
        const unitCost =
          rawCost !== undefined && !isNaN(Number(rawCost))
            ? Math.max(0, Number(rawCost))
            : Number((unitPrice * 0.5).toFixed(2));

        const quantity = Math.max(
          1,
          parseInt(
            row.quantity ?? row.Quantity ?? row.qty ?? row.Qty ?? row.units ?? row.Units ?? 1,
            10
          ) || 1
        );

        const discount = Math.max(0, Number(row.discount ?? row.Discount ?? 0) || 0);
        const stockQty = Math.max(
          0,
          Number(row.stock ?? row.Stock ?? row.stock_quantity ?? 45) || 45
        );

        // Lookup or insert product
        const lowerName = productName.toLowerCase();
        let product = productCache.get(lowerName);
        if (!product) {
          product = findProductStmt.get(productName);
          if (!product) {
            const info = insertProductStmt.run(
              productName,
              category,
              unitCost,
              unitPrice,
              stockQty
            );
            product = {
              id: info.lastInsertRowid,
              name: productName,
              category,
              cost_price: unitCost,
              selling_price: unitPrice,
              stock_quantity: stockQty
            };
          }
          productCache.set(lowerName, product);
        }

        // Exact financial cents arithmetic
        const effectivePrice = Math.max(0, unitPrice - discount);
        const revenue = analytics.calculateRevenue(quantity, effectivePrice);
        const cost = analytics.calculateCost(quantity, unitCost);
        const profit = analytics.calculateProfit(revenue, cost);

        insertSaleStmt.run(
          product.id,
          quantity,
          unitCost,
          effectivePrice,
          revenue,
          profit,
          dateStr,
          timeStr
        );

        importedCount++;
      }

      return { importedCount, productsCount: productCache.size };
    });

    const result = processUpload(sales);

    res.json({
      success: true,
      message: `Successfully loaded ${result.importedCount} transactions across ${result.productsCount} products!`,
      importedCount: result.importedCount,
      productsCount: result.productsCount
    });
  } catch (error) {
    console.error('Error in POST /api/upload:', error);
    res.status(500).json({
      error: `Failed to import file data: ${error.message}`,
      code: 'IMPORT_PROCESSING_ERROR'
    });
  }
});

// 9. GET /api/sample-data/csv — Download sample Excel/CSV template
router.get('/sample-data/csv', (_req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products LIMIT 25').all();
    const rows = [
      'Date,Product Name,Category,Quantity,Selling Price,Cost Price,Discount,Stock Quantity,Sale Time'
    ];

    const todayStr = analytics.formatUtcDate(new Date());

    products.forEach((p, idx) => {
      const dayOffset = (idx % 14) + 1;
      const d = analytics.addDaysUtc(todayStr, -dayOffset);
      const hour = 10 + (idx % 10);
      const timeStr = `${hour}:15`;
      rows.push(
        `"${d}","${p.name.replace(/"/g, '""')}","${p.category}",${(idx % 3) + 1},${p.selling_price},${p.cost_price},0,${p.stock_quantity || 40},"${timeStr}"`
      );
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="small_business_sales_sample.csv"');
    res.send(rows.join('\n'));
  } catch (error) {
    console.error('Error generating sample CSV:', error);
    res.status(500).json({ error: 'Failed to generate sample CSV', code: 'CSV_EXPORT_ERROR' });
  }
});

// 10. GET /api/analytics/peak-times — Staff & timing helper
router.get('/analytics/peak-times', (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
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

    // Day of week breakdown (0=Sunday ... 6=Saturday)
    const dayRows = db
      .prepare(
        `
      SELECT 
        CAST(strftime('%w', s.sale_date) AS INTEGER) as dayOfWeek,
        COUNT(s.id) as totalOrders,
        COALESCE(SUM(s.revenue), 0) as totalRevenue,
        COALESCE(SUM(s.profit), 0) as totalProfit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereSql}
      GROUP BY dayOfWeek
      ORDER BY dayOfWeek ASC
    `
      )
      .all(...params);

    const DAY_NAMES = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    const dayData = DAY_NAMES.map((name, index) => {
      const match = dayRows.find(r => r.dayOfWeek === index);
      const revenue = match ? analytics.toDollars(analytics.toCents(match.totalRevenue)) : 0;
      const orders = match ? match.totalOrders : 0;
      return {
        dayIndex: index,
        day: name,
        shortDay: name.slice(0, 3),
        orders,
        revenue,
        avgTicket: orders > 0 ? Number((revenue / orders).toFixed(2)) : 0
      };
    });

    // Identify busiest and slowest day
    const sortedDays = [...dayData].sort((a, b) => b.revenue - a.revenue);
    const busiestDay = sortedDays[0] || { day: 'Saturday', revenue: 0, orders: 0 };
    const slowestDay = sortedDays[sortedDays.length - 1] || {
      day: 'Tuesday',
      revenue: 0,
      orders: 0
    };

    // Hourly breakdown
    const hourRows = db
      .prepare(
        `
      SELECT 
        CAST(SUBSTR(COALESCE(s.sale_time, '14:00'), 1, 2) AS INTEGER) as hourNum,
        COUNT(s.id) as totalOrders,
        COALESCE(SUM(s.revenue), 0) as totalRevenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereSql}
      GROUP BY hourNum
      ORDER BY hourNum ASC
    `
      )
      .all(...params);

    const hoursData = [];
    for (let h = 9; h <= 21; h++) {
      const match = hourRows.find(r => r.hourNum === h);
      const orders = match ? match.totalOrders : 0;
      const revenue = match ? analytics.toDollars(analytics.toCents(match.totalRevenue)) : 0;
      const label = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      hoursData.push({
        hour: h,
        label,
        orders,
        revenue
      });
    }

    const sortedHours = [...hoursData].sort((a, b) => b.revenue - a.revenue);
    const busiestHour = sortedHours[0] || { label: '2 PM', orders: 0 };
    const slowestHour = sortedHours[sortedHours.length - 1] || { label: '10 AM', orders: 0 };

    res.json({
      dayData,
      hoursData,
      busiestDay: busiestDay.day,
      slowestDay: slowestDay.day,
      busiestHour: busiestHour.label,
      slowestHour: slowestHour.label,
      staffingTip: `Your peak shopping period is ${busiestDay.day} around ${busiestHour.label}. Schedule extra customer support and floor staff.`,
      promotionTip: `${slowestDay.day} mornings (${slowestHour.label}) see lowest volume. Ideal window for flash deals or happy hour promos.`
    });
  } catch (error) {
    console.error('Error in /api/analytics/peak-times:', error);
    res.status(500).json({ error: 'Failed to retrieve peak times', code: 'PEAK_TIMES_ERROR' });
  }
});

// 11. GET /api/products/matrix — 4-Bucket product performance matrix
router.get('/products/matrix', (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
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

    const products = db
      .prepare(
        `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.cost_price as costPrice,
        p.selling_price as sellingPrice,
        COALESCE(p.stock_quantity, 45) as stockQuantity,
        COUNT(s.id) as ordersCount,
        COALESCE(SUM(s.quantity), 0) as unitsSold,
        COALESCE(SUM(s.revenue), 0) as totalRevenue,
        COALESCE(SUM(s.profit), 0) as totalProfit
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id ${whereSql.replace('WHERE', 'AND')}
      GROUP BY p.id
    `
      )
      .all(...params);

    if (products.length === 0) {
      return res.json({
        stars: [],
        crowdPullers: [],
        hiddenGems: [],
        deadWeight: [],
        medianUnits: 0,
        medianMargin: 0
      });
    }

    const processed = products.map(p => {
      const revenue = analytics.toDollars(analytics.toCents(p.totalRevenue));
      const profit = analytics.toDollars(analytics.toCents(p.totalProfit));
      const margin = analytics.calculateProfitMargin(revenue, profit);
      return {
        ...p,
        totalRevenue: revenue,
        totalProfit: profit,
        profitMargin: margin,
        cashTiedUp: Number(((p.stockQuantity || 0) * p.costPrice).toFixed(2))
      };
    });

    // Calculate median units and median profit margin
    const sortedByUnits = [...processed].sort((a, b) => a.unitsSold - b.unitsSold);
    const sortedByMargin = [...processed].sort((a, b) => a.profitMargin - b.profitMargin);
    const midIdx = Math.floor(processed.length / 2);
    const medianUnits = sortedByUnits[midIdx]?.unitsSold || 0;
    const medianMargin = sortedByMargin[midIdx]?.profitMargin || 0;

    const stars = [];
    const crowdPullers = [];
    const hiddenGems = [];
    const deadWeight = [];

    processed.forEach(p => {
      const isHighVolume = p.unitsSold >= medianUnits;
      const isHighMargin = p.profitMargin >= medianMargin;

      if (isHighVolume && isHighMargin) {
        stars.push({
          ...p,
          bucket: 'Stars',
          action: 'Keep in stock always',
          color: 'emerald',
          description: 'High volume & high profit. Your core revenue engine.'
        });
      } else if (isHighVolume && !isHighMargin) {
        crowdPullers.push({
          ...p,
          bucket: 'Crowd Pullers',
          action: 'Bundle with high-margin items',
          color: 'blue',
          description: 'High volume & lower margin. Drives customer traffic.'
        });
      } else if (!isHighVolume && isHighMargin) {
        hiddenGems.push({
          ...p,
          bucket: 'Hidden Gems',
          action: 'Promote these more',
          color: 'amber',
          description: 'Low volume & high margin. Great upside if featured.'
        });
      } else {
        deadWeight.push({
          ...p,
          bucket: 'Dead Weight',
          action: 'Put on clearance sale',
          color: 'rose',
          description: 'Low volume & low margin. Ties up shelf space and cash.'
        });
      }
    });

    res.json({
      stars,
      crowdPullers,
      hiddenGems,
      deadWeight,
      medianUnits,
      medianMargin,
      totalCatalog: processed.length
    });
  } catch (error) {
    console.error('Error in /api/products/matrix:', error);
    res.status(500).json({ error: 'Failed to compute product matrix', code: 'MATRIX_ERROR' });
  }
});

// 12. GET /api/analytics/slow-moving — Inventory velocity & tied-up cash alert
router.get('/analytics/slow-moving', (req, res) => {
  try {
    const products = db
      .prepare(
        `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.cost_price as costPrice,
        p.selling_price as sellingPrice,
        COALESCE(p.stock_quantity, 45) as stockQuantity,
        COALESCE(SUM(s.quantity), 0) as recentUnitsSold,
        COALESCE(SUM(s.revenue), 0) as recentRevenue,
        MAX(s.sale_date) as lastSaleDate
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id AND s.sale_date >= date('now', '-30 days')
      GROUP BY p.id
      ORDER BY recentUnitsSold ASC, stockQuantity DESC
    `
      )
      .all();

    let totalCashStuck = 0;
    const items = products.map(p => {
      const tiedUp = Number(((p.stockQuantity || 0) * p.costPrice).toFixed(2));
      totalCashStuck += tiedUp;
      return {
        ...p,
        cashTiedUp: tiedUp,
        daysSinceLastSale: p.lastSaleDate
          ? analytics.daysBetweenUtc(p.lastSaleDate, analytics.formatUtcDate(new Date()))
          : '30+'
      };
    });

    // Lowest 4 velocity items
    const slowItems = items.slice(0, 5);

    res.json({
      totalCashStuck: Number(totalCashStuck.toFixed(2)),
      slowProducts: slowItems,
      recommendation:
        totalCashStuck > 0
          ? `You have ~$${totalCashStuck.toLocaleString()} tied up in slow-moving inventory. Consider running a 15–20% clearance promo to unlock liquidity.`
          : 'Inventory velocity is healthy with no critically stagnant items.'
    });
  } catch (error) {
    console.error('Error in /api/analytics/slow-moving:', error);
    res
      .status(500)
      .json({ error: 'Failed to retrieve slow moving inventory', code: 'SLOW_STOCK_ERROR' });
  }
});

// 13. GET /api/analytics/takeaways — Plain-English executive briefing
router.get('/analytics/takeaways', (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
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

    const summaryRow = db
      .prepare(
        `
      SELECT 
        COUNT(s.id) as totalOrders,
        COALESCE(SUM(s.revenue), 0) as totalRevenue,
        COALESCE(SUM(s.profit), 0) as totalProfit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereSql}
    `
      )
      .get(...params);

    const totalRev = analytics.toDollars(analytics.toCents(summaryRow.totalRevenue));
    const totalProf = analytics.toDollars(analytics.toCents(summaryRow.totalProfit));
    const margin = analytics.calculateProfitMargin(totalRev, totalProf);

    // Top product
    const topProd = db
      .prepare(
        `
      SELECT 
        p.name,
        COALESCE(SUM(s.revenue), 0) as revenue,
        COALESCE(SUM(s.profit), 0) as profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereSql}
      GROUP BY p.id
      ORDER BY profit DESC
      LIMIT 1
    `
      )
      .get(...params);

    const takeaways = [];

    // 1. Overall momentum
    takeaways.push({
      type: 'revenue',
      title: 'Healthy Revenue Generation',
      text: `Your business generated $${totalRev.toLocaleString()} across ${summaryRow.totalOrders.toLocaleString()} customer orders with an overall profit margin of ${margin}%.`
    });

    // 2. Real profit clarity
    takeaways.push({
      type: 'profit',
      title: 'Real Profit Kept',
      text: `You kept $${Math.round(margin)} in pure profit for every $100 collected at the register (Total net profit: $${totalProf.toLocaleString()}).`
    });

    // 3. Top performer
    if (topProd) {
      const topProdProfit = analytics.toDollars(analytics.toCents(topProd.profit));
      takeaways.push({
        type: 'star',
        title: 'Top Profit Engine',
        text: `"${topProd.name}" is your highest grossing earner, generating $${topProdProfit.toLocaleString()} in net profit alone.`
      });
    }

    // 4. Action tip
    takeaways.push({
      type: 'action',
      title: 'Actionable Owner Tip',
      text: 'Weekend afternoons drive peak traffic. Ensure high-margin Star items are prominently displayed and well-stocked.'
    });

    res.json({
      takeaways,
      margin,
      profitKeptPer100: Math.round(margin)
    });
  } catch (error) {
    console.error('Error in /api/analytics/takeaways:', error);
    res.status(500).json({ error: 'Failed to generate takeaways', code: 'TAKEAWAYS_ERROR' });
  }
});

module.exports = router;
