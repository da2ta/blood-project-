import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('=== STARTING HEMOEXCHANGE AUTHENTICATION & SECURITY AUDIT ===');

  // 1. Audit User Roles
  console.log('\n[1] Auditing User Accounts and Roles...');
  const users = await prisma.user.findMany({
    include: { hospital: true },
  });

  console.log(`Total users in system: ${users.length}`);
  users.forEach((user) => {
    console.log(`- Name: ${user.name} | Email: ${user.email} | Role: ${user.role} | Hospital: ${user.hospital?.name || 'None'} | Status: ${user.status}`);
  });

  // 2. Audit Hospital Facilities
  console.log('\n[2] Auditing Hospital Facility Registrations...');
  const hospitals = await prisma.hospital.findMany();
  console.log(`Total hospitals in system: ${hospitals.length}`);
  hospitals.forEach((hosp) => {
    console.log(`- Hospital: ${hosp.name} | Registration No: ${hosp.registrationNumber} | Status: ${hosp.status} | Email: ${hosp.email}`);
  });

  // 3. Verify Database Audit Logs
  console.log('\n[3] Auditing System Security Logs...');
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: true, hospital: true },
  });

  console.log(`Recent security audit log entries (up to 10):`);
  logs.forEach((log) => {
    console.log(`[${log.createdAt.toISOString()}]`);
    console.log(`  Action: ${log.action}`);
    console.log(`  Entity: ${log.entity} (ID: ${log.entityId})`);
    console.log(`  User: ${log.user?.email || 'System/Unauthenticated'}`);
    console.log(`  Hospital: ${log.hospital?.name || 'N/A'}`);
    console.log(`  IP Address: ${log.ipAddress || 'Unknown'}`);
    console.log(`  Browser/UA: ${log.userAgent || 'Unknown'}`);
    if (log.newData) {
      console.log(`  Details: ${JSON.stringify(log.newData)}`);
    }
  });

  // 4. Security Check Vulnerability Analysis
  console.log('\n[4] Security Architecture Checklists:');
  const superAdminCount = users.filter(u => u.role === 'SUPER_ADMIN').length;
  console.log(`- Super Admins Registered: ${superAdminCount} (Recommendation: Keep to minimum)`);
  
  const pendingHospitalsCount = hospitals.filter(h => h.status === 'PENDING').length;
  console.log(`- Pending Facilities: ${pendingHospitalsCount} (Requires admin review)`);

  const orphanUsers = users.filter(u => u.role !== 'SUPER_ADMIN' && !u.hospitalId);
  console.log(`- Orphan Users (Non-admins without hospital associations): ${orphanUsers.length} (Expected: 0)`);
  if (orphanUsers.length > 0) {
    console.warn('⚠️ WARNING: Found orphan users without hospital ids!');
  } else {
    console.log('✅ OK: All hospital staff/admins are correctly associated with facilities.');
  }

  console.log('\n============================================================');
  console.log('✅ DATABASE AUDIT FINISHED SUCCESSFULLY');
  console.log('============================================================');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
