import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Hospital, ApiResponse, PaginatedResponse } from '../types';

// ─── API Functions ──────────────────────────────────────────────────────────

export const fetchHospitals = async (params?: {
  status?: string;
  city?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Hospital>> => {
  const response = await api.get('/api/hospitals', { params });
  return response.data;
};

export const fetchHospital = async (id: string): Promise<ApiResponse<Hospital>> => {
  const response = await api.get(`/api/hospitals/${id}`);
  return response.data;
};

export const approveHospital = async ({ id, reason }: { id: string; reason?: string }) => {
  const response = await api.patch<{ success: boolean; message: string; data: Hospital }>(`/api/hospitals/${id}/approve`, { reason });
  return response.data;
};

export const rejectHospital = async ({ id, reason }: { id: string; reason?: string }) => {
  const response = await api.patch<{ success: boolean; message: string; data: Hospital }>(`/api/hospitals/${id}/reject`, { reason });
  return response.data;
};

export const suspendHospital = async (id: string) => {
  const response = await api.patch<{ success: boolean; message: string; data: Hospital }>(`/api/hospitals/${id}/suspend`);
  return response.data;
};

export const getHospitalProfile = async () => {
  const response = await api.get<{ success: boolean; data: Hospital }>('/api/hospitals/profile');
  return response.data.data;
};

export const updateHospitalProfile = async (data: Partial<Hospital>) => {
  const response = await api.put<{ success: boolean; data: Hospital }>('/api/hospitals/profile', data);
  return response.data.data;
};

export const getDashboardSummary = async () => {
  const response = await api.get<{ success: boolean; data: any }>('/api/hospitals/dashboard-summary');
  return response.data.data;
};

// ─── TanStack Query Hooks ───────────────────────────────────────────────────

export const useHospitals = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: ['hospitals', params],
    queryFn: () => fetchHospitals(params),
  });
};

export const useHospital = (id: string) => {
  return useQuery({
    queryKey: ['hospital', id],
    queryFn: () => fetchHospital(id),
    enabled: !!id,
  });
};

export const useApproveHospital = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveHospital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
};

export const useRejectHospital = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectHospital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
};
