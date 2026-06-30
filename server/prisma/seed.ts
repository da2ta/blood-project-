import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

/**
 * Seed script for initial Super Admin user.
 * 
 * Before running this:
 * 1. Create a user in Supabase Auth (Dashboard → Authentication → Users → Add User)
 * 2. Copy the user's UID
 * 3. Set the SUPER_ADMIN_SUPABASE_ID below
 */
async function main() {
  const SUPER_ADMIN_SUPABASE_ID = process.env.SUPER_ADMIN_SUPABASE_ID || 'REPLACE_WITH_SUPABASE_USER_UID';
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@hemoexchange.ai';
  const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'System Administrator';

  if (SUPER_ADMIN_SUPABASE_ID === 'REPLACE_WITH_SUPABASE_USER_UID') {
    console.warn('⚠️  Please set SUPER_ADMIN_SUPABASE_ID before running seed.');
    console.warn('   1. Create a user in Supabase Dashboard → Authentication → Users');
    console.warn('   2. Copy the UID and set it as SUPER_ADMIN_SUPABASE_ID env var');
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN', deletedAt: null },
  });

  if (existingAdmin) {
    console.log('✅ Super Admin already exists:', existingAdmin.email);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      supabaseId: SUPER_ADMIN_SUPABASE_ID,
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin created:', admin.email);

  // Create default system settings
  await prisma.systemSetting.upsert({
    where: { key: 'low_stock_threshold' },
    update: {},
    create: {
      key: 'low_stock_threshold',
      value: { default: 10 },
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'expiry_warning_days' },
    update: {},
    create: {
      key: 'expiry_warning_days',
      value: { default: 7 },
    },
  });

  console.log('✅ System settings initialized');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
