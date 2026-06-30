import { Router } from 'express';
import {
  listHospitals,
  getHospital,
  approveHospital,
  rejectHospital,
  suspendHospital,
  getHospitalProfile,
  updateHospitalProfile,
  getDashboardSummary,
} from '../controllers/hospital.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateHospitalProfileSchema } from '../schemas/hospital.schema.js';

const router = Router();

// All hospital routes require authentication
router.use(authenticate);

// GET /api/hospitals/profile - Get current hospital profile
router.get('/profile', getHospitalProfile);

// PUT /api/hospitals/profile - Update current hospital profile
router.put('/profile', requireRole('HOSPITAL_ADMIN'), validate(updateHospitalProfileSchema), updateHospitalProfile);

// GET /api/hospitals/dashboard-summary - Get dashboard stats
router.get('/dashboard-summary', getDashboardSummary);

// GET /api/hospitals — List hospitals
router.get('/', listHospitals);

// GET /api/hospitals/:id — Get hospital detail
router.get('/:id', getHospital);

// PATCH /api/hospitals/:id/approve — Approve hospital (Super Admin only)
router.patch('/:id/approve', requireRole('SUPER_ADMIN'), approveHospital);

// PATCH /api/hospitals/:id/reject — Reject hospital (Super Admin only)
router.patch('/:id/reject', requireRole('SUPER_ADMIN'), rejectHospital);

// PATCH /api/hospitals/:id/suspend — Suspend hospital (Super Admin only)
router.patch('/:id/suspend', requireRole('SUPER_ADMIN'), suspendHospital);

export default router;
