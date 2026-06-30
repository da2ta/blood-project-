import { Response } from 'express';
import supabase from '../config/supabase';
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

export const registerHospital = async (req: AuthenticatedRequest, res: Response) => {
  const {
    // User info
    email,
    password,
    name,
    // Hospital info
    hospitalName,
    registrationNumber,
    licenseNumber,
    address,
    city,
    state,
    contactNumber,
    emergencyContact,
    hospitalEmail,
    latitude,
    longitude,
  } = req.body;

  try {
    // 1. Check if user email or hospital registration exists in our local DB
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingReg = await prisma.hospital.findFirst({
      where: {
        OR: [
          { registrationNumber },
          { email: hospitalEmail },
        ]
      }
    });

    if (existingReg) {
      return res.status(400).json({ error: 'Hospital registration or email already exists' });
    }

    // 2. Register user in Supabase Auth via the Admin API
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (signUpError || !authData.user) {
      return res.status(400).json({ error: signUpError?.message || 'Failed to create user in Supabase' });
    }

    const supabaseUserId = authData.user.id;

    // 3. Create profile records in local DB inside a Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: hospitalName,
          registrationNumber,
          licenseNumber,
          address,
          city,
          state,
          contactNumber,
          emergencyContact,
          email: hospitalEmail,
          latitude: parseFloat(latitude || '0'),
          longitude: parseFloat(longitude || '0'),
          verificationStatus: 'PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          id: supabaseUserId, // Map local User ID directly to Supabase Auth ID
          email,
          passwordHash: 'SUPABASE_AUTH_MANAGED', // Placeholder string
          role: 'HOSPITAL_ADMIN',
          name,
        },
      });

      await tx.hospitalStaff.create({
        data: {
          userId: user.id,
          hospitalId: hospital.id,
          role: 'ADMIN',
        },
      });

      return { user, hospital };
    });

    await logAction(
      result.user.id,
      'HOSPITAL_REGISTER',
      `Hospital ${result.hospital.name} registered. Status: PENDING.`
    );

    // 4. Log in the newly registered user to return the session token
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const token = sessionData?.session?.access_token || '';

    return res.status(201).json({
      message: 'Hospital registered successfully! Verification is pending approval.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.name,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Authenticate using Supabase Auth client
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session || !authData.user) {
      return res.status(401).json({ error: authError?.message || 'Invalid email or password' });
    }

    const supabaseUserId = authData.user.id;

    // 2. Fetch local user profile matching the Supabase ID
    const user = await prisma.user.findUnique({
      where: { id: supabaseUserId },
      include: { staffProfile: { include: { hospital: true } } },
    });

    if (!user) {
      return res.status(401).json({ error: 'Profile not integrated. Contact supervisor.' });
    }

    // 3. Verify hospital status
    if (user.staffProfile) {
      const status = user.staffProfile.hospital.verificationStatus;
      if (status === 'REJECTED') {
        return res.status(403).json({ error: 'Hospital application was rejected.' });
      }
      if (status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Hospital account has been suspended by administrator.' });
      }
    }

    await logAction(user.id, 'USER_LOGIN', `User ${user.email} logged in via Supabase Auth.`);

    return res.json({
      token: authData.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        hospital: user.staffProfile ? {
          id: user.staffProfile.hospital.id,
          name: user.staffProfile.hospital.name,
          verificationStatus: user.staffProfile.hospital.verificationStatus,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed: ' + error.message });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { staffProfile: { include: { hospital: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      hospital: user.staffProfile?.hospital || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile: ' + error.message });
  }
};

export const addStaff = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role } = req.body;
  const hospitalId = req.user?.hospitalId;

  if (!hospitalId) {
    return res.status(403).json({ error: 'User is not associated with any hospital' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 1. Create User in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (signUpError || !authData.user) {
      return res.status(400).json({ error: signUpError?.message || 'Failed to create user in Supabase' });
    }

    const supabaseUserId = authData.user.id;

    // 2. Link records in Prisma
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: supabaseUserId,
          email,
          passwordHash: 'SUPABASE_AUTH_MANAGED',
          role: 'BLOOD_BANK_STAFF',
          name,
        },
      });

      const staff = await tx.hospitalStaff.create({
        data: {
          userId: newUser.id,
          hospitalId,
          role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        },
      });

      return newUser;
    });

    await logAction(
      req.user!.id,
      'STAFF_ADD',
      `Staff member ${email} added by admin.`
    );

    return res.status(201).json({
      message: 'Staff member added successfully!',
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
      },
    });
  } catch (error: any) {
    console.error('Staff creation error:', error);
    return res.status(500).json({ error: 'Failed to add staff: ' + error.message });
  }
};
