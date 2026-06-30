import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore } from '../store/notificationStore';

export function PendingApprovalPage() {
  const { user, signOut, initialize } = useAuth();
  const { addToast } = useNotificationStore();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await initialize();
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: 'Checked latest registration status.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Check failed',
        message: 'Failed to verify status. Please try again.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Pending Approval
          </h1>

          <p className="text-slate-500 mb-2">
            Your hospital registration is currently under review.
          </p>

          {user?.hospital && (
            <p className="text-sm text-slate-400 mb-6">
              <strong>{user.hospital.name}</strong> — submitted on{' '}
              {user.hospital.createdAt
                ? new Date(user.hospital.createdAt).toLocaleDateString()
                : 'recently'}
            </p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              A system administrator will review your registration and verify your 
              hospital credentials. You will be notified once your account is approved.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />}
              onClick={handleCheckStatus}
              isLoading={isChecking}
              className="w-full"
            >
              Check Approval Status
            </Button>
            <Button
              variant="secondary"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={signOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
