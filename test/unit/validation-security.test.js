const { describe, it } = require('node:test');
const assert = require('node:assert');
const schemas = require('../../shared/schemas');
const {
  createSaleSchema,
  summaryQuerySchema,
  salesTrendQuerySchema,
  productsPerformanceQuerySchema
} = schemas.default || schemas;

describe('Schema Validation & Security Tests', () => {
  describe('createSaleSchema', () => {
    it('accepts valid sale payload', () => {
      const valid = {
        productId: 1,
        quantity: 3,
        sellingPrice: 49.99,
        saleDate: '2026-11-19'
      };
      const res = createSaleSchema.safeParse(valid);
      assert.strictEqual(res.success, true);
    });

    it('rejects invalid or missing productId', () => {
      assert.strictEqual(createSaleSchema.safeParse({ quantity: 2 }).success, false);
      assert.strictEqual(createSaleSchema.safeParse({ productId: -1, quantity: 2 }).success, false);
      assert.strictEqual(
        createSaleSchema.safeParse({ productId: 'invalid', quantity: 2 }).success,
        false
      );
    });

    it('rejects out of bounds quantity', () => {
      assert.strictEqual(createSaleSchema.safeParse({ productId: 1, quantity: 0 }).success, false);
      assert.strictEqual(createSaleSchema.safeParse({ productId: 1, quantity: -5 }).success, false);
      assert.strictEqual(
        createSaleSchema.safeParse({ productId: 1, quantity: 1001 }).success,
        false
      );
    });

    it('rejects invalid saleDate (e.g. invalid calendar dates like April 31)', () => {
      assert.strictEqual(
        createSaleSchema.safeParse({ productId: 1, quantity: 1, saleDate: '2026-04-31' }).success,
        false
      );
      assert.strictEqual(
        createSaleSchema.safeParse({ productId: 1, quantity: 1, saleDate: 'invalid-date' }).success,
        false
      );
    });

    it('rejects negative sellingPrice', () => {
      assert.strictEqual(
        createSaleSchema.safeParse({ productId: 1, quantity: 1, sellingPrice: -10 }).success,
        false
      );
      assert.strictEqual(
        createSaleSchema.safeParse({ productId: 1, quantity: 1, sellingPrice: 0 }).success,
        false
      );
    });
  });

  describe('summaryQuerySchema', () => {
    it('accepts valid optional dates', () => {
      assert.strictEqual(summaryQuerySchema.safeParse({}).success, true);
      assert.strictEqual(
        summaryQuerySchema.safeParse({ startDate: '2026-01-01', endDate: '2026-06-30' }).success,
        true
      );
    });

    it('rejects startDate after endDate', () => {
      const res = summaryQuerySchema.safeParse({ startDate: '2026-06-30', endDate: '2026-01-01' });
      assert.strictEqual(res.success, false);
    });

    it('rejects invalid date formats', () => {
      assert.strictEqual(summaryQuerySchema.safeParse({ startDate: '2026/01/01' }).success, false);
      assert.strictEqual(summaryQuerySchema.safeParse({ startDate: 'not-a-date' }).success, false);
    });
  });

  describe('salesTrendQuerySchema', () => {
    it('accepts valid range values', () => {
      assert.strictEqual(salesTrendQuerySchema.safeParse({ range: 'monthly' }).success, true);
      assert.strictEqual(salesTrendQuerySchema.safeParse({ range: 'weekly' }).success, true);
      assert.strictEqual(salesTrendQuerySchema.safeParse({ range: 'daily' }).success, true);
      assert.strictEqual(salesTrendQuerySchema.safeParse({}).data.range, 'monthly');
    });

    it('rejects invalid range values', () => {
      assert.strictEqual(salesTrendQuerySchema.safeParse({ range: 'yearly' }).success, false);
      assert.strictEqual(salesTrendQuerySchema.safeParse({ range: 'hourly' }).success, false);
    });
  });

  describe('productsPerformanceQuerySchema', () => {
    it('accepts valid sort fields and orders', () => {
      assert.strictEqual(
        productsPerformanceQuerySchema.safeParse({ sortBy: 'revenue', order: 'desc' }).success,
        true
      );
      assert.strictEqual(
        productsPerformanceQuerySchema.safeParse({ sortBy: 'profit', order: 'asc' }).success,
        true
      );
      assert.strictEqual(
        productsPerformanceQuerySchema.safeParse({ sortBy: 'margin' }).success,
        true
      );
    });

    it('rejects invalid sort fields or orders', () => {
      assert.strictEqual(
        productsPerformanceQuerySchema.safeParse({ sortBy: 'malicious_column' }).success,
        false
      );
      assert.strictEqual(
        productsPerformanceQuerySchema.safeParse({ order: 'sideways' }).success,
        false
      );
    });
  });
});
