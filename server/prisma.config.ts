import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
  migrate: {
    async seed() {
      const { execSync } = await import('child_process');
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    },
  },
});
