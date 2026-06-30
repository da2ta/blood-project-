import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/hospital.api';
import { Users, UserCheck, Mail, ShieldAlert } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { ROLES } from '../constants';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: user?.role === 'HOSPITAL_ADMIN' || user?.role === 'BLOOD_BANK_STAFF',
  });

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="p-8 bg-blue-50 text-blue-600 rounded-xl text-center font-medium">
          Navigate to Hospital Approvals to manage registrations.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Hospital Dashboard 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, {user?.name}
            </p>
          </div>
          <Badge variant="info">
            {user?.role ? ROLES[user.role as keyof typeof ROLES] : ''}
          </Badge>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Staff</p>
              <h3 className="text-2xl font-bold text-slate-900">{summary?.totalStaff || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Staff</p>
              <h3 className="text-2xl font-bold text-slate-900">{summary?.activeStaff || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Inactive / Suspended</p>
              <h3 className="text-2xl font-bold text-slate-900">{summary?.pendingInvitations || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Audit Events Today</p>
              <h3 className="text-2xl font-bold text-slate-900">{summary?.auditEventsToday || 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for future blood inventory charts */}
      <div className="mt-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Blood Inventory Trends</h3>
        <p className="text-slate-500">Detailed blood inventory analytics and AI predictions will be available in Phase 3.</p>
      </div>
    </div>
  );
}
