import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

/**
 * Authenticate requests using Supabase JWT tokens.
 * Extracts Bearer token → verifies via Supabase Admin → loads user from Prisma.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user: supabaseUser },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id, deletedAt: null },
      include: { hospital: true },
    });

    if (!dbUser) {
      res.status(401).json({ success: false, error: 'User not found in system' });
      return;
    }

    if (!dbUser.isActive) {
      res.status(403).json({ success: false, error: 'Account is deactivated' });
      return;
    }

    req.user = dbUser;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

/**
 * Require specific roles for route access.
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Require that the user's hospital is approved.
 */
export const requireApprovedHospital = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  // Super admins don't need an approved hospital
  if (req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  if (!req.user.hospital || req.user.hospital.status !== 'APPROVED') {
    res.status(403).json({
      success: false,
      error: 'Your hospital registration is pending approval',
    });
    return;
  }

  next();
};
