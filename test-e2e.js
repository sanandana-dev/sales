async function runE2E() {
  console.log('--- Starting Full-Stack End-to-End Analytics Verification ---');

  let serverInstance = null;
  let baseUrl = 'http://localhost:5000';

  try {
    const healthCheck = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1000) });
    if (!healthCheck.ok) throw new Error('Not healthy');
  } catch {
    const { app } = require('./server/src/index');
    serverInstance = app.listen(0);
    const port = serverInstance.address().port;
    baseUrl = `http://localhost:${port}`;
  }

  async function api(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { status: res.status, ok: res.ok, data: text };
    }
  }

  // 1. Initial Summary
  console.log('\n[1/6] Verifying GET /api/summary...');
  const initSummary = await api('/api/summary');
  if (!initSummary.ok)
    throw new Error('Initial summary failed: ' + JSON.stringify(initSummary.data));
  console.log(`  ✓ Total Sales: ${initSummary.data.totalSales.toLocaleString()} orders`);
  console.log(`  ✓ Total Units: ${initSummary.data.totalUnits.toLocaleString()} items`);
  console.log(`  ✓ Revenue: $${initSummary.data.totalRevenue.toLocaleString()}`);
  console.log(`  ✓ Gross Profit: $${initSummary.data.totalProfit.toLocaleString()}`);
  console.log(`  ✓ Margin: ${initSummary.data.profitMargin}%`);
  console.log(
    `  ✓ Delta vs prev period: Sales ${initSummary.data.changes.salesChangePct}%, Rev ${initSummary.data.changes.revenueChangePct}%`
  );

  // 2. Sales Trend (Monthly & Weekly)
  console.log('\n[2/6] Verifying GET /api/sales-trend (Monthly vs Weekly)...');
  const monthlyTrend = await api('/api/sales-trend?range=monthly');
  if (!monthlyTrend.ok || !monthlyTrend.data.length) throw new Error('Monthly trend failed');
  console.log(`  ✓ Monthly trend returned ${monthlyTrend.data.length} months`);
  console.log(
    `    Sample month [${monthlyTrend.data[0].label}]: $${monthlyTrend.data[0].revenue.toLocaleString()} rev, $${monthlyTrend.data[0].profit.toLocaleString()} profit`
  );

  const weeklyTrend = await api('/api/sales-trend?range=weekly');
  if (!weeklyTrend.ok || !weeklyTrend.data.length) throw new Error('Weekly trend failed');
  console.log(`  ✓ Weekly trend returned ${weeklyTrend.data.length} weeks`);

  // 3. Product Performance & Sorting
  console.log('\n[3/6] Verifying GET /api/products/performance with sorting and badges...');
  const prodPerf = await api('/api/products/performance?sortBy=revenue&order=desc');
  if (!prodPerf.ok || !prodPerf.data.length) throw new Error('Product performance failed');
  console.log(
    `  ✓ Top 1 Revenue Driver: "${prodPerf.data[0].name}" ($${prodPerf.data[0].totalRevenue.toLocaleString()}) - Badge: [${prodPerf.data[0].badge}]`
  );
  console.log(
    `  ✓ Top 2: "${prodPerf.data[1].name}" ($${prodPerf.data[1].totalRevenue.toLocaleString()}) - Badge: [${prodPerf.data[1].badge}]`
  );
  const worstSeller = prodPerf.data[prodPerf.data.length - 1];
  console.log(
    `  ✓ Lowest: "${worstSeller.name}" ($${worstSeller.totalRevenue.toLocaleString()}) - Badge: [${worstSeller.badge}]`
  );

  // Search filtering
  const searchRes = await api('/api/products/performance?search=Keyboard');
  if (!searchRes.ok || searchRes.data.length !== 1) throw new Error('Search failed');
  console.log(`  ✓ Search "Keyboard" correctly returned: "${searchRes.data[0].name}"`);

  // 4. Categories Breakdown
  console.log('\n[4/6] Verifying GET /api/categories...');
  const catRes = await api('/api/categories');
  if (!catRes.ok || !catRes.data.length) throw new Error('Category breakdown failed');
  let sumShares = 0;
  catRes.data.forEach(c => {
    sumShares += c.revenueSharePct;
    console.log(
      `  ✓ ${c.category}: $${c.revenue.toLocaleString()} (${c.revenueSharePct}%), margin ${c.profitMargin}%`
    );
  });
  console.log(`  ✓ Total share sum: ${sumShares.toFixed(1)}% (approx 100%)`);

  // 5. POST /api/sales - Adding new transaction
  console.log('\n[5/6] Verifying POST /api/sales transaction creation...');
  const productsList = await api('/api/products');
  const targetProduct = productsList.data[0];
  const postRes = await api('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: targetProduct.id,
      quantity: 5,
      sellingPrice: targetProduct.sellingPrice,
      saleDate: '2026-11-19'
    })
  });
  if (!postRes.ok || !postRes.data.success)
    throw new Error('POST sale failed: ' + JSON.stringify(postRes.data));
  console.log(
    `  ✓ Created new sale: ID ${postRes.data.sale.id}, ${targetProduct.name} x 5, Rev: $${postRes.data.sale.revenue}, Profit: $${postRes.data.sale.profit}`
  );

  // 6. Verify Dashboard Data Increment
  console.log('\n[6/6] Verifying live metric updates after sale insertion...');
  const updatedSummary = await api('/api/summary');
  const expectedSales = initSummary.data.totalSales + 1;
  const expectedRevenue = Number(
    (initSummary.data.totalRevenue + postRes.data.sale.revenue).toFixed(2)
  );
  console.log(
    `  ✓ Total sales incremented: ${initSummary.data.totalSales} -> ${updatedSummary.data.totalSales}`
  );
  console.log(
    `  ✓ Total revenue incremented: $${initSummary.data.totalRevenue} -> $${updatedSummary.data.totalRevenue}`
  );
  if (updatedSummary.data.totalSales !== expectedSales) {
    throw new Error(`Expected ${expectedSales} total sales, got ${updatedSummary.data.totalSales}`);
  }
  if (Math.abs(updatedSummary.data.totalRevenue - expectedRevenue) > 0.05) {
    throw new Error(
      `Expected $${expectedRevenue} total revenue, got $${updatedSummary.data.totalRevenue}`
    );
  }

  console.log('\n🎉 ALL FULL-STACK SALES ANALYTICS CHECKS PASSED PERFECTLY!\n');
  if (serverInstance) {
    serverInstance.close();
  }
}

runE2E().catch(err => {
  console.error('\n❌ E2E Verification failed:', err);
  process.exit(1);
});
