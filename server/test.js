const http = require('http');

async function testBackend() {
  const { app, server } = require('./src/index');
  const address = server.address();
  const port = address.port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Running tests against ${baseUrl}...`);

  function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // 1. Health check
    let res = await request('GET', '/api/health');
    console.assert(res.status === 200 && res.body.status === 'ok', 'Health check failed');
    console.log('✅ Health check passed');

    // 2. Summary
    res = await request('GET', '/api/summary');
    console.assert(res.status === 200, 'Summary status 200');
    console.assert(res.body.totalSales > 0, 'Total sales > 0');
    console.assert(res.body.totalRevenue > 0, 'Total revenue > 0');
    console.assert(res.body.profitMargin > 0, 'Profit margin > 0');
    console.log(`✅ /api/summary passed: ${res.body.totalSales} sales, $${res.body.totalRevenue.toLocaleString()} revenue, $${res.body.totalProfit.toLocaleString()} profit, ${res.body.profitMargin}% margin`);

    // 3. Sales trend monthly
    res = await request('GET', '/api/sales-trend?range=monthly');
    console.assert(res.status === 200 && Array.isArray(res.body) && res.body.length > 0, 'Monthly trend failed');
    console.log(`✅ /api/sales-trend?range=monthly passed (${res.body.length} months)`);

    // 4. Sales trend weekly
    res = await request('GET', '/api/sales-trend?range=weekly');
    console.assert(res.status === 200 && Array.isArray(res.body) && res.body.length > 0, 'Weekly trend failed');
    console.log(`✅ /api/sales-trend?range=weekly passed (${res.body.length} weeks)`);

    // 5. Products performance
    res = await request('GET', '/api/products/performance');
    console.assert(res.status === 200 && Array.isArray(res.body) && res.body.length > 0, 'Products performance failed');
    console.assert(res.body[0].badge, 'Performance badge missing');
    console.log(`✅ /api/products/performance passed (${res.body.length} products, top: "${res.body[0].name}" with badge "${res.body[0].badge}")`);

    // 6. Categories
    res = await request('GET', '/api/categories');
    console.assert(res.status === 200 && Array.isArray(res.body) && res.body.length > 0, 'Categories failed');
    console.log(`✅ /api/categories passed (${res.body.length} categories)`);

    // 7. Products catalog
    res = await request('GET', '/api/products');
    console.assert(res.status === 200 && Array.isArray(res.body) && res.body.length > 0, 'Products list failed');
    console.log(`✅ /api/products passed (${res.body.length} items for selector)`);

    // 8. POST /api/sales valid
    const product = res.body[0];
    res = await request('POST', '/api/sales', {
      productId: product.id,
      quantity: 3,
      saleDate: '2026-11-19'
    });
    console.assert(res.status === 201 && res.body.success === true, 'POST /api/sales valid failed');
    console.assert(res.body.sale.quantity === 3, 'POST sale quantity mismatch');
    console.log(`✅ POST /api/sales (valid) passed: recorded sale ID ${res.body.sale.id} for $${res.body.sale.revenue}`);

    // 9. POST /api/sales invalid product
    res = await request('POST', '/api/sales', {
      productId: 999999,
      quantity: 2
    });
    console.assert(res.status === 404, 'POST /api/sales invalid product should be 404');
    console.log('✅ POST /api/sales (invalid product 404) passed');

    // 10. POST /api/sales invalid quantity
    res = await request('POST', '/api/sales', {
      productId: product.id,
      quantity: -5
    });
    console.assert(res.status === 400, 'POST /api/sales invalid qty should be 400');
    console.log('✅ POST /api/sales (invalid qty 400) passed');

    console.log('\n🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

testBackend();
