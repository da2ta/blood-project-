import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean existing tables
  await prisma.setting.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.transferBloodUnit.deleteMany({});
  await prisma.transfer.deleteMany({});
  await prisma.bloodRequest.deleteMany({});
  await prisma.bloodUnit.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.hospitalStaff.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@hemoexchange.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      name: 'Super Admin Officer',
    }
  });

  // 2. Create Hospitals
  const hospitalA = await prisma.hospital.create({
    data: {
      name: 'Metropolis General Hospital',
      registrationNumber: 'HOSP-REG-A101',
      licenseNumber: 'LIC-BLOOD-9821A',
      address: '742 Evergreen Terrace',
      city: 'Metropolis',
      state: 'NY',
      contactNumber: '+1-555-0199',
      emergencyContact: '+1-555-0100',
      email: 'contact@metrogeneral.org',
      latitude: 40.7128,
      longitude: -74.0060,
      verificationStatus: 'APPROVED',
    }
  });

  const hospitalB = await prisma.hospital.create({
    data: {
      name: 'City Blood Bank & Research Lab',
      registrationNumber: 'HOSP-REG-B202',
      licenseNumber: 'LIC-BLOOD-7742B',
      address: '100 Main Street',
      city: 'Metropolis',
      state: 'NY',
      contactNumber: '+1-555-0299',
      emergencyContact: '+1-555-0200',
      email: 'info@citybloodbank.org',
      latitude: 40.7250,
      longitude: -74.0100,
      verificationStatus: 'APPROVED',
    }
  });

  const hospitalC = await prisma.hospital.create({
    data: {
      name: 'St. Jude Emergency Center',
      registrationNumber: 'HOSP-REG-C303',
      licenseNumber: 'LIC-BLOOD-3311C',
      address: '250 Broadway Ave',
      city: 'Metropolis',
      state: 'NY',
      contactNumber: '+1-555-0399',
      emergencyContact: '+1-555-0300',
      email: 'emergency@stjude.org',
      latitude: 40.7300,
      longitude: -73.9900,
      verificationStatus: 'PENDING', // Testing approval flow
    }
  });

  // 3. Create Users & Staff associations
  const userAdminA = await prisma.user.create({
    data: {
      email: 'admina@hospital.com',
      passwordHash,
      role: 'HOSPITAL_ADMIN',
      name: 'Dr. Sarah Connor',
    }
  });

  await prisma.hospitalStaff.create({
    data: {
      userId: userAdminA.id,
      hospitalId: hospitalA.id,
      role: 'ADMIN',
    }
  });

  const userStaffA = await prisma.user.create({
    data: {
      email: 'staffa@hospital.com',
      passwordHash,
      role: 'BLOOD_BANK_STAFF',
      name: 'Nurse John Doe',
    }
  });

  await prisma.hospitalStaff.create({
    data: {
      userId: userStaffA.id,
      hospitalId: hospitalA.id,
      role: 'STAFF',
    }
  });

  const userAdminB = await prisma.user.create({
    data: {
      email: 'adminb@hospital.com',
      passwordHash,
      role: 'HOSPITAL_ADMIN',
      name: 'Dr. Peter Parker',
    }
  });

  await prisma.hospitalStaff.create({
    data: {
      userId: userAdminB.id,
      hospitalId: hospitalB.id,
      role: 'ADMIN',
    }
  });

  const userStaffB = await prisma.user.create({
    data: {
      email: 'staffb@hospital.com',
      passwordHash,
      role: 'BLOOD_BANK_STAFF',
      name: 'Technician Mary Jane',
    }
  });

  await prisma.hospitalStaff.create({
    data: {
      userId: userStaffB.id,
      hospitalId: hospitalB.id,
      role: 'STAFF',
    }
  });

  const userAdminC = await prisma.user.create({
    data: {
      email: 'adminc@hospital.com',
      passwordHash,
      role: 'HOSPITAL_ADMIN',
      name: 'Dr. Bruce Wayne',
    }
  });

  await prisma.hospitalStaff.create({
    data: {
      userId: userAdminC.id,
      hospitalId: hospitalC.id,
      role: 'ADMIN',
    }
  });

  // 4. Create Settings
  await prisma.setting.create({
    data: { hospitalId: hospitalA.id, key: 'low_stock_threshold', value: '5' }
  });
  await prisma.setting.create({
    data: { hospitalId: hospitalB.id, key: 'low_stock_threshold', value: '5' }
  });

  // 5. Create Donors
  const donor1 = await prisma.donor.create({
    data: {
      name: 'Clark Kent',
      age: 33,
      gender: 'Male',
      bloodGroup: 'O+',
      weight: 85.5,
      contact: '+1-555-0001',
      medicalHistory: 'None, reports feeling super.',
      lastDonation: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      donationCount: 15,
      eligibilityStatus: 'ELIGIBLE',
      hospitalId: hospitalA.id,
    }
  });

  const donor2 = await prisma.donor.create({
    data: {
      name: 'Diana Prince',
      age: 30,
      gender: 'Female',
      bloodGroup: 'AB+',
      weight: 62.0,
      contact: '+1-555-0002',
      medicalHistory: 'Athletic, high stamina.',
      lastDonation: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Recent
      donationCount: 8,
      eligibilityStatus: 'ELIGIBLE',
      hospitalId: hospitalA.id,
    }
  });

  const donor3 = await prisma.donor.create({
    data: {
      name: 'Arthur Curry',
      age: 35,
      gender: 'Male',
      bloodGroup: 'O-',
      weight: 90.0,
      contact: '+1-555-0003',
      medicalHistory: 'Exposed to salt water.',
      lastDonation: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      donationCount: 20,
      eligibilityStatus: 'ELIGIBLE',
      hospitalId: hospitalB.id,
    }
  });

  // 6. Create Blood Units
  const now = new Date();
  
  // Helper for adding days
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  // Metropolis General Units
  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-A-OPLUS-001',
      bloodGroup: 'O+',
      quantity: 1.0,
      collectionDate: addDays(now, -10),
      expiryDate: addDays(now, 25), // Available
      donorId: donor1.id,
      storageTemperature: 4.2,
      hospitalId: hospitalA.id,
      status: 'AVAILABLE',
    }
  });

  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-A-OPLUS-002',
      bloodGroup: 'O+',
      quantity: 1.0,
      collectionDate: addDays(now, -38),
      expiryDate: addDays(now, -3), // Expired
      donorId: donor1.id,
      storageTemperature: 3.9,
      hospitalId: hospitalA.id,
      status: 'EXPIRED',
    }
  });

  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-A-ABPLUS-001',
      bloodGroup: 'AB+',
      quantity: 1.0,
      collectionDate: addDays(now, -33),
      expiryDate: addDays(now, 2), // Expiring soon
      donorId: donor2.id,
      storageTemperature: 4.5,
      hospitalId: hospitalA.id,
      status: 'AVAILABLE',
    }
  });

  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-A-BMINUS-001',
      bloodGroup: 'B-',
      quantity: 1.0,
      collectionDate: addDays(now, -5),
      expiryDate: addDays(now, 30),
      storageTemperature: 4.1,
      hospitalId: hospitalA.id,
      status: 'AVAILABLE',
    }
  });

  // City Blood Bank Units
  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-B-ONEG-001',
      bloodGroup: 'O-',
      quantity: 1.0,
      collectionDate: addDays(now, -8),
      expiryDate: addDays(now, 27),
      donorId: donor3.id,
      storageTemperature: 4.0,
      hospitalId: hospitalB.id,
      status: 'AVAILABLE',
    }
  });

  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-B-ONEG-002',
      bloodGroup: 'O-',
      quantity: 1.0,
      collectionDate: addDays(now, -12),
      expiryDate: addDays(now, 23),
      donorId: donor3.id,
      storageTemperature: 3.8,
      hospitalId: hospitalB.id,
      status: 'AVAILABLE',
    }
  });

  await prisma.bloodUnit.create({
    data: {
      bloodUnitId: 'BAG-B-AMINUS-001',
      bloodGroup: 'A-',
      quantity: 1.0,
      collectionDate: addDays(now, -15),
      expiryDate: addDays(now, 20),
      storageTemperature: 4.3,
      hospitalId: hospitalB.id,
      status: 'AVAILABLE',
    }
  });

  // 7. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: 'SYSTEM_INIT',
      details: 'System database successfully seeded and operational.',
      ipAddress: '127.0.0.1',
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
