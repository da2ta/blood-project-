import { api } from '../lib/axios';

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: 'HOSPITAL_ADMIN' | 'BLOOD_BANK_STAFF';
  department?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
  createdAt: string;
}

export const staffApi = {
  getStaff: async () => {
    const response = await api.get<Staff[]>('/api/staff');
    return response.data;
  },
  getStaffById: async (id: string) => {
    const response = await api.get<Staff>(`/api/staff/${id}`);
    return response.data;
  },
  createStaff: async (data: { name: string; email: string; role: string; department?: string }) => {
    const response = await api.post<Staff>('/api/staff', data);
    return response.data;
  },
  updateStaff: async (id: string, data: { name?: string; role?: string; department?: string }) => {
    const response = await api.put<Staff>(`/api/staff/${id}`, data);
    return response.data;
  },
  updateStaffStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    const response = await api.patch<Staff>(`/api/staff/${id}/status`, { status });
    return response.data;
  },
};
