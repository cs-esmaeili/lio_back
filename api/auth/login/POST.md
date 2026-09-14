# POST /auth/login

**Operation ID:** AuthController_login
**Tags:** Auth
**Security:** none

> Login with username and password


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| header | X-CSRF-Token | yes | string | CSRF token from GET /auth/csrf — copy the csrfToken field into this header. |

## Request Body

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "Phone number in 09XXXXXXXXX format",
      "example": "09123456789"
    },
    "password": {
      "type": "string",
      "description": "Account password",
      "example": "secret-password"
    }
  },
  "required": [
    "username",
    "password"
  ]
}
```

## Responses

### 200

**Description:** Authenticated user

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "number",
      "example": 200
    },
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "example": 1
        },
        "username": {
          "type": "string",
          "example": "09123456789",
          "description": "Phone number (login identifier)"
        },
        "name": {
          "type": "object",
          "example": "Ali",
          "nullable": true
        },
        "lastName": {
          "type": "object",
          "example": "Rezaei",
          "nullable": true
        }
      },
      "required": [
        "id",
        "username",
        "name",
        "lastName"
      ]
    },
    "message": {
      "type": "string",
      "example": "OK"
    }
  },
  "required": [
    "statusCode",
    "data",
    "message"
  ]
}
```

### 401

**Description:** Invalid credentials or inactive account

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "number",
      "example": 401
    },
    "message": {
      "type": "string",
      "example": "Unauthorized"
    },
    "details": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": {
            "type": "string"
          },
          "message": {
            "type": "string"
          }
        }
      }
    }
  },
  "required": [
    "statusCode",
    "message"
  ]
}
```
