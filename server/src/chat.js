const fs = require('fs');
const path = require('path');
const db = require('./db');
const { safeLog } = require('./errors');

/**
 * Loads credentials from process.env or re-reads .env directly
 * so changes made to .env take effect immediately without requiring a server restart.
 */
function getNvidiaCredentials() {
  if (process.env.TEST_NO_KEY === '1') {
    return { apiKey: '', model: 'nemotron-3.5-parse' };
  }

  const envFiles = [
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env')
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed
              .slice(eqIdx + 1)
              .trim()
              .replace(/^["']|["']$/g, '');
            if (key === 'NVIDIA_API_KEY' && val) {
              process.env.NVIDIA_API_KEY = val;
            }
            if (key === 'NVIDIA_MODEL' && val) {
              process.env.NVIDIA_MODEL = val;
            }
          }
        }
      } catch (_e) {
        /* ignore env read error */
      }
    }
  }

  const apiKey = (process.env.NVIDIA_API_KEY || '').trim();
  const model = (process.env.NVIDIA_MODEL || '').trim() || 'nemotron-3.5-parse';

  return { apiKey, model };
}

/**
 * Builds a structured, compact representation of the current store sales data
 * from SQLite for LLM context grounding.
 */
function buildSalesContext(_userQuery = '') {
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const salesCount = db.prepare('SELECT COUNT(*) as c FROM sales').get().c;

  if (salesCount === 0 || productCount === 0) {
    return {
      hasData: false,
      text: 'SALES_DATA STATUS: The database currently has 0 sales and 0 products recorded. The demo dataset has been cleared. No transactions exist.'
    };
  }

  // 1. Overall Summary
  const summary = db
    .prepare(
      `
    SELECT 
      COUNT(id) as totalOrders,
      COALESCE(SUM(quantity), 0) as totalUnits,
      COALESCE(SUM(revenue), 0) as totalRevenue,
      COALESCE(SUM(profit), 0) as totalProfit
    FROM sales
  `
    )
    .get();

  const totalRev = Number((summary.totalRevenue || 0).toFixed(2));
  const totalProf = Number((summary.totalProfit || 0).toFixed(2));
  const marginPct = totalRev > 0 ? Number(((totalProf / totalRev) * 100).toFixed(2)) : 0;

  // 2. Category Performance
  const categories = db
    .prepare(
      `
    SELECT 
      p.category,
      COUNT(s.id) as orders,
      COALESCE(SUM(s.quantity), 0) as unitsSold,
      COALESCE(SUM(s.revenue), 0) as revenue,
      COALESCE(SUM(s.profit), 0) as profit
    FROM products p
    LEFT JOIN sales s ON p.id = s.product_id
    GROUP BY p.category
    ORDER BY revenue DESC
  `
    )
    .all()
    .map(c => {
      const rev = Number(c.revenue.toFixed(2));
      const prof = Number(c.profit.toFixed(2));
      const share = totalRev > 0 ? Number(((rev / totalRev) * 100).toFixed(1)) : 0;
      return {
        category: c.category,
        orders: c.orders,
        unitsSold: c.unitsSold,
        totalRevenue: `₹${rev.toLocaleString()}`,
        totalProfit: `₹${prof.toLocaleString()}`,
        profitMargin: `${rev > 0 ? ((prof / rev) * 100).toFixed(1) : 0}%`,
        revenueShare: `${share}%`
      };
    });

  // 3. Products Ranking
  const products = db
    .prepare(
      `
    SELECT 
      p.id,
      p.name,
      p.category,
      p.cost_price as costPrice,
      p.selling_price as sellingPrice,
      p.stock_quantity as stockQuantity,
      COUNT(s.id) as orders,
      COALESCE(SUM(s.quantity), 0) as unitsSold,
      COALESCE(SUM(s.revenue), 0) as totalRevenue,
      COALESCE(SUM(s.profit), 0) as totalProfit
    FROM products p
    LEFT JOIN sales s ON p.id = s.product_id
    GROUP BY p.id
    ORDER BY totalRevenue DESC
  `
    )
    .all()
    .map((p, idx) => {
      const rev = Number(p.totalRevenue.toFixed(2));
      const prof = Number(p.totalProfit.toFixed(2));
      return {
        rank: idx + 1,
        name: p.name,
        category: p.category,
        costPrice: `₹${p.costPrice.toFixed(2)}`,
        sellingPrice: `₹${p.sellingPrice.toFixed(2)}`,
        unitsSold: p.unitsSold,
        orders: p.orders,
        stockRemaining: p.stockQuantity ?? 50,
        totalRevenue: `₹${rev.toLocaleString()}`,
        totalProfit: `₹${prof.toLocaleString()}`,
        profitMargin: `${rev > 0 ? ((prof / rev) * 100).toFixed(1) : 0}%`,
        cashTiedUpInStock: `₹${Number(((p.stockQuantity ?? 50) * p.costPrice).toFixed(2)).toLocaleString()}`
      };
    });

  // 4. Monthly Trend
  const monthly = db
    .prepare(
      `
    SELECT 
      strftime('%Y-%m', sale_date) as month,
      COUNT(id) as orders,
      COALESCE(SUM(quantity), 0) as unitsSold,
      COALESCE(SUM(revenue), 0) as revenue,
      COALESCE(SUM(profit), 0) as profit
    FROM sales
    GROUP BY month
    ORDER BY month ASC
  `
    )
    .all()
    .map(m => ({
      month: m.month,
      orders: m.orders,
      unitsSold: m.unitsSold,
      revenue: `₹${Number(m.revenue.toFixed(2)).toLocaleString()}`,
      profit: `₹${Number(m.profit.toFixed(2)).toLocaleString()}`
    }));

  // 5. Peak Hours & Days
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayRows = db
    .prepare(
      `
    SELECT 
      CAST(strftime('%w', sale_date) AS INTEGER) as dayNum,
      COUNT(id) as orders,
      COALESCE(SUM(revenue), 0) as revenue
    FROM sales
    GROUP BY dayNum
    ORDER BY revenue DESC
  `
    )
    .all();

  const busiestDay = dayRows.length > 0 ? daysOfWeek[dayRows[0].dayNum] : 'Unknown';
  const slowestDay =
    dayRows.length > 0 ? daysOfWeek[dayRows[dayRows.length - 1].dayNum] : 'Unknown';

  const contextData = {
    currency: 'Indian Rupee (₹, INR)',
    overallSummary: {
      totalOrders: summary.totalOrders,
      totalUnitsSold: summary.totalUnits,
      totalRevenue: `₹${totalRev.toLocaleString()}`,
      totalProfit: `₹${totalProf.toLocaleString()}`,
      overallProfitMargin: `${marginPct}%`,
      keepRate: `₹${Math.round(marginPct)} kept per ₹100 sold`
    },
    categoryBreakdown: categories,
    productRankings: products,
    monthlyPerformance: monthly,
    trafficPatterns: {
      busiestDay,
      slowestDay
    }
  };

  return {
    hasData: true,
    text: JSON.stringify(contextData, null, 2)
  };
}

/**
 * Handles incoming chatbot queries via the NVIDIA OpenAI-compatible endpoint.
 */
async function handleChatRequest(req, res) {
  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string.',
        code: 'INVALID_MESSAGE'
      });
    }

    const { apiKey, model } = getNvidiaCredentials();

    // Build grounded sales context
    const salesContext = buildSalesContext(message);

    // If API key is missing, provide clear user instructions
    if (!apiKey) {
      return res.json({
        reply:
          '⚠️ **NVIDIA API Key Not Configured**\n\nTo enable live responses from the `' +
          model +
          '` model, please add your NVIDIA API key to the `.env` file in the project root:\n\n```env\nNVIDIA_API_KEY=nvapi-your-key-here\nNVIDIA_MODEL=' +
          model +
          '\n```\n\nYou can generate an API key from the [NVIDIA Build Catalog](https://build.nvidia.com).',
        configured: false
      });
    }

    const systemPrompt = `You are the SalesPulse AI Sales Assistant, an expert business analyst strictly grounded in this store's real sales dataset.

CRITICAL GROUNDING RULES:
1. You MUST answer questions strictly and exclusively based on the provided SALES_DATA below.
2. Never use outside knowledge, external facts, assumptions, or general world knowledge.
3. Never fabricate or invent numbers, products, dates, categories, prices, or trends.
4. If a question cannot be answered completely and directly from the provided SALES_DATA, or if the user asks an out-of-scope question (e.g. general knowledge, sports, poems, politics, weather, recipes, coding), you MUST strictly refuse and reply with EXACTLY:
"I can only answer questions based on the provided sales data, and that information is not available in the dataset."
5. If the database has 0 sales or all demo data is cleared, politely explain that no transactions currently exist in the database and suggest importing a spreadsheet or clicking "Load Demo".
6. Always format currency figures in Indian Rupees (₹) exactly matching the numbers in the data.
7. Format answers cleanly and professionally in markdown:
   - Use bold for key product/category names and metric amounts (e.g. **Electronics**, **₹3,920**).
   - Use bullet points for structured breakdowns (e.g. Category, Total Profit, Profit Margin, Revenue Share).
   - Give complete, readable sentences without clipped or missing fields. Avoid leaving blank placeholders.

SALES_DATA:
${salesContext.text}`;

    // Format chat conversation messages
    const formattedMessages = [{ role: 'system', content: systemPrompt }];

    // Include recent history (up to 6 messages) if valid
    if (Array.isArray(history)) {
      const recent = history.slice(-6);
      for (const h of recent) {
        if (h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') {
          formattedMessages.push({
            role: h.role,
            content: h.content.slice(0, 1000)
          });
        }
      }
    }

    formattedMessages.push({ role: 'user', content: message.trim() });

    // Call NVIDIA AI OpenAI-compatible chat completions endpoint
    let targetModel = model;
    let response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    // If the requested model returns 404 (e.g. model name alias or endpoint mismatch),
    // automatically try the active Nemotron 3.5 NIM endpoint
    if (response.status === 404) {
      const fallbackModel = 'nvidia/nemotron-3.5-bolt-e4b';
      const fallbackResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: fallbackModel,
          messages: formattedMessages,
          temperature: 0.1,
          max_tokens: 1024
        })
      });

      if (fallbackResponse.ok) {
        response = fallbackResponse;
        targetModel = fallbackModel;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      safeLog('error', `NVIDIA API error [${response.status}]: ${errorText}`);

      if (response.status === 401) {
        return res.status(401).json({
          reply:
            '❌ **Authentication Error**: The provided `NVIDIA_API_KEY` is invalid or expired. Please check your credentials in `.env`.',
          configured: false
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          reply:
            '⏳ **Rate Limit Exceeded**: Too many requests sent to NVIDIA NIM API. Please wait a moment before asking another question.',
          configured: true
        });
      }

      return res.status(response.status).json({
        reply: `⚠️ NVIDIA API returned error (${response.status}). Please verify that model \`${model}\` is available for your account.`,
        configured: true
      });
    }

    const data = await response.json();
    const choiceMsg = data.choices?.[0]?.message;
    const reply =
      choiceMsg?.content ||
      choiceMsg?.reasoning_content ||
      'I was unable to retrieve a response from the sales analytics model.';

    return res.json({
      reply: reply.trim(),
      configured: true,
      model: targetModel
    });
  } catch (error) {
    safeLog('error', `Error in /api/chat: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to communicate with AI sales assistant.',
      code: 'CHAT_ERROR',
      reply:
        '⚠️ Unable to connect to the NVIDIA AI service. Please check server logs and connection.'
    });
  }
}

module.exports = {
  buildSalesContext,
  handleChatRequest
};
