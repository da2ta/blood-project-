import { Router } from 'express';
import { register, getMe, uploadLicense, registerSchema } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// POST /api/auth/register — Register hospital + admin user
router.post('/register', authLimiter, validate(registerSchema), register);

// GET /api/auth/me — Get current user profile (requires auth)
router.get('/me', authenticate, getMe);

// POST /api/auth/upload-license — Upload hospital license document
router.post('/upload-license', authenticate, uploadLicense);

export default router;
