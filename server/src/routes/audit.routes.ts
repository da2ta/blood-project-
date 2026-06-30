import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Require auth and HOSPITAL_ADMIN role (blood bank staff cannot view audit logs)
router.use(authenticate);
router.use(requireRole('HOSPITAL_ADMIN'));

router.get('/', getAuditLogs);

export default router;
