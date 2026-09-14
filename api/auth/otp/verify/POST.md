# POST /auth/otp/verify

**Operation ID:** AuthController_verifyOtp
**Tags:** Auth
**Security:** none

> Verify OTP and establish a session


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
    "code": {
      "type": "string",
      "description": "Six-digit OTP code",
      "example": "123456"
    }
  },
  "required": [
    "username",
    "code"
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

### 400

**Description:** Invalid phone number

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "number",
      "example": 400
    },
    "message": {
      "type": "string",
      "example": "Bad Request"
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

### 401

**Description:** Invalid or expired OTP, or inactive account

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
