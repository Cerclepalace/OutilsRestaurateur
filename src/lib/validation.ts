import { z } from 'zod';

/** Shared request schemas. Every route handler validates before touching data. */

export const cartItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().min(0).max(20),
});

export const priceCartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  discountCode: z.string().trim().max(60).nullable().optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  shippingMethodCode: z.string().trim().max(60).nullable().optional(),
});

export const wishlistEntrySchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
});

export const mergeSchema = z.object({
  cart: z.array(cartItemSchema).max(50).default([]),
  wishlist: z.array(wishlistEntrySchema).max(200).default([]),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("L'adresse e-mail n'est pas valide."),
  source: z.string().trim().max(60).optional(),
});

export const addressSchema = z.object({
  first_name: z.string().trim().min(1, 'Prénom requis').max(80),
  last_name: z.string().trim().min(1, 'Nom requis').max(80),
  company: z.string().trim().max(120).nullable().optional(),
  line1: z.string().trim().min(1, 'Adresse requise').max(160),
  line2: z.string().trim().max(160).nullable().optional(),
  postal_code: z.string().trim().min(2, 'Code postal requis').max(16),
  city: z.string().trim().min(1, 'Ville requise').max(80),
  province: z.string().trim().max(80).nullable().optional(),
  country_code: z.string().length(2).toUpperCase(),
  phone: z.string().trim().max(32).nullable().optional(),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema.extend({ quantity: z.number().int().min(1).max(20) })).min(1),
  email: z.string().trim().toLowerCase().email("L'adresse e-mail n'est pas valide."),
  phone: z.string().trim().max(32).nullable().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.nullable().optional(),
  shippingMethodCode: z.string().trim().max(60).nullable().optional(),
  discountCode: z.string().trim().max(60).nullable().optional(),
  customerNote: z.string().trim().max(500).nullable().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
