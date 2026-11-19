import { z } from 'zod';
import analytics from './analytics.js';

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format.' })
  .refine(val => analytics.isValidIsoDate(val), {
    message: 'Date must be a valid calendar date.'
  });

export const createSaleSchema = z.object({
  productId: z.coerce
    .number({ invalid_type_error: 'Product ID must be a number.' })
    .int({ message: 'Product ID must be an integer.' })
    .positive({ message: 'Product ID must be positive.' }),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number.' })
    .int({ message: 'Quantity must be an integer.' })
    .min(1, { message: 'Quantity must be at least 1.' })
    .max(1000, { message: 'Quantity cannot exceed 1000.' }),
  saleDate: isoDateSchema.optional(),
  sellingPrice: z.coerce
    .number({ invalid_type_error: 'Selling price must be a number.' })
    .positive({ message: 'Selling price must be positive.' })
    .max(1000000, { message: 'Selling price exceeds maximum limit.' })
    .optional()
});

export const summaryQuerySchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    category: z.string().trim().max(50).optional()
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'startDate cannot be after endDate.',
      path: ['startDate']
    }
  );

export const salesTrendQuerySchema = z.object({
  range: z.enum(['monthly', 'weekly', 'daily']).optional().default('monthly'),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  category: z.string().trim().max(50).optional()
});

export const productsPerformanceQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(''),
  category: z.string().trim().max(50).optional(),
  sortBy: z
    .enum(['revenue', 'profit', 'unitsSold', 'margin', 'name', 'costPrice', 'sellingPrice'])
    .optional()
    .default('revenue'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional()
});

export const categoriesQuerySchema = z.object({
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional()
});

export default {
  isoDateSchema,
  createSaleSchema,
  summaryQuerySchema,
  salesTrendQuerySchema,
  productsPerformanceQuerySchema,
  categoriesQuerySchema
};
