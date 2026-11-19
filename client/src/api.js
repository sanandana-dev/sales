const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'An error occurred while fetching data.';
    try {
      const err = await response.json();
      errorMsg = err.error || errorMsg;
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function fetchSummary(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.category && params.category !== 'All') query.append('category', params.category);

  const res = await fetch(`${API_BASE}/summary?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchSalesTrend(params = {}) {
  const query = new URLSearchParams();
  query.append('range', params.range || 'monthly');
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.category && params.category !== 'All') query.append('category', params.category);

  const res = await fetch(`${API_BASE}/sales-trend?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchProductsPerformance(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.order) query.append('order', params.order);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const res = await fetch(`${API_BASE}/products/performance?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchCategories(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const res = await fetch(`${API_BASE}/categories?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  return handleResponse(res);
}

export async function createSale(payload) {
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function uploadSales(sales, replaceExisting = true) {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sales, replaceExisting })
  });
  return handleResponse(res);
}

export async function resetSampleData() {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST'
  });
  return handleResponse(res);
}

export async function clearAllData() {
  const res = await fetch(`${API_BASE}/clear`, {
    method: 'POST'
  });
  return handleResponse(res);
}

export async function fetchPeakTimes(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.category && params.category !== 'All') query.append('category', params.category);

  const res = await fetch(`${API_BASE}/analytics/peak-times?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchProductMatrix(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.category && params.category !== 'All') query.append('category', params.category);

  const res = await fetch(`${API_BASE}/products/matrix?${query.toString()}`);
  return handleResponse(res);
}

export async function fetchSlowMoving() {
  const res = await fetch(`${API_BASE}/analytics/slow-moving`);
  return handleResponse(res);
}

export async function fetchTakeaways(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.category && params.category !== 'All') query.append('category', params.category);

  const res = await fetch(`${API_BASE}/analytics/takeaways?${query.toString()}`);
  return handleResponse(res);
}
