const { describe, it } = require('node:test');
const assert = require('node:assert');
const analyticsModule = require('../../shared/analytics');
const analytics = analyticsModule.default || analyticsModule;

describe('Pure Business Logic Unit Tests - Comprehensive Edge Cases', () => {
  describe('toCents & toDollars', () => {
    it('handles normal numbers', () => {
      assert.strictEqual(analytics.toCents(12.34), 1234);
      assert.strictEqual(analytics.toDollars(1234), 12.34);
    });

    it('handles zero, null, undefined, NaN', () => {
      assert.strictEqual(analytics.toCents(0), 0);
      assert.strictEqual(analytics.toCents(null), 0);
      assert.strictEqual(analytics.toCents(undefined), 0);
      assert.strictEqual(analytics.toCents(NaN), 0);
      assert.strictEqual(analytics.toCents('not-a-number'), 0);

      assert.strictEqual(analytics.toDollars(0), 0);
      assert.strictEqual(analytics.toDollars(null), 0);
      assert.strictEqual(analytics.toDollars(undefined), 0);
      assert.strictEqual(analytics.toDollars(NaN), 0);
    });

    it('handles negative values', () => {
      assert.strictEqual(analytics.toCents(-45.67), -4567);
      assert.strictEqual(analytics.toDollars(-4567), -45.67);
    });

    it('handles very large numbers', () => {
      assert.strictEqual(analytics.toCents(100000000.5), 10000000050);
      assert.strictEqual(analytics.toDollars(10000000050), 100000000.5);
    });
  });

  describe('calculateRevenue, calculateCost, calculateProfit', () => {
    it('handles standard transactions', () => {
      assert.strictEqual(analytics.calculateRevenue(5, 29.99), 149.95);
      assert.strictEqual(analytics.calculateCost(5, 12.5), 62.5);
      assert.strictEqual(analytics.calculateProfit(149.95, 62.5), 87.45);
    });

    it('handles zero and negative quantities', () => {
      assert.strictEqual(analytics.calculateRevenue(0, 100), 0);
      assert.strictEqual(analytics.calculateRevenue(-2, 100), 0);
      assert.strictEqual(analytics.calculateCost(0, 50), 0);
      assert.strictEqual(analytics.calculateCost(-5, 50), 0);
    });

    it('handles net losses (negative profit)', () => {
      const rev = 50.0;
      const cost = 80.0;
      assert.strictEqual(analytics.calculateProfit(rev, cost), -30.0);
    });
  });

  describe('calculateProfitMargin', () => {
    it('computes margin percentage accurately', () => {
      assert.strictEqual(analytics.calculateProfitMargin(200, 50), 25.0);
      assert.strictEqual(analytics.calculateProfitMargin(300, 100), 33.33);
    });

    it('handles zero revenue (division by zero)', () => {
      assert.strictEqual(analytics.calculateProfitMargin(0, 0), 0);
      assert.strictEqual(analytics.calculateProfitMargin(0, -10), 0);
    });

    it('handles negative revenue and negative profit', () => {
      assert.strictEqual(analytics.calculateProfitMargin(-100, 20), 0);
      assert.strictEqual(analytics.calculateProfitMargin(100, -25), -25.0);
    });

    it('handles 100% margin', () => {
      assert.strictEqual(analytics.calculateProfitMargin(100, 100), 100.0);
    });
  });

  describe('calculatePercentageChange', () => {
    it('handles positive and negative shifts', () => {
      assert.strictEqual(analytics.calculatePercentageChange(150, 100), 50.0);
      assert.strictEqual(analytics.calculatePercentageChange(50, 100), -50.0);
    });

    it('handles zero denominator', () => {
      assert.strictEqual(analytics.calculatePercentageChange(100, 0), 100);
      assert.strictEqual(analytics.calculatePercentageChange(0, 0), 0);
      assert.strictEqual(analytics.calculatePercentageChange(-50, 0), -100);
    });

    it('handles negative previous periods', () => {
      assert.strictEqual(analytics.calculatePercentageChange(100, -100), 200.0);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD currency with default and custom fractions', () => {
      assert.strictEqual(analytics.formatCurrency(1234.56), '$1,234.56');
      assert.strictEqual(analytics.formatCurrency(1234.56, { maximumFractionDigits: 0 }), '$1,235');
      assert.strictEqual(analytics.formatCurrency(0), '$0.00');
      assert.strictEqual(analytics.formatCurrency(null), '$0.00');
    });
  });

  describe('UTC Date Functions', () => {
    it('validates ISO dates correctly including leap years', () => {
      assert.strictEqual(analytics.isValidIsoDate('2024-02-29'), true); // 2024 is leap year
      assert.strictEqual(analytics.isValidIsoDate('2020-02-29'), true); // 2020 is leap year
      assert.strictEqual(analytics.isValidIsoDate('2023-02-29'), false); // 2023 is not
      assert.strictEqual(analytics.isValidIsoDate('2026-02-29'), false);
      assert.strictEqual(analytics.isValidIsoDate('2026-04-31'), false); // April has 30 days
      assert.strictEqual(analytics.isValidIsoDate('2026-11-30'), true);
      assert.strictEqual(analytics.isValidIsoDate(''), false);
      assert.strictEqual(analytics.isValidIsoDate(null), false);
      assert.strictEqual(analytics.isValidIsoDate('2026/11/19'), false);
    });

    it('parseUtcDate & formatUtcDate cycle correctly', () => {
      const dateStr = '2026-11-19';
      const parsed = analytics.parseUtcDate(dateStr);
      assert.strictEqual(parsed.getUTCFullYear(), 2026);
      assert.strictEqual(parsed.getUTCMonth(), 10); // 0-indexed
      assert.strictEqual(parsed.getUTCDate(), 19);
      assert.strictEqual(analytics.formatUtcDate(parsed), dateStr);

      assert.throws(() => analytics.parseUtcDate('invalid'), /Invalid ISO date/);
      assert.throws(() => analytics.formatUtcDate('not-a-date'), /Invalid Date/);
    });

    it('daysBetweenUtc calculates exact elapsed days', () => {
      assert.strictEqual(analytics.daysBetweenUtc('2026-01-01', '2026-01-31'), 30);
      assert.strictEqual(analytics.daysBetweenUtc('2024-02-01', '2024-03-01'), 29); // leap year Feb
      assert.strictEqual(analytics.daysBetweenUtc('2023-02-01', '2023-03-01'), 28); // non-leap year Feb
    });

    it('addDaysUtc adds and subtracts days', () => {
      assert.strictEqual(analytics.addDaysUtc('2026-01-01', 10), '2026-01-11');
      assert.strictEqual(analytics.addDaysUtc('2026-01-01', -1), '2025-12-31');
      assert.strictEqual(analytics.addDaysUtc('2024-02-28', 1), '2024-02-29');
    });

    it('getPriorDateRange computes consecutive matching windows', () => {
      const prior = analytics.getPriorDateRange('2026-01-10', '2026-01-19');
      // 10 days duration (10 to 19 inclusive is 9 days diff)
      assert.strictEqual(prior.prevEnd, '2026-01-09');
      assert.strictEqual(prior.prevStart, '2025-12-31');

      assert.throws(
        () => analytics.getPriorDateRange('2026-02-01', '2026-01-01'),
        /startDate cannot be after endDate/
      );
      assert.throws(
        () => analytics.getPriorDateRange('invalid', '2026-01-01'),
        /Valid startDate and endDate/
      );
    });

    it('getRollingRange returns expected presets', () => {
      const range30 = analytics.getRollingRange('30d', '2026-11-19');
      assert.strictEqual(range30.endDate, '2026-11-19');
      assert.strictEqual(range30.startDate, '2026-10-21');

      const range90 = analytics.getRollingRange('90d', '2026-11-19');
      assert.strictEqual(range90.endDate, '2026-11-19');
      assert.strictEqual(range90.startDate, '2026-08-22');

      const range12m = analytics.getRollingRange('12m', '2026-11-19');
      assert.strictEqual(range12m.endDate, '2026-11-19');
      assert.strictEqual(range12m.startDate, '2025-11-20');

      const rangeAll = analytics.getRollingRange('all', '2026-11-19');
      assert.strictEqual(rangeAll.startDate, '');
      assert.strictEqual(rangeAll.endDate, '');
    });

    it('formatPeriodLabel formats monthly, weekly, and daily', () => {
      assert.strictEqual(analytics.formatPeriodLabel('2026-05', 'monthly'), 'May 2026');
      assert.strictEqual(analytics.formatPeriodLabel('2026-W15', 'weekly'), "W15 '26");
      assert.strictEqual(analytics.formatPeriodLabel('2026-11-19', 'daily'), 'Nov 19');
      assert.strictEqual(analytics.formatPeriodLabel('custom-key', 'unknown'), 'custom-key');
      assert.strictEqual(analytics.formatPeriodLabel('', 'monthly'), '');
    });
  });

  describe('assignProductBadges', () => {
    it('returns empty array when input is empty', () => {
      assert.deepStrictEqual(analytics.assignProductBadges([]), []);
      assert.deepStrictEqual(analytics.assignProductBadges(null), []);
    });

    it('assigns Best Seller, Moderate, and Slow Mover across revenue distribution', () => {
      const products = [
        { id: 1, name: 'P1', totalRevenue: 1000 },
        { id: 2, name: 'P2', totalRevenue: 800 },
        { id: 3, name: 'P3', totalRevenue: 600 },
        { id: 4, name: 'P4', totalRevenue: 400 },
        { id: 5, name: 'P5', totalRevenue: 200 },
        { id: 6, name: 'P6', totalRevenue: 100 },
        { id: 7, name: 'P7', totalRevenue: 50 },
        { id: 8, name: 'P8', totalRevenue: 10 }
      ];

      const tagged = analytics.assignProductBadges(products);
      assert.strictEqual(tagged.length, 8);
      // Top 25% (2 items: P1, P2)
      assert.strictEqual(tagged.find(p => p.id === 1).badge, 'Best Seller');
      assert.strictEqual(tagged.find(p => p.id === 2).badge, 'Best Seller');
      // Middle 50% (P3, P4, P5, P6)
      assert.strictEqual(tagged.find(p => p.id === 3).badge, 'Moderate');
      assert.strictEqual(tagged.find(p => p.id === 4).badge, 'Moderate');
      // Bottom 25% (2 items: P7, P8)
      assert.strictEqual(tagged.find(p => p.id === 7).badge, 'Slow Mover');
      assert.strictEqual(tagged.find(p => p.id === 8).badge, 'Slow Mover');
    });

    it('handles single product gracefully', () => {
      const tagged = analytics.assignProductBadges([
        { id: 1, name: 'Only One', totalRevenue: 100 }
      ]);
      assert.strictEqual(tagged[0].badge, 'Best Seller');
    });
  });
});
