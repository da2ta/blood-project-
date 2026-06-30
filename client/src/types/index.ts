export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'BLOOD_BANK_STAFF';
  isActive: boolean;
  hospital: Hospital | null;
}

export interface Hospital {
  id: string;
  name: string;
  registrationNumber?: string;
  type: string;
  address?: string;
  city: string;
  state: string;
  pincode?: string;
  phone?: string;
  email: string;
  website?: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  verifiedAt?: string;
  licenseDocument?: string;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  hospitalName: string;
  registrationNumber: string;
  hospitalType: 'Government' | 'Private' | 'Medical College';
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  hospitalEmail: string;
  website?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
