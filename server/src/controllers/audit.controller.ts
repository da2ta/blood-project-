import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * GET /api/audit-logs
 * Fetch paginated audit logs for the hospital with filtering.
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      res.status(403).json({ success: false, error: 'Not associated with a hospital' });
      return;
    }

    const { page = '1', limit = '50', action, userId, entity, fromDate, toDate } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { hospitalId };

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, department: true }
          }
        }
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs', details: error.message });
  }
};
