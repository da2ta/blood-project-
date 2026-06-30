import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, session, isLoading, isAuthenticated, signOut, initialize, setUser } = useAuthStore();

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signOut,
    initialize,
    setUser,
    isAdmin: user?.role === 'SUPER_ADMIN',
    isHospitalAdmin: user?.role === 'HOSPITAL_ADMIN',
    isStaff: user?.role === 'BLOOD_BANK_STAFF',
    hospitalApproved: user?.hospital?.status === 'APPROVED',
    hospitalPending: user?.hospital?.status === 'PENDING',
  };
};
