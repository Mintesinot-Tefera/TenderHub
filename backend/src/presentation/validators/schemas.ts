import { z } from 'zod';
import { UserRole } from '../../domain/entities/User';
import { TenderStatus } from '../../domain/entities/Tender';

// Ethiopian phone: +251 followed by 9 digits (e.g. +251911234567)
const phoneSchema = z
  .string()
  .regex(/^\+251\d{9}$/, 'Phone must start with +251 followed by 9 digits');

// Treat empty strings as "not provided" then validate
const optionalPhone = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  phoneSchema.optional()
);

const optionalUrl = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().url('Must be a valid URL').optional()
);

const optionalString = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional()
);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
  companyName: optionalString,
  phone: optionalPhone,
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: optionalString,
  phone: optionalPhone,
  avatarUrl: optionalUrl,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const tenderQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(TenderStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const submitBidSchema = z.object({
  amount: z.coerce.number().positive(),
  proposal: z.string().min(20, 'Proposal must be at least 20 characters'),
  deliveryDays: z.coerce.number().int().positive(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const postDiscussionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, 'Content must be at least 3 characters')
    .max(2000, 'Content must be at most 2000 characters'),
  parentId: z.string().uuid().optional(),
});
