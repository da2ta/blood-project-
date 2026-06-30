import { api } from '../lib/axios';

export interface AuditLog {
  id: string;
  userId?: string;
  user?: {
    name: string;
    email: string;
    department?: string;
  };
  hospitalId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  result?: string;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  getLogs: async (params?: { page?: number; limit?: number; action?: string; userId?: string; entity?: string; fromDate?: string; toDate?: string }) => {
    const response = await api.get<PaginatedAuditLogs>('/api/audit-logs', { params });
    return response.data;
  },
};
