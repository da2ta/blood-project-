import { z } from 'zod';

export const updateHospitalProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
