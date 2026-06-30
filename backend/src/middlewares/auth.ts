import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import prisma from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string; // "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "BLOOD_BANK_STAFF"
    hospitalId?: string; // Present if tied to a hospital
    staffId?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify token signature and session validity directly with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // 2. Load matching SQL user profile from local DB using the Supabase ID
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: { staffProfile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Associated user profile not found' });
    }

    // 3. Verify hospital verification status
    if (user.staffProfile) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.staffProfile.hospitalId },
      });

      if (!hospital) {
        return res.status(403).json({ error: 'Associated hospital not found' });
      }

      if (hospital.verificationStatus === 'SUSPENDED') {
        return res.status(403).json({ error: 'Hospital is suspended. Access denied.' });
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.staffProfile?.hospitalId || undefined,
      staffId: user.staffProfile?.id || undefined,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication verification failed: ' + err.message });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
    }

    next();
  };
};
