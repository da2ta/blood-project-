import { Router } from 'express';
import { listUsers, updateUser } from '../controllers/user.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users — List users (Super Admin or Hospital Admin)
router.get('/', requireRole('SUPER_ADMIN', 'HOSPITAL_ADMIN'), listUsers);

// PATCH /api/users/:id — Update user (Super Admin or Hospital Admin)
router.patch('/:id', requireRole('SUPER_ADMIN', 'HOSPITAL_ADMIN'), updateUser);

export default router;
