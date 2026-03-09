# API

## Base URL

- Local API root: `http://localhost:4000`
- Version prefix: `/api/v1`

## Response shape

Successful responses use:

```json
{
  "data": {}
}
```

Error responses use:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Auth rules

- Public: `POST /api/v1/auth/login`, `GET /api/v1/health`
- Authenticated: `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `GET /api/v1/work-orders`, `GET /api/v1/work-orders/:id`, `POST /api/v1/uploads`
- Technician only: work order mutations and `POST /api/v1/incidents`
- Supervisor only: dashboard routes plus incident list/detail/update routes

Authentication uses `Authorization: Bearer <token>`.

## Endpoint summary

### Auth

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Public | Create a session for a seeded technician or supervisor |
| `POST` | `/api/v1/auth/logout` | Authenticated | End the current client-side session |
| `GET` | `/api/v1/auth/me` | Authenticated | Revalidate the current session and return the current user |

### Work orders

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/work-orders` | Authenticated | List work orders, optionally filtered by status |
| `GET` | `/api/v1/work-orders/:id` | Authenticated | Load full work order detail, steps, incidents, and template info |
| `POST` | `/api/v1/work-orders/:id/start` | Technician | Start or resume a work order |
| `POST` | `/api/v1/work-orders/:id/pause` | Technician | Pause an in-progress work order |
| `POST` | `/api/v1/work-orders/:id/complete` | Technician | Close a work order after all steps are complete |
| `POST` | `/api/v1/work-orders/:id/steps/:stepExecutionId/start` | Technician | Start the current step |
| `POST` | `/api/v1/work-orders/:id/steps/:stepExecutionId/complete` | Technician | Complete a step and optionally persist notes |
| `PATCH` | `/api/v1/work-orders/:id/steps/:stepExecutionId` | Technician | Save notes for a step without completing it |

### Incidents

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/incidents` | Supervisor | List incidents, optionally filtered by status |
| `POST` | `/api/v1/incidents` | Technician | Create an incident tied to a work order and optional step |
| `GET` | `/api/v1/incidents/:id` | Supervisor | Load full incident detail including attachments |
| `PATCH` | `/api/v1/incidents/:id` | Supervisor | Update severity, status, summary, category, or details |

### Dashboard

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/dashboard/summary` | Supervisor | Return active, assigned, blocked, and incident counts |
| `GET` | `/api/v1/dashboard/activity` | Supervisor | Return recent activity log entries, default limit `10` |

### Uploads

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/uploads` | Authenticated | Upload one file and persist attachment metadata |

### Health

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Public | API health check |

## Example payloads

### Login request

```json
{
  "email": "technician@fieldassist.local",
  "password": "FieldAssist123!"
}
```

### Login response

```json
{
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-tech-demo",
      "email": "technician@fieldassist.local",
      "fullName": "Mara Ionescu",
      "role": "TECHNICIAN"
    }
  }
}
```

### Complete step request

`POST /api/v1/work-orders/work-order-pump-2403/steps/execution-pump-2/complete`

```json
{
  "notes": "Seal housing wear confirmed and escalated for supervisor follow-up."
}
```

### Create incident request

```json
{
  "workOrderId": "work-order-pump-2403",
  "stepExecutionId": "execution-pump-2",
  "severity": "HIGH",
  "category": "MECHANICAL",
  "summary": "Seal wear detected during inspection",
  "details": "Seal housing wear is visible and vibration remains above baseline."
}
```

### Dashboard summary response

```json
{
  "data": {
    "activeWorkOrders": 1,
    "assignedWorkOrders": 1,
    "blockedWorkOrders": 0,
    "openIncidents": 1,
    "techniciansActive": 1
  }
}
```

### Upload request

`POST /api/v1/uploads` expects `multipart/form-data` with:

- `file`: the uploaded file
- `workOrderId`: optional work order link
- `incidentReportId`: optional incident link

At least one of `workOrderId` or `incidentReportId` must be present.

## Status codes

- `200`: successful read or mutation
- `400`: validation failure or malformed upload payload
- `401`: missing or invalid authentication
- `403`: role or ownership restriction failed
- `404`: referenced work order, step, or incident was not found
- `409`: business rule conflict such as completing a work order before all steps are closed
- `500`: unexpected server error
