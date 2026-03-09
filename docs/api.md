# API

## Base URL

- Local API: `http://localhost:4000`
- Version prefix: `/api/v1`

## Auth routes

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Health route

- `GET /api/v1/health`

## Response shape

Successful responses currently use:

```json
{
  "data": {}
}
```

Error responses currently use:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Auth rules

- `POST /api/v1/auth/login` is public
- `POST /api/v1/auth/logout` requires `Authorization: Bearer <token>`
- `GET /api/v1/auth/me` requires `Authorization: Bearer <token>`

## Example login request

```json
{
  "email": "technician@fieldassist.local",
  "password": "FieldAssist123!"
}
```

## Example login response

```json
{
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "technician@fieldassist.local",
      "fullName": "Mara Ionescu",
      "role": "TECHNICIAN"
    }
  }
}
```
