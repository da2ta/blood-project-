import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']),
  department: z.string().optional(),
});

export const updateStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']).optional(),
  department: z.string().optional(),
});

export const updateStaffStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});
