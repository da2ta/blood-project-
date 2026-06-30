import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { analyzeHospitalInventory } from '../services/ai.service';

export const getInventoryAIInsights = async (req: AuthenticatedRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) {
    return res.status(403).json({ error: 'Not associated with a hospital' });
  }

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // 1. Fetch current inventory units
    const inventory = await prisma.bloodUnit.findMany({
      where: { hospitalId },
    });

    // 2. Fetch other approved hospitals
    const nearby = await prisma.hospital.findMany({
      where: {
        id: { not: hospitalId },
        verificationStatus: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        city: true,
      },
    });

    // 3. Request Gemini AI analysis
    const insights = await analyzeHospitalInventory(hospital.name, inventory, nearby);
    
    return res.json(insights);
  } catch (error: any) {
    console.error('AI insight error:', error);
    return res.status(500).json({ error: 'Failed to retrieve AI insights: ' + error.message });
  }
};
