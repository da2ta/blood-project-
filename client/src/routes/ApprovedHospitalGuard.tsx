import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FullPageSpinner } from '../components/ui/Spinner';
import { ROUTES } from '../constants';

interface ApprovedHospitalGuardProps {
  children: React.ReactNode;
}

/**
 * Guard that checks if the user's hospital is approved.
 * Super admins bypass this check.
 * Hospital admins with PENDING status are redirected to the pending page.
 */
export function ApprovedHospitalGuard({ children }: ApprovedHospitalGuardProps) {
  const { isLoading, isAdmin, hospitalPending, hospitalApproved } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  // Super admins don't need an approved hospital
  if (isAdmin) {
    return <>{children}</>;
  }

  // Hospital pending approval
  if (hospitalPending) {
    return <Navigate to={ROUTES.PENDING_APPROVAL} replace />;
  }

  // Hospital not approved (rejected/suspended)
  if (!hospitalApproved) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}
