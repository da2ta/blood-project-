import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { broadcastEvent, notifyHospital } from '../config/socket';

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

export const getRequests = async (req: AuthenticatedRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const outgoing = await prisma.bloodRequest.findMany({
      where: { requestingHospitalId: hospitalId },
      include: {
        supplyingHospital: true,
        transfers: { include: { bloodUnits: { include: { bloodUnit: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const incoming = await prisma.bloodRequest.findMany({
      where: {
        OR: [
          { supplyingHospitalId: hospitalId },
          { supplyingHospitalId: null, status: 'PENDING' }, // broadcasted requests
        ],
      },
      include: {
        requestingHospital: true,
        transfers: { include: { bloodUnits: { include: { bloodUnit: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ outgoing, incoming });
  } catch (error: any) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests: ' + error.message });
  }
};

export const createRequest = async (req: AuthenticatedRequest, res: Response) => {
  const {
    bloodGroup,
    unitsRequired,
    priority, // CRITICAL, EMERGENCY, HIGH, NORMAL, LOW
    supplyingHospitalId, // null for broadcast
    patientAge,
    requiredBefore,
    reason,
    contactPerson,
    contactNumber,
  } = req.body;

  const requestingHospitalId = req.user?.hospitalId;
  if (!requestingHospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const requestingHospital = await prisma.hospital.findUnique({
      where: { id: requestingHospitalId },
    });

    if (!requestingHospital) {
      return res.status(404).json({ error: 'Requesting hospital not found' });
    }

    const newRequest = await prisma.bloodRequest.create({
      data: {
        bloodGroup,
        unitsRequired: parseInt(unitsRequired),
        priority,
        requestingHospitalId,
        supplyingHospitalId: supplyingHospitalId || null,
        status: 'PENDING',
        patientAge: parseInt(patientAge || '0'),
        requiredBefore: new Date(requiredBefore),
        reason: reason || '',
        contactPerson,
        contactNumber,
      },
    });

    // 1. Create a notification in DB
    const notifTitle = `${priority} Blood Request: ${bloodGroup}`;
    const notifMessage = `${requestingHospital.name} requires ${unitsRequired} units of ${bloodGroup} blood group immediately.`;

    if (supplyingHospitalId) {
      // Direct request notification
      await prisma.notification.create({
        data: {
          hospitalId: supplyingHospitalId,
          title: notifTitle,
          message: notifMessage,
          type: priority === 'CRITICAL' || priority === 'EMERGENCY' ? 'EMERGENCY' : 'REQUEST_UPDATE',
        },
      });
      
      notifyHospital(supplyingHospitalId, 'new_request', {
        request: newRequest,
        hospitalName: requestingHospital.name,
      });
    } else {
      // Broadcast request
      const otherHospitals = await prisma.hospital.findMany({
        where: { id: { not: requestingHospitalId }, verificationStatus: 'APPROVED' },
      });

      await Promise.all(
        otherHospitals.map(h =>
          prisma.notification.create({
            data: {
              hospitalId: h.id,
              title: `BROADCAST: ${notifTitle}`,
              message: notifMessage,
              type: priority === 'CRITICAL' || priority === 'EMERGENCY' ? 'EMERGENCY' : 'REQUEST_UPDATE',
            },
          })
        )
      );

      // Trigger standard Socket.IO event for dashboard overlays
      broadcastEvent('broadcast_request', {
        request: newRequest,
        hospitalName: requestingHospital.name,
        latitude: requestingHospital.latitude,
        longitude: requestingHospital.longitude,
      });
    }

    await logAction(
      req.user!.id,
      'REQUEST_CREATE',
      `Created ${priority} request for ${unitsRequired} units of ${bloodGroup}.`
    );

    return res.status(201).json({
      message: 'Blood request created successfully!',
      request: newRequest,
    });
  } catch (error: any) {
    console.error('Create request error:', error);
    return res.status(500).json({ error: 'Failed to create request: ' + error.message });
  }
};

export const respondToRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, bloodUnitIds } = req.body; // action: "ACCEPT", "REJECT"
  const supplyingHospitalId = req.user?.hospitalId;

  if (!supplyingHospitalId) {
    return res.status(403).json({ error: 'Not associated with a supplying hospital' });
  }

  try {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: { requestingHospital: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    if (action === 'REJECT') {
      const updatedRequest = await prisma.bloodRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          supplyingHospitalId,
        },
      });

      await prisma.notification.create({
        data: {
          hospitalId: request.requestingHospitalId,
          title: `Request Rejected: ${request.bloodGroup}`,
          message: `Your request for ${request.unitsRequired} units of ${request.bloodGroup} was rejected.`,
          type: 'REQUEST_UPDATE',
        },
      });

      notifyHospital(request.requestingHospitalId, 'request_updated', {
        request: updatedRequest,
      });

      await logAction(
        req.user!.id,
        'REQUEST_REJECT',
        `Rejected blood request ID ${id}.`
      );

      return res.json({ message: 'Request rejected successfully', request: updatedRequest });
    }

    if (action === 'ACCEPT') {
      if (!bloodUnitIds || !Array.isArray(bloodUnitIds) || bloodUnitIds.length === 0) {
        return res.status(400).json({ error: 'Accepting requests requires selecting specific blood unit bags to reserve.' });
      }

      // Check available blood units in stock
      const availableUnits = await prisma.bloodUnit.findMany({
        where: {
          id: { in: bloodUnitIds },
          hospitalId: supplyingHospitalId,
          status: 'AVAILABLE',
        },
      });

      if (availableUnits.length !== bloodUnitIds.length) {
        return res.status(400).json({ error: 'Some selected blood bags are no longer available in stock.' });
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Reserve units
        await tx.bloodUnit.updateMany({
          where: { id: { in: bloodUnitIds } },
          data: { status: 'RESERVED' },
        });

        // Update Request
        const updatedRequest = await tx.bloodRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            supplyingHospitalId,
          },
        });

        // Create secure verification pin code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create Transfer log
        const transfer = await tx.transfer.create({
          data: {
            requestId: id,
            status: 'PENDING',
            verificationCode,
          },
        });

        // Insert junctions
        await Promise.all(
          bloodUnitIds.map(unitId =>
            tx.transferBloodUnit.create({
              data: {
                transferId: transfer.id,
                bloodUnitId: unitId,
              },
            })
          )
        );

        return { request: updatedRequest, transfer, verificationCode };
      });

      // Notify requesting hospital
      await prisma.notification.create({
        data: {
          hospitalId: request.requestingHospitalId,
          title: `Request Approved: ${request.bloodGroup}`,
          message: `Your request for ${request.unitsRequired} units of ${request.bloodGroup} has been approved. Dispatch pending.`,
          type: 'REQUEST_UPDATE',
        },
      });

      notifyHospital(request.requestingHospitalId, 'request_updated', {
        request: result.request,
        transferId: result.transfer.id,
      });

      await logAction(
        req.user!.id,
        'REQUEST_ACCEPT',
        `Accepted blood request ${id}. Reserved ${bloodUnitIds.length} bags. Verification PIN issued.`
      );

      return res.json({
        message: 'Request approved and blood bags reserved!',
        request: result.request,
        transfer: result.transfer,
        verificationCode: result.verificationCode,
      });
    }

    return res.status(400).json({ error: 'Invalid response action' });
  } catch (error: any) {
    console.error('Respond request error:', error);
    return res.status(500).json({ error: 'Failed to process response: ' + error.message });
  }
};

export const dispatchTransfer = async (req: AuthenticatedRequest, res: Response) => {
  const { transferId } = req.body;
  const hospitalId = req.user?.hospitalId;

  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        request: true,
        bloodUnits: { include: { bloodUnit: true } },
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer log not found' });
    }

    if (transfer.request.supplyingHospitalId !== hospitalId) {
      return res.status(403).json({ error: 'Only the supplying hospital can dispatch this shipment.' });
    }

    const unitIds = transfer.bloodUnits.map(b => b.bloodUnitId);

    // Update status to IN_TRANSIT
    const result = await prisma.$transaction(async (tx) => {
      await tx.bloodUnit.updateMany({
        where: { id: { in: unitIds } },
        data: { status: 'IN_TRANSIT' },
      });

      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: 'IN_TRANSIT',
          dispatchedAt: new Date(),
        },
      });

      await tx.bloodRequest.update({
        where: { id: transfer.requestId },
        data: { status: 'IN_TRANSIT' },
      });

      return updatedTransfer;
    });

    // Notify receiving hospital
    await prisma.notification.create({
      data: {
        hospitalId: transfer.request.requestingHospitalId,
        title: `Shipment Dispatched: ${transfer.request.bloodGroup}`,
        message: `A blood bag shipment of ${transfer.bloodUnits.length} units has been dispatched and is in transit.`,
        type: 'REQUEST_UPDATE',
      },
    });

    notifyHospital(transfer.request.requestingHospitalId, 'transfer_status', {
      transfer: result,
      status: 'IN_TRANSIT',
    });

    await logAction(
      req.user!.id,
      'TRANSFER_DISPATCH',
      `Dispatched transfer ${transferId}. Blood units marked in transit.`
    );

    return res.json({
      message: 'Shipment marked as dispatched!',
      transfer: result,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Dispatch failed: ' + error.message });
  }
};

export const deliverTransfer = async (req: AuthenticatedRequest, res: Response) => {
  const { transferId, verificationCode } = req.body;
  const requestingHospitalId = req.user?.hospitalId;

  if (!requestingHospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        request: true,
        bloodUnits: { include: { bloodUnit: true } },
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer log not found' });
    }

    if (transfer.request.requestingHospitalId !== requestingHospitalId) {
      return res.status(403).json({ error: 'Only the requesting hospital can confirm delivery.' });
    }

    if (transfer.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification pin code! Access denied.' });
    }

    const unitIds = transfer.bloodUnits.map(b => b.bloodUnitId);

    // Complete transaction: transfer ownership of bags and mark available
    const result = await prisma.$transaction(async (tx) => {
      // Shift hospital ownership and set status to AVAILABLE
      await tx.bloodUnit.updateMany({
        where: { id: { in: unitIds } },
        data: {
          hospitalId: requestingHospitalId,
          status: 'AVAILABLE',
        },
      });

      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          deliveredAt: new Date(),
        },
      });

      await tx.bloodRequest.update({
        where: { id: transfer.requestId },
        data: { status: 'COMPLETED' },
      });

      return updatedTransfer;
    });

    // Notify supplying hospital of arrival
    if (transfer.request.supplyingHospitalId) {
      await prisma.notification.create({
        data: {
          hospitalId: transfer.request.supplyingHospitalId,
          title: `Delivery Confirmed`,
          message: `Your dispatched transfer for request ${transfer.request.bloodGroup} was successfully delivered and verified.`,
          type: 'REQUEST_UPDATE',
        },
      });

      notifyHospital(transfer.request.supplyingHospitalId, 'transfer_status', {
        transfer: result,
        status: 'COMPLETED',
      });
    }

    await logAction(
      req.user!.id,
      'TRANSFER_COMPLETE',
      `Confirmed delivery of transfer ${transferId}. Ownership of ${unitIds.length} bags shifted.`
    );

    return res.json({
      message: 'Delivery successfully verified and units integrated into your stock!',
      transfer: result,
    });
  } catch (error: any) {
    console.error('Deliver verification error:', error);
    return res.status(500).json({ error: 'Delivery verification failed: ' + error.message });
  }
};
