import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { logAudit } from '../services/audit.service.js';
import { sanitizeObject } from '../utils/sanitize.js';

// ─── Validation Schemas ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  // User fields
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),

  // Hospital fields
  hospitalName: z.string().min(2, 'Hospital name must be at least 2 characters').max(200),
  registrationNumber: z.string().min(3, 'Registration number is required').max(50),
  hospitalType: z.enum(['Government', 'Private', 'Medical College']),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  phone: z.string().regex(/^[+]?\d{10,13}$/, 'Invalid phone number'),
  hospitalEmail: z.string().email('Invalid hospital email'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Controller Functions ────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new hospital and admin user.
 * Creates Supabase Auth user + Hospital (PENDING) + User (HOSPITAL_ADMIN).
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const input = sanitizeObject(req.body as RegisterInput);

    // Check if hospital registration number or email already exists
    const existingHospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { registrationNumber: input.registrationNumber },
          { email: input.hospitalEmail },
        ],
        deletedAt: null,
      },
    });

    if (existingHospital) {
      res.status(409).json({
        success: false,
        error: 'A hospital with this registration number or email already exists',
      });
      return;
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
      return;
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: false,
    });

    if (authError || !authData.user) {
      res.status(400).json({
        success: false,
        error: authError?.message || 'Failed to create auth account',
      });
      return;
    }

    // Create Hospital and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: input.hospitalName,
          registrationNumber: input.registrationNumber,
          type: input.hospitalType,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          phone: input.phone,
          email: input.hospitalEmail,
          website: input.website || null,
          status: 'PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          supabaseId: authData.user.id,
          email: input.email,
          name: input.name,
          role: 'HOSPITAL_ADMIN',
          hospitalId: hospital.id,
        },
      });

      return { hospital, user };
    });

    // Audit log
    await logAudit({
      userId: result.user.id,
      hospitalId: result.hospital.id,
      action: 'REGISTER_HOSPITAL',
      entity: 'Hospital',
      entityId: result.hospital.id,
      newData: { hospitalName: result.hospital.name, userEmail: result.user.email },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your hospital is pending approval.',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        hospital: {
          id: result.hospital.id,
          name: result.hospital.name,
          status: result.hospital.status,
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: 'Registration failed: ' + err.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user's profile with hospital info.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id, deletedAt: null },
      include: { hospital: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        hospital: user.hospital
          ? {
              id: user.hospital.id,
              name: user.hospital.name,
              status: user.hospital.status,
              type: user.hospital.type,
              city: user.hospital.city,
              state: user.hospital.state,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

/**
 * POST /api/auth/upload-license
 * Upload hospital license document to Supabase Storage.
 * Must be called after registration with the hospital ID.
 */
export const uploadLicense = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ success: false, error: 'No hospital associated with this user' });
      return;
    }

    // File is expected as base64 in request body
    const { fileData, fileName, mimeType } = req.body as {
      fileData: string;
      fileName: string;
      mimeType: string;
    };

    // Validate MIME type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP',
      });
      return;
    }

    // Validate file size (max 5MB)
    const buffer = Buffer.from(fileData, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB',
      });
      return;
    }

    const filePath = `licenses/${hospitalId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('hospital-documents')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      res.status(500).json({
        success: false,
        error: 'Failed to upload file: ' + uploadError.message,
      });
      return;
    }

    // Update hospital with license document path
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: { licenseDocument: filePath },
    });

    await logAudit({
      userId: req.user.id,
      hospitalId,
      action: 'UPLOAD_LICENSE',
      entity: 'Hospital',
      entityId: hospitalId,
      newData: { filePath },
      req,
    });

    res.json({
      success: true,
      message: 'License document uploaded successfully',
      data: { filePath },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload license' });
  }
};
