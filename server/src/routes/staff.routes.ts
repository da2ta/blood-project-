import { Router } from 'express';
import { getStaff, getStaffById, createStaff, updateStaff, updateStaffStatus } from '../controllers/staff.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStaffSchema, updateStaffSchema, updateStaffStatusSchema } from '../schemas/staff.schema.js';

const router = Router();

// All staff routes require authentication
router.use(authenticate);

// GET routes can be accessed by HOSPITAL_ADMIN and optionally BLOOD_BANK_STAFF if needed,
// but usually staff management is restricted to admins. The spec says BLOOD_BANK_STAFF cannot manage users.
// We will restrict the entire route to HOSPITAL_ADMIN for managing, but GET could be open if needed.
// Based on spec: "BLOOD_BANK_STAFF Cannot Manage Users"
router.use(requireRole('HOSPITAL_ADMIN'));

router.get('/', getStaff);
router.get('/:id', getStaffById);
router.post('/', validate(createStaffSchema), createStaff);
router.put('/:id', validate(updateStaffSchema), updateStaff);
router.patch('/:id/status', validate(updateStaffStatusSchema), updateStaffStatus);

export default router;
