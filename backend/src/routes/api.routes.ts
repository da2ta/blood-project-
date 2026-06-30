import { Router } from 'express';
import {
  registerHospital,
  login,
  getProfile,
  addStaff,
} from '../controllers/auth.controller';
import {
  getInventory,
  addBloodUnit,
  updateBloodUnitStatus,
  getDonors,
  addDonor,
  exportInventoryReport,
} from '../controllers/inventory.controller';
import {
  getRequests,
  createRequest,
  respondToRequest,
  dispatchTransfer,
  deliverTransfer,
} from '../controllers/request.controller';
import {
  getHospitals,
  verifyHospital,
  getAuditLogs,
  getSystemAnalytics,
  getActiveNetwork,
} from '../controllers/admin.controller';
import { getInventoryAIInsights } from '../controllers/ai.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

// 1. Authentication Routes
router.post('/auth/register', registerHospital);
router.post('/auth/login', login);
router.get('/auth/profile', requireAuth, getProfile);
router.post('/auth/staff', requireAuth, requireRole(['HOSPITAL_ADMIN']), addStaff);

// 2. Inventory & Donor Routes
router.get('/inventory', requireAuth, getInventory);
router.post('/inventory', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), addBloodUnit);
router.put('/inventory/:id', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), updateBloodUnitStatus);
router.get('/inventory/report', requireAuth, exportInventoryReport);

router.get('/donors', requireAuth, getDonors);
router.post('/donors', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), addDonor);

// 3. Request & Transfer Routes
router.get('/requests', requireAuth, getRequests);
router.post('/requests', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), createRequest);
router.put('/requests/:id/respond', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), respondToRequest);

router.post('/transfers/dispatch', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), dispatchTransfer);
router.post('/transfers/deliver', requireAuth, requireRole(['HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF']), deliverTransfer);

// 4. Admin Overseer Routes (Super Admin)
router.get('/admin/hospitals', requireAuth, requireRole(['SUPER_ADMIN']), getHospitals);
router.put('/admin/hospitals/:id/verify', requireAuth, requireRole(['SUPER_ADMIN']), verifyHospital);
router.get('/admin/logs', requireAuth, requireRole(['SUPER_ADMIN']), getAuditLogs);
router.get('/admin/analytics', requireAuth, getSystemAnalytics); // Admin and general metrics dashboard access

// 5. General Network Map Route
router.get('/hospitals', requireAuth, getActiveNetwork);

// 6. Gemini AI Insights Route
router.get('/ai/insights', requireAuth, getInventoryAIInsights);

export default router;
