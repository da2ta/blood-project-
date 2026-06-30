# HemoExchange AI — Database Schema Documentation

## Overview

- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma 7 with driver adapter (`@prisma/adapter-pg`)
- **Region:** ap-south-1 (Mumbai) for DPDP Act compliance

## Design Principles

1. **Soft Deletes** — All entities have a `deletedAt` field. Records are never hard-deleted.
2. **Audit Trail** — All CUD operations write to the `AuditLog` table.
3. **UUID Primary Keys** — All tables use UUIDs for primary keys.
4. **Indexed Queries** — Composite and single-column indexes on frequently queried fields.

## Enums

| Enum | Values |
|------|--------|
| `Role` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `BLOOD_BANK_STAFF` |
| `HospitalStatus` | `PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED` |
| `BloodGroup` | `A_POSITIVE`, `A_NEGATIVE`, `B_POSITIVE`, `B_NEGATIVE`, `AB_POSITIVE`, `AB_NEGATIVE`, `O_POSITIVE`, `O_NEGATIVE` |
| `BloodUnitStatus` | `AVAILABLE`, `RESERVED`, `TRANSFERRED`, `USED`, `EXPIRED`, `DISCARDED` |
| `RequestPriority` | `NORMAL`, `MEDIUM`, `HIGH`, `EMERGENCY`, `CRITICAL` |
| `RequestStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `DISPATCHED`, `DELIVERED`, `CANCELLED` |
| `TransferStatus` | `INITIATED`, `IN_TRANSIT`, `DELIVERED`, `FAILED` |

## Models

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| supabaseId | String | Unique, links to Supabase Auth UID |
| email | String | Unique |
| name | String | |
| role | Role enum | |
| hospitalId | UUID? | FK → Hospital |
| isActive | Boolean | Default: true |
| deletedAt | DateTime? | Soft delete |

### Hospital
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | |
| registrationNumber | String | Unique |
| type | String | Government, Private, Medical College |
| status | HospitalStatus | Default: PENDING |
| licenseDocument | String? | Supabase Storage path |
| deletedAt | DateTime? | Soft delete |

### BloodUnit
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| unitCode | String | Unique (format: HEX-YYYY-BG-XXXXX) |
| bloodGroup | BloodGroup | |
| quantityMl | Int | Default: 450 |
| status | BloodUnitStatus | Default: AVAILABLE |
| hospitalId | UUID | FK → Hospital |
| expiryDate | DateTime | Indexed for expiry detection |
| deletedAt | DateTime? | Soft delete |

### AuditLog
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID? | FK → User |
| hospitalId | UUID? | FK → Hospital |
| action | String | e.g., CREATE_BLOOD_UNIT, APPROVE_HOSPITAL |
| entity | String | e.g., BloodUnit, Hospital |
| entityId | String | |
| oldData | JSON? | Previous state |
| newData | JSON? | New state |
| ipAddress | String? | |
| userAgent | String? | |

## RLS Policies

Row Level Security is enabled on all tables. The Express backend uses Prisma with a direct connection (service role), which bypasses RLS. RLS policies protect data accessed via the Supabase client (anon key) on the frontend.

Key policies:
- Users can only read/update their own User record
- Approved hospitals are visible to all authenticated users
- Users can only read/update their own notifications
- All other tables are accessed exclusively through the backend API

## Indexes

| Table | Fields | Purpose |
|-------|--------|---------|
| User | supabaseId | Auth lookup |
| User | hospitalId | Hospital user queries |
| Hospital | city | Geographic queries |
| Hospital | status | Approval queue |
| BloodUnit | bloodGroup, status | Inventory queries |
| BloodUnit | hospitalId | Hospital inventory |
| BloodUnit | expiryDate | Expiry detection |
| BloodRequest | status, priority | Request queue |
| AuditLog | entity, entityId | Entity history |
