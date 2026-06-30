-- ============================================================================
-- HemoExchange AI — Row Level Security Policies
-- ============================================================================
-- Run this SQL in Supabase SQL Editor or via psql after Prisma migrations.
-- Prisma uses the direct connection (service role), which bypasses RLS.
-- These policies protect data when accessed via Supabase client (anon key).
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hospital" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BloodUnit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Donor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BloodRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransferItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIPrediction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSetting" ENABLE ROW LEVEL SECURITY;

-- ─── User Policies ──────────────────────────────────────────────────────────

-- Users can read their own record
CREATE POLICY "users_select_own" ON "User"
  FOR SELECT USING (
    "supabaseId" = auth.uid()::text
  );

-- Users can update their own record
CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE USING (
    "supabaseId" = auth.uid()::text
  );

-- ─── Hospital Policies ──────────────────────────────────────────────────────

-- Approved hospitals are visible to all authenticated users
CREATE POLICY "hospitals_select_approved" ON "Hospital"
  FOR SELECT USING (
    "status" = 'APPROVED' AND "deletedAt" IS NULL
  );

-- Hospital admins can see their own hospital regardless of status
CREATE POLICY "hospitals_select_own" ON "Hospital"
  FOR SELECT USING (
    id IN (
      SELECT "hospitalId" FROM "User"
      WHERE "supabaseId" = auth.uid()::text
    )
  );

-- ─── Notification Policies ──────────────────────────────────────────────────

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON "Notification"
  FOR SELECT USING (
    "userId" IN (
      SELECT id FROM "User"
      WHERE "supabaseId" = auth.uid()::text
    )
  );

-- Users can update (mark read) their own notifications
CREATE POLICY "notifications_update_own" ON "Notification"
  FOR UPDATE USING (
    "userId" IN (
      SELECT id FROM "User"
      WHERE "supabaseId" = auth.uid()::text
    )
  );

-- ─── Service Role Bypass ────────────────────────────────────────────────────
-- The Express backend uses the direct connection string (service role),
-- which automatically bypasses RLS. No additional policies needed for
-- server-side operations.

-- ─── Notes ──────────────────────────────────────────────────────────────────
-- BloodUnit, BloodRequest, Transfer, AuditLog, InventoryLog, AIPrediction,
-- and SystemSetting tables are accessed exclusively through the Express
-- backend (via Prisma + direct connection), so RLS policies are minimal.
-- The Supabase client on the frontend is used only for Auth and Realtime.
