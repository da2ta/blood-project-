import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logAudit } from '../services/audit.service.js';

/**
 * GET /api/users
 * List users. Super Admin sees all, Hospital Admin sees own hospital's users.
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { deletedAt: null };

    // Hospital admins only see their own hospital's users
    if (req.user.role === 'HOSPITAL_ADMIN') {
      where.hospitalId = req.user.hospitalId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          hospital: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

/**
 * PATCH /api/users/:id
 * Update a user (role, isActive). Super Admin or Hospital Admin (own hospital only).
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role, isActive } = req.body as { role?: string; isActive?: boolean };

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Hospital admins can only manage users in their own hospital
    if (req.user.role === 'HOSPITAL_ADMIN' && user.hospitalId !== req.user.hospitalId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Cannot modify super admins unless you are one
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Cannot modify super admin' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined && req.user.role === 'SUPER_ADMIN') {
      updateData.role = role;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    await logAudit({
      userId: req.user.id,
      hospitalId: req.user.hospitalId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      oldData: { role: user.role, isActive: user.isActive },
      newData: updateData,
      req,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};
