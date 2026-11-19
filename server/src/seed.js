const db = require('./db');

const sampleProducts = [
  // Electronics
  {
    name: 'Pro Wireless Mechanical Keyboard',
    category: 'Electronics',
    cost_price: 45.0,
    selling_price: 119.99
  },
  {
    name: 'Ergonomic Vertical Mouse',
    category: 'Electronics',
    cost_price: 18.0,
    selling_price: 49.99
  },
  {
    name: 'Ultra-wide 34" Curved Monitor',
    category: 'Electronics',
    cost_price: 220.0,
    selling_price: 449.99
  },
  {
    name: 'Noise-Canceling USB-C Headset',
    category: 'Electronics',
    cost_price: 35.0,
    selling_price: 89.99
  },

  // Office
  {
    name: 'Motorized Standing Desk Converter',
    category: 'Office',
    cost_price: 90.0,
    selling_price: 229.99
  },
  {
    name: 'Full-Grain Leather Desk Pad',
    category: 'Office',
    cost_price: 12.0,
    selling_price: 39.99
  },
  {
    name: 'Memory Foam Lumbar Support Pillow',
    category: 'Office',
    cost_price: 14.0,
    selling_price: 34.99
  },

  // Apparel
  {
    name: 'Organic Cotton Heavyweight Hoodie',
    category: 'Apparel',
    cost_price: 22.0,
    selling_price: 68.0
  },
  {
    name: 'Performance Merino Wool Socks (3-Pack)',
    category: 'Apparel',
    cost_price: 9.0,
    selling_price: 28.0
  },
  {
    name: 'Weatherproof Commuter Windbreaker',
    category: 'Apparel',
    cost_price: 38.0,
    selling_price: 98.0
  },

  // Home & Kitchen
  {
    name: 'Double-Wall Insulated Tumbler 24oz',
    category: 'Home & Kitchen',
    cost_price: 8.5,
    selling_price: 29.99
  },
  {
    name: 'Precision Gooseneck Electric Kettle',
    category: 'Home & Kitchen',
    cost_price: 28.0,
    selling_price: 74.99
  }
];

function seedDatabase(force = false) {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;

  if (!force && productCount > 0 && salesCount > 0) {
    console.log(`Database already seeded with ${productCount} products and ${salesCount} sales.`);
    return;
  }

  console.log('Seeding database with realistic sample data...');

  const clearSales = db.prepare('DELETE FROM sales');
  const clearProducts = db.prepare('DELETE FROM products');
  const resetSqliteSeq = db.prepare(
    "DELETE FROM sqlite_sequence WHERE name IN ('products', 'sales')"
  );

  db.transaction(() => {
    clearSales.run();
    clearProducts.run();
    try {
      resetSqliteSeq.run();
    } catch (e) {
      /* ignore if sqlite_sequence not ready */
    }

    // Insert products with stock count
    const insertProduct = db.prepare(`
      INSERT INTO products (name, category, cost_price, selling_price, stock_quantity)
      VALUES (?, ?, ?, ?, ?)
    `);

    const productIds = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const p = sampleProducts[i];
      // Give slow-moving socks & tumbler more stock on shelves to show cash-tied up
      const defaultStock = i % 3 === 0 ? 65 : i % 2 === 0 ? 35 : 18;
      const info = insertProduct.run(
        p.name,
        p.category,
        p.cost_price,
        p.selling_price,
        p.stock_quantity || defaultStock
      );
      productIds.push({
        id: info.lastInsertRowid,
        ...p,
        stock_quantity: defaultStock
      });
    }

    // Generate ~12 months of sales ending today (2026-11-19)
    const endDate = new Date('2026-11-19T23:59:59');
    const startDate = new Date('2025-11-20T00:00:00');
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((endDate - startDate) / dayMs);

    const insertSale = db.prepare(`
      INSERT INTO sales (product_id, quantity, unit_cost, unit_price, revenue, profit, sale_date, sale_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalInserted = 0;

    // Realistic store operating hours distribution: 10:00 to 21:00
    const storeHours = [
      '10:15', '11:00', '11:45', '12:30', '13:15', '13:45',
      '14:20', '15:10', '16:00', '16:45', '17:30', '18:15',
      '18:50', '19:30', '20:10'
    ];

    for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
      const currentDate = new Date(startDate.getTime() + dayOffset * dayMs);
      const dateStr = currentDate.toISOString().slice(0, 10);
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
      const month = currentDate.getMonth(); // 0 is Jan, 11 is Dec

      // Base transactions per day: 3 to 7
      let dailyTransactions = 3 + Math.floor(Math.random() * 5);

      // Weekend boost: Friday, Saturday, Sunday have +1 to +3 transactions
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        dailyTransactions += 1 + Math.floor(Math.random() * 3);
      }

      // Holiday shopping boost (Nov - Dec)
      if (month === 10 || month === 11) {
        dailyTransactions += 2 + Math.floor(Math.random() * 4);
      }

      // Generate daily transactions
      for (let t = 0; t < dailyTransactions; t++) {
        // Weighted product pick (popular products sell more often)
        const productIndex = Math.floor(Math.random() * productIds.length);
        const product = productIds[productIndex];

        // Quantity: usually 1 or 2, rarely 3 or 4
        const rand = Math.random();
        let quantity = 1;
        if (rand > 0.65) quantity = 2;
        if (rand > 0.9) quantity = 3;
        if (rand > 0.97) quantity = 4;

        const revenue = Number((quantity * product.selling_price).toFixed(2));
        const cost = Number((quantity * product.cost_price).toFixed(2));
        const profit = Number((revenue - cost).toFixed(2));
        const saleTime = storeHours[Math.floor(Math.random() * storeHours.length)];

        insertSale.run(
          product.id,
          quantity,
          product.cost_price,
          product.selling_price,
          revenue,
          profit,
          dateStr,
          saleTime
        );
        totalInserted++;
      }
    }

    console.log(
      `Seeding complete: inserted ${productIds.length} products and ${totalInserted} sales.`
    );
  })();
}

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
