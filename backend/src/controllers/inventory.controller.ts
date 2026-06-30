import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { generateInventoryPDF } from '../services/pdf.service';

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

export const getInventory = async (req: AuthenticatedRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    // 1. Fetch threshold setting
    const thresholdSetting = await prisma.setting.findUnique({
      where: { hospitalId_key: { hospitalId, key: 'low_stock_threshold' } },
    });
    const lowStockThreshold = thresholdSetting ? parseInt(thresholdSetting.value) : 5;

    // 2. Fetch all blood units
    const units = await prisma.bloodUnit.findMany({
      where: { hospitalId },
      orderBy: { expiryDate: 'asc' },
      include: { donor: true },
    });

    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 3. Mark units status on-the-fly for security & safety
    const updatedUnits = units.map(unit => {
      let calcStatus = unit.status;
      const exp = new Date(unit.expiryDate);
      
      if (unit.status === 'AVAILABLE') {
        if (exp < now) {
          calcStatus = 'EXPIRED';
        } else if (exp <= sevenDaysFromNow) {
          calcStatus = 'EXPIRING_SOON';
        }
      }
      return {
        ...unit,
        computedStatus: calcStatus, // "AVAILABLE", "RESERVED", "USED", "EXPIRED", "EXPIRING_SOON", "IN_TRANSIT", "TRANSFERRED"
      };
    });

    // Automatically check for expired units in the background and update database
    const expiredIds = updatedUnits
      .filter(u => u.computedStatus === 'EXPIRED' && u.status !== 'EXPIRED')
      .map(u => u.id);

    if (expiredIds.length > 0) {
      await prisma.bloodUnit.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'EXPIRED' },
      });
      await logAction(
        req.user!.id,
        'STOCK_AUTO_EXPIRE',
        `Automatically expired ${expiredIds.length} blood units past their expiry date.`
      );
    }

    // 4. Group inventory metrics
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const summary: Record<string, { available: number; reserved: number; expiring: number; expired: number; status: string }> = {};

    bloodGroups.forEach(group => {
      const groupUnits = updatedUnits.filter(u => u.bloodGroup === group);
      const available = groupUnits.filter(u => u.computedStatus === 'AVAILABLE').length;
      const reserved = groupUnits.filter(u => u.computedStatus === 'RESERVED').length;
      const expiring = groupUnits.filter(u => u.computedStatus === 'EXPIRING_SOON').length;
      const expired = groupUnits.filter(u => u.computedStatus === 'EXPIRED').length;

      // Group stock warning levels
      let groupStatus = 'AVAILABLE'; // Green
      if (available === 0 && expiring === 0) {
        groupStatus = 'CRITICAL'; // Red
      } else if (available < lowStockThreshold) {
        groupStatus = 'LOW_STOCK'; // Yellow
      }

      summary[group] = {
        available,
        reserved,
        expiring,
        expired,
        status: groupStatus,
      };
    });

    return res.json({
      units: updatedUnits,
      summary,
      lowStockThreshold,
    });
  } catch (error: any) {
    console.error('Fetch inventory error:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory: ' + error.message });
  }
};

export const addBloodUnit = async (req: AuthenticatedRequest, res: Response) => {
  const { bloodGroup, quantity, collectionDate, expiryDate, donorId, storageTemperature } = req.body;
  const hospitalId = req.user?.hospitalId;

  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanGroup = bloodGroup.replace('+', 'POS').replace('-', 'NEG');
    const bloodUnitId = `BAG-${cleanGroup}-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const newUnit = await prisma.bloodUnit.create({
      data: {
        bloodUnitId,
        bloodGroup,
        quantity: parseFloat(quantity || '1'),
        collectionDate: new Date(collectionDate),
        expiryDate: new Date(expiryDate),
        donorId: donorId || null,
        storageTemperature: parseFloat(storageTemperature || '4.0'),
        hospitalId,
        status: 'AVAILABLE',
      },
    });

    await logAction(
      req.user!.id,
      'BLOOD_ADD',
      `Added blood unit bag ${bloodUnitId} (${bloodGroup}).`
    );

    return res.status(201).json({
      message: 'Blood unit bag added successfully',
      unit: newUnit,
    });
  } catch (error: any) {
    console.error('Add blood unit error:', error);
    return res.status(500).json({ error: 'Failed to add blood unit: ' + error.message });
  }
};

export const updateBloodUnitStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, storageTemperature } = req.body;
  const hospitalId = req.user?.hospitalId;

  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const unit = await prisma.bloodUnit.findFirst({
      where: { id, hospitalId },
    });

    if (!unit) {
      return res.status(404).json({ error: 'Blood unit bag not found in your inventory' });
    }

    const updated = await prisma.bloodUnit.update({
      where: { id },
      data: {
        status: status || unit.status,
        storageTemperature: storageTemperature !== undefined ? parseFloat(storageTemperature) : unit.storageTemperature,
      },
    });

    await logAction(
      req.user!.id,
      'BLOOD_UPDATE',
      `Updated blood unit bag ${unit.bloodUnitId} status to ${status || unit.status}.`
    );

    return res.json({
      message: 'Blood unit updated successfully',
      unit: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update blood unit: ' + error.message });
  }
};

export const getDonors = async (req: AuthenticatedRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const donors = await prisma.donor.findMany({
      where: { hospitalId },
      orderBy: { name: 'asc' },
    });
    return res.json(donors);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch donors: ' + error.message });
  }
};

export const addDonor = async (req: AuthenticatedRequest, res: Response) => {
  const { name, age, gender, bloodGroup, weight, contact, medicalHistory } = req.body;
  const hospitalId = req.user?.hospitalId;

  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const donor = await prisma.donor.create({
      data: {
        name,
        age: parseInt(age),
        gender,
        bloodGroup,
        weight: parseFloat(weight),
        contact,
        medicalHistory: medicalHistory || '',
        eligibilityStatus: 'ELIGIBLE',
        hospitalId,
      },
    });

    await logAction(
      req.user!.id,
      'DONOR_ADD',
      `Registered blood donor ${name} (${bloodGroup}).`
    );

    return res.status(201).json({
      message: 'Donor registered successfully',
      donor,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to register donor: ' + error.message });
  }
};

export const exportInventoryReport = async (req: AuthenticatedRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const units = await prisma.bloodUnit.findMany({
      where: { hospitalId },
      orderBy: { expiryDate: 'asc' },
    });

    const pdfBuffer = await generateInventoryPDF(hospital.name, units);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Inventory_Report_${Date.now()}.pdf`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
};
