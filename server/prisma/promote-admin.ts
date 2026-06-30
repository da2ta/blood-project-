import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabase.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('Fetching users from Supabase Auth...');
  
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error || !data?.users || data.users.length === 0) {
    console.error('No users found in Supabase Auth. Please register a user first on the signup page.');
    return;
  }
  
  console.log(`Found ${data.users.length} user(s) in Supabase Auth.`);
  
  // Display users
  data.users.forEach((u, i) => {
    console.log(`[${i}] Email: ${u.email} | UID: ${u.id}`);
  });

  // Promote the first user by default (which will be your registered account)
  const targetUser = data.users[0];
  console.log(`\nPromoting user "${targetUser.email}" to SUPER_ADMIN role...`);

  const updatedUser = await prisma.user.upsert({
    where: { supabaseId: targetUser.id },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isActive: true,
    },
    create: {
      supabaseId: targetUser.id,
      email: targetUser.email || '',
      name: targetUser.user_metadata?.name || 'System Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  console.log(`\n🎉 Success! "${updatedUser.email}" is now a SUPER_ADMIN in the HemoExchange database.`);
  console.log('You can now log in with this account and access the Super Admin Portal to approve hospitals.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
