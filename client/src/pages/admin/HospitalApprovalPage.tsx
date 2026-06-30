import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Building2, Clock, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useHospitals, useApproveHospital, useRejectHospital } from '../../api/hospital.api';
import { useNotificationStore } from '../../store/notificationStore';
import { HOSPITAL_STATUS_LABELS } from '../../constants';

export function HospitalApprovalPage() {
  const { data, isLoading, error } = useHospitals({ status: 'PENDING' });
  const approveMutation = useApproveHospital();
  const rejectMutation = useRejectHospital();
  const { addToast } = useNotificationStore();

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveMutation.mutateAsync({ id });
      addToast({ type: 'success', title: 'Hospital Approved', message: `${name} has been approved.` });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to approve hospital.' });
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await rejectMutation.mutateAsync({ id });
      addToast({ type: 'warning', title: 'Hospital Rejected', message: `${name} has been rejected.` });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to reject hospital.' });
    }
  };

  const hospitals = data?.data || [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Hospital Approvals</h1>
        <p className="text-slate-500 mt-1">
          Review and approve pending hospital registrations.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <p className="text-red-600">Failed to load hospitals. Please try again.</p>
        </Card>
      ) : hospitals.length === 0 ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">All Caught Up!</h2>
            <p className="text-slate-500">No pending hospital registrations to review.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hospitals.map((hospital, idx) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{hospital.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          {HOSPITAL_STATUS_LABELS[hospital.status]}
                        </Badge>
                        <span className="text-sm text-slate-500">{hospital.type}</span>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-500">
                          {hospital.city}, {hospital.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Reg: {hospital.registrationNumber}
                        </span>
                        <span>{hospital.email}</span>
                        <span>{hospital.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-16 md:ml-0">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      isLoading={approveMutation.isPending}
                      onClick={() => handleApprove(hospital.id, hospital.name)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      isLoading={rejectMutation.isPending}
                      onClick={() => handleReject(hospital.id, hospital.name)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
