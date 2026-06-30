import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';

// Helper to log audit actions
const logAction = async (userId: string | null, action: string, details: string) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, details },
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

export const getHospitals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        staff: { include: { user: true } },
      },
    });
    return res.json(hospitals);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch hospitals: ' + error.message });
  }
};

export const verifyHospital = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // "APPROVED" | "REJECTED" | "SUSPENDED"

  if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status value' });
  }

  try {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: { verificationStatus: status },
    });

    await logAction(
      req.user!.id,
      'HOSPITAL_VERIFY',
      `SuperAdmin set hospital ${hospital.name} status to ${status}.`
    );

    // Notify any active staff of the hospital
    const staff = await prisma.hospitalStaff.findMany({ where: { hospitalId: id } });
    await Promise.all(
      staff.map(s =>
        prisma.notification.create({
          data: {
            userId: s.userId,
            title: `Hospital Status: ${status}`,
            message: `Your hospital verification status has been updated to ${status}.`,
            type: 'SYSTEM',
          },
        })
      )
    );

    return res.json({
      message: `Hospital verification status updated to ${status}`,
      hospital: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Verification failed: ' + error.message });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 100, // safety cap
    });
    return res.json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch audit logs: ' + error.message });
  }
};

export const getSystemAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalHospitals = await prisma.hospital.count();
    const approvedHospitals = await prisma.hospital.count({ where: { verificationStatus: 'APPROVED' } });
    const pendingHospitals = await prisma.hospital.count({ where: { verificationStatus: 'PENDING' } });
    
    const totalUnits = await prisma.bloodUnit.count();
    const availableUnits = await prisma.bloodUnit.count({ where: { status: 'AVAILABLE' } });
    const expiredUnits = await prisma.bloodUnit.count({ where: { status: 'EXPIRED' } });
    
    const totalTransfers = await prisma.transfer.count();
    const completedTransfers = await prisma.transfer.count({ where: { status: 'COMPLETED' } });
    
    // Group distribution analysis
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const distribution = await Promise.all(
      bloodGroups.map(async (group) => {
        const count = await prisma.bloodUnit.count({
          where: { bloodGroup: group, status: 'AVAILABLE' },
        });
        return { group, count };
      })
    );

    // Monthly transfer trend estimation
    const requestsCount = await prisma.bloodRequest.count();
    const criticalRequestsCount = await prisma.bloodRequest.count({
      where: { priority: { in: ['CRITICAL', 'EMERGENCY'] } },
    });

    return res.json({
      hospitals: {
        total: totalHospitals,
        approved: approvedHospitals,
        pending: pendingHospitals,
      },
      bloodUnits: {
        total: totalUnits,
        available: availableUnits,
        expired: expiredUnits,
      },
      transfers: {
        total: totalTransfers,
        completed: completedTransfers,
      },
      requests: {
        total: requestsCount,
        critical: criticalRequestsCount,
      },
      distribution,
    });
  } catch (error: any) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ error: 'Failed to compile system analytics: ' + error.message });
  }
};

export const getActiveNetwork = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { verificationStatus: 'APPROVED' },
      include: {
        bloodUnits: {
          where: { status: 'AVAILABLE' }
        }
      }
    });

    const network = hospitals.map(h => {
      const counts: Record<string, number> = {};
      h.bloodUnits.forEach(u => {
        counts[u.bloodGroup] = (counts[u.bloodGroup] || 0) + 1;
      });

      return {
        id: h.id,
        name: h.name,
        address: h.address,
        city: h.city,
        state: h.state,
        contactNumber: h.contactNumber,
        emergencyContact: h.emergencyContact,
        email: h.email,
        latitude: h.latitude,
        longitude: h.longitude,
        availability: counts,
        totalStock: h.bloodUnits.length,
      };
    });

    return res.json(network);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve active network: ' + error.message });
  }
};

