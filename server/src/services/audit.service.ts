import { Request } from 'express';
import { prisma } from '../lib/prisma.js';

interface AuditLogParams {
  userId?: string | null;
  hospitalId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  req?: Request;
  requestId?: string;
  result?: string;
}

/**
 * Write an entry to the AuditLog table.
 * Called on every create/update/delete operation for compliance.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        hospitalId: params.hospitalId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : null,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : null,
        ipAddress: params.req?.ip ?? params.req?.socket.remoteAddress ?? null,
        userAgent: params.req?.headers['user-agent'] ?? null,
        requestId: params.requestId ?? null,
        result: params.result ?? 'SUCCESS',
      },
    });
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error('Failed to write audit log:', error);
  }
}
