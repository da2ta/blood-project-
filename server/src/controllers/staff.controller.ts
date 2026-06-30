import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { logAudit } from '../services/audit.service.js';

export const getStaff = async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ error: 'Not associated with a hospital' });
    }

    const staff = await prisma.user.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch staff', details: error.message });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const id = req.params.id as string;

    if (!hospitalId) {
      return res.status(403).json({ error: 'Not associated with a hospital' });
    }

    const staff = await prisma.user.findFirst({
      where: { id, hospitalId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch staff member', details: error.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ error: 'Not associated with a hospital' });
    }

    const { name, email, role, department } = req.body;

    if (role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot assign SUPER_ADMIN role' });
    }

    // 1. Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 2. Invite user via Supabase Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        role,
        hospitalId,
      },
    });

    if (authError || !authData.user) {
      return res.status(500).json({ error: 'Failed to invite user via Auth service', details: authError?.message });
    }

    // 3. Create user in Prisma
    const newUser = await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        email,
        name,
        role,
        hospitalId,
        department,
        status: 'ACTIVE',
      },
    });

    // 4. Audit Log
    await logAudit({
      userId: req.user?.id,
      hospitalId,
      action: 'CREATE_STAFF',
      entity: 'USER',
      entityId: newUser.id,
      newData: { name, email, role, department },
      req,
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create staff member', details: error.message });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const id = req.params.id as string;
    const { name, role, department } = req.body;

    if (role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot assign SUPER_ADMIN role' });
    }

    if (!hospitalId) {
      return res.status(403).json({ error: 'Not associated with a hospital' });
    }

    const existingStaff = await prisma.user.findFirst({
      where: { id, hospitalId },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(department && { department }),
      },
    });

    // Also update Supabase metadata if name/role changes
    if (name || role) {
      await supabaseAdmin.auth.admin.updateUserById(existingStaff.supabaseId, {
        user_metadata: {
          name: updatedUser.name,
          role: updatedUser.role,
        },
      });
    }

    await logAudit({
      userId: req.user?.id,
      hospitalId,
      action: 'UPDATE_STAFF',
      entity: 'USER',
      entityId: updatedUser.id,
      oldData: { name: existingStaff.name, role: existingStaff.role, department: existingStaff.department },
      newData: { name: updatedUser.name, role: updatedUser.role, department: updatedUser.department },
      req,
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update staff member', details: error.message });
  }
};

export const updateStaffStatus = async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const id = req.params.id as string;
    const { status } = req.body;

    if (!hospitalId) {
      return res.status(403).json({ error: 'Not associated with a hospital' });
    }

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot change your own status' });
    }

    const existingStaff = await prisma.user.findFirst({
      where: { id, hospitalId },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
    });

    // Optional: if suspended/inactive, we could invalidate Supabase sessions or block login
    if (status !== 'ACTIVE') {
      // In a real production scenario, you would want to ban or sign out the user here via Supabase Admin API.
    }

    await logAudit({
      userId: req.user?.id,
      hospitalId,
      action: 'UPDATE_STAFF_STATUS',
      entity: 'USER',
      entityId: updatedUser.id,
      oldData: { status: existingStaff.status },
      newData: { status: updatedUser.status },
      req,
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update staff status', details: error.message });
  }
};
