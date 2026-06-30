import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { RegisterFormData, ApiResponse, User } from '../types';

// ─── API Functions ──────────────────────────────────────────────────────────

export const registerHospital = async (data: RegisterFormData): Promise<ApiResponse> => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const uploadLicense = async (data: {
  fileData: string;
  fileName: string;
  mimeType: string;
}): Promise<ApiResponse> => {
  const response = await api.post('/api/auth/upload-license', data);
  return response.data;
};

// ─── TanStack Query Hooks ───────────────────────────────────────────────────

export const useRegister = () => {
  return useMutation({
    mutationFn: registerHospital,
  });
};

export const useUploadLicense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
