# HemoExchange AI — REST API Documentation

## Base URL

- **Development:** `http://localhost:3001`
- **Production:** `https://your-backend.render.com`

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

The token is obtained from Supabase Auth on the frontend and validated on the backend via `supabaseAdmin.auth.getUser(token)`.

## Rate Limiting

| Scope | Limit |
|-------|-------|
| Global | 100 requests / 15 minutes |
| Auth endpoints | 10 requests / 15 minutes |

---

## Endpoints

### Health Check

#### `GET /health`

Returns API status.

**Response:**
```json
{
  "success": true,
  "message": "HemoExchange AI API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

### Auth

#### `POST /api/auth/register`

Register a new hospital and admin user.

**Rate limited:** 10 req/15min

**Body:**
```json
{
  "name": "Dr. John Smith",
  "email": "john@hospital.org",
  "password": "securePassword123",
  "hospitalName": "City General Hospital",
  "registrationNumber": "MCI/REG/12345",
  "hospitalType": "Government",
  "address": "123 Medical Lane",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "phone": "+919876543210",
  "hospitalEmail": "admin@citygeneral.org",
  "website": "https://citygeneral.org"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Your hospital is pending approval.",
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "HOSPITAL_ADMIN" },
    "hospital": { "id": "...", "name": "...", "status": "PENDING" }
  }
}
```

---

#### `GET /api/auth/me`

Get current authenticated user's profile.

**Auth required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "john@hospital.org",
    "name": "Dr. John Smith",
    "role": "HOSPITAL_ADMIN",
    "isActive": true,
    "hospital": {
      "id": "...",
      "name": "City General Hospital",
      "status": "APPROVED",
      "type": "Government",
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  }
}
```

---

#### `POST /api/auth/upload-license`

Upload hospital license document.

**Auth required:** Yes

**Body:**
```json
{
  "fileData": "<base64_encoded_file>",
  "fileName": "license.pdf",
  "mimeType": "application/pdf"
}
```

**Constraints:**
- Max file size: 5MB
- Allowed types: PDF, JPEG, PNG, WebP

---

### Hospitals

#### `GET /api/hospitals`

List hospitals. Super Admin sees all, others see only approved.

**Auth required:** Yes

**Query params:**
- `status` — Filter by status (Super Admin only): `PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED`
- `city` — Filter by city (case-insensitive)
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 50)

---

#### `GET /api/hospitals/:id`

Get hospital detail with users and counts.

**Auth required:** Yes

---

#### `PATCH /api/hospitals/:id/approve`

Approve a pending hospital registration.

**Auth required:** Yes  
**Role required:** `SUPER_ADMIN`

---

#### `PATCH /api/hospitals/:id/reject`

Reject a pending hospital registration.

**Auth required:** Yes  
**Role required:** `SUPER_ADMIN`

---

#### `PATCH /api/hospitals/:id/suspend`

Suspend an approved hospital.

**Auth required:** Yes  
**Role required:** `SUPER_ADMIN`

---

### Users

#### `GET /api/users`

List users. Super Admin sees all, Hospital Admin sees own hospital's users.

**Auth required:** Yes  
**Role required:** `SUPER_ADMIN` or `HOSPITAL_ADMIN`

**Query params:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 50)

---

#### `PATCH /api/users/:id`

Update user (role, active status).

**Auth required:** Yes  
**Role required:** `SUPER_ADMIN` or `HOSPITAL_ADMIN`

**Body:**
```json
{
  "role": "BLOOD_BANK_STAFF",
  "isActive": false
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error description"
}
```

Validation errors include field-level details:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "pincode", "message": "Pincode must be 6 digits" }
  ]
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Rate Limited |
| 500 | Internal Server Error |
