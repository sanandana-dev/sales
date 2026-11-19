const { describe, it } = require('node:test');
const assert = require('node:assert');
const analyticsModule = require('../../shared/analytics');
const analytics = analyticsModule.default || analyticsModule;

describe('High Correctness Bug Tests', () => {
  it('BUG-01: calculateProfitMargin handles totalProfit and does not rely on broken property access', () => {
    // Current bug checks currentStats.profit ? currentStats.totalProfit : ...
    const rev = 1000.0;
    const profit = 250.5;
    const margin = analytics.calculateProfitMargin(rev, profit);
    assert.strictEqual(margin, 25.05);

    // Division by zero
    assert.strictEqual(analytics.calculateProfitMargin(0, 0), 0);
    assert.strictEqual(analytics.calculateProfitMargin(0, 50), 0);
  });

  it('BUG-02: Date handling strictly uses UTC and handles DST/Leap Days without drift', () => {
    // Leap day test
    assert.strictEqual(analytics.isValidIsoDate('2024-02-29'), true);
    assert.strictEqual(analytics.isValidIsoDate('2023-02-29'), false);
    assert.strictEqual(analytics.isValidIsoDate('2026-04-31'), false);
    assert.strictEqual(analytics.isValidIsoDate('invalid-date'), false);

    // Exact prior period for 30 days
    const range = analytics.getPriorDateRange('2026-03-01', '2026-03-30');
    // Prior range must be strictly consecutive and matching duration
    assert.strictEqual(range.prevEnd, '2026-02-28');
    assert.strictEqual(range.prevStart, '2026-01-30');

    // Adding days across month and leap day boundary
    assert.strictEqual(analytics.addDaysUtc('2024-02-28', 1), '2024-02-29');
    assert.strictEqual(analytics.addDaysUtc('2024-02-28', 2), '2024-03-01');
    assert.strictEqual(analytics.addDaysUtc('2023-02-28', 1), '2023-03-01');
  });

  it('BUG-03: All-time previous period percentage change does not mismatch periods', () => {
    // If comparing identical 30-day periods
    const deltaSame = analytics.calculatePercentageChange(200, 200);
    assert.strictEqual(deltaSame, 0);

    const deltaDouble = analytics.calculatePercentageChange(400, 200);
    assert.strictEqual(deltaDouble, 100);

    // Zero prior period
    const deltaZeroPrior = analytics.calculatePercentageChange(150, 0);
    assert.strictEqual(deltaZeroPrior, 100);

    // Zero current and zero prior
    assert.strictEqual(analytics.calculatePercentageChange(0, 0), 0);
  });

  it('BUG-04: assignProductBadges assigns Best Seller and Slow Mover even with zero sales products', () => {
    const products = [
      { id: 1, name: 'Prod A', totalRevenue: 1000 },
      { id: 2, name: 'Prod B', totalRevenue: 500 },
      { id: 3, name: 'Prod C', totalRevenue: 200 },
      { id: 4, name: 'Prod D', totalRevenue: 0 } // 0 sales product
    ];

    const tagged = analytics.assignProductBadges(products);
    assert.strictEqual(tagged.length, 4);
    assert.strictEqual(tagged.find(p => p.id === 1).badge, 'Best Seller');
    assert.strictEqual(tagged.find(p => p.id === 4).badge, 'Slow Mover');
  });

  it('BUG-05: Floating point money calculations avoid IEEE 754 drift', () => {
    // 0.1 + 0.2 in JS is 0.30000000000000004
    const rev = analytics.calculateRevenue(3, 19.99); // 59.97
    const cost = analytics.calculateCost(3, 10.05); // 30.15
    const profit = analytics.calculateProfit(rev, cost); // 29.82
    assert.strictEqual(rev, 59.97);
    assert.strictEqual(cost, 30.15);
    assert.strictEqual(profit, 29.82);

    // Precision with cents conversion
    assert.strictEqual(analytics.toCents(19.99), 1999);
    assert.strictEqual(analytics.toDollars(1999), 19.99);
  });

  it('BUG-06: Rolling date window generator creates valid UTC dates relative to given anchor', () => {
    const anchor = '2026-11-19';
    const last30 = analytics.getRollingRange('30d', anchor);
    assert.strictEqual(last30.endDate, '2026-11-19');
    assert.strictEqual(last30.startDate, '2026-10-21');
    assert.strictEqual(analytics.daysBetweenUtc(last30.startDate, last30.endDate), 29);
  });
});
