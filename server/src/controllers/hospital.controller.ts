import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { logAudit } from '../services/audit.service.js';
import { updateHospitalProfileSchema } from '../schemas/hospital.schema.js';

// ─── Validation Schemas ─────────────────────────────────────────────────────

export const approveRejectSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500).optional(),
});

// ─── Controller Functions ────────────────────────────────────────────────────

/**
 * GET /api/hospitals
 * List hospitals. Super Admin sees all, others see only approved.
 */
export const listHospitals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, city, page = '1', limit = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { deletedAt: null };

    // Non-super-admins only see approved hospitals
    if (req.user.role !== 'SUPER_ADMIN') {
      where.status = 'APPROVED';
    } else if (status) {
      where.status = status;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          registrationNumber: true,
          type: true,
          city: true,
          state: true,
          status: true,
          email: true,
          phone: true,
          createdAt: true,
          verifiedAt: true,
        },
      }),
      prisma.hospital.count({ where }),
    ]);

    res.json({
      success: true,
      data: hospitals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospitals' });
  }
};

/**
 * GET /api/hospitals/:id
 * Get hospital detail.
 */
export const getHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const hospital = await prisma.hospital.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            bloodUnits: true,
            outgoingRequests: true,
            incomingRequests: true,
          },
        },
      },
    });

    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    // Non-super-admins can only view approved hospitals or their own
    if (
      req.user.role !== 'SUPER_ADMIN' &&
      hospital.status !== 'APPROVED' &&
      req.user.hospitalId !== hospital.id
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospital' });
  }
};

/**
 * PATCH /api/hospitals/:id/approve
 * Super Admin approves a hospital registration.
 */
export const approveHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const hospital = await prisma.hospital.findFirst({
      where: { id, deletedAt: null },
    });

    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    if (hospital.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: `Hospital is already ${hospital.status.toLowerCase()}`,
      });
      return;
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    });

    await logAudit({
      userId: req.user.id,
      hospitalId: id,
      action: 'APPROVE_HOSPITAL',
      entity: 'Hospital',
      entityId: id,
      oldData: { status: hospital.status },
      newData: { status: updated.status },
      req,
    });

    res.json({
      success: true,
      message: 'Hospital approved successfully',
      data: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        verifiedAt: updated.verifiedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve hospital' });
  }
};

/**
 * PATCH /api/hospitals/:id/reject
 * Super Admin rejects a hospital registration.
 */
export const rejectHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const hospital = await prisma.hospital.findFirst({
      where: { id, deletedAt: null },
    });

    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    if (hospital.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: `Hospital is already ${hospital.status.toLowerCase()}`,
      });
      return;
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await logAudit({
      userId: req.user.id,
      hospitalId: id,
      action: 'REJECT_HOSPITAL',
      entity: 'Hospital',
      entityId: id,
      oldData: { status: hospital.status },
      newData: { status: updated.status },
      req,
    });

    res.json({
      success: true,
      message: 'Hospital rejected',
      data: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject hospital' });
  }
};

/**
 * PATCH /api/hospitals/:id/suspend
 * Super Admin suspends an approved hospital.
 */
export const suspendHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const hospital = await prisma.hospital.findFirst({
      where: { id, deletedAt: null },
    });

    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    if (hospital.status !== 'APPROVED') {
      res.status(400).json({
        success: false,
        error: 'Only approved hospitals can be suspended',
      });
      return;
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    await logAudit({
      userId: req.user.id,
      hospitalId: id,
      action: 'SUSPEND_HOSPITAL',
      entity: 'Hospital',
      entityId: id,
      oldData: { status: hospital.status },
      newData: { status: updated.status },
      req,
    });

    res.json({
      success: true,
      message: 'Hospital suspended',
      data: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to suspend hospital' });
  }
};

/**
 * GET /api/hospitals/profile
 * Get the currently logged-in hospital's profile details.
 */
export const getHospitalProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.user.hospitalId;
    if (!id) {
      res.status(403).json({ success: false, error: 'User is not associated with any hospital' });
      return;
    }

    const hospital = await prisma.hospital.findFirst({
      where: { id, deletedAt: null },
    });

    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospital profile' });
  }
};


/**
 * PUT /api/hospitals/profile
 * Update the currently logged-in hospital's profile details.
 */
export const updateHospitalProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.user.hospitalId;
    if (!id) {
      res.status(403).json({ success: false, error: 'User is not associated with any hospital' });
      return;
    }

    const existing = await prisma.hospital.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    // Safely parse request body, discarding unallowed fields like id, status, registrationNumber, etc.
    const parsedData = updateHospitalProfileSchema.parse(req.body);

    const updated = await prisma.hospital.update({
      where: { id },
      data: parsedData,
    });

    await logAudit({
      userId: req.user.id,
      hospitalId: id,
      action: 'UPDATE_HOSPITAL_PROFILE',
      entity: 'Hospital',
      entityId: id,
      oldData: existing,
      newData: updated,
      req,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.issues[0]?.message || 'Invalid input data' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update hospital profile' });
  }
};

/**
 * GET /api/hospitals/dashboard-summary
 * Get summary stats for the dashboard.
 */
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.user.hospitalId;
    if (!id) {
      res.status(403).json({ success: false, error: 'User is not associated with any hospital' });
      return;
    }

    const [hospital, totalStaff, activeStaff, pendingInvitations, auditCountToday] = await Promise.all([
      prisma.hospital.findUnique({ where: { id }, select: { status: true, verifiedAt: true } }),
      prisma.user.count({ where: { hospitalId: id, deletedAt: null } }),
      prisma.user.count({ where: { hospitalId: id, status: 'ACTIVE', deletedAt: null } }),
      prisma.user.count({ where: { hospitalId: id, status: 'INACTIVE', deletedAt: null } }),
      prisma.auditLog.count({
        where: {
          hospitalId: id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalStaff,
        activeStaff,
        pendingInvitations,
        auditEventsToday: auditCountToday,
        hospitalStatus: hospital?.status || 'UNKNOWN',
        verifiedAt: hospital?.verifiedAt || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard summary' });
  }
};
