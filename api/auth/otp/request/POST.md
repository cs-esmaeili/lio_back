# POST /auth/otp/request

**Operation ID:** AuthController_requestOtp
**Tags:** Auth
**Security:** none

> Request an OTP for login


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
    }
  },
  "required": [
    "username"
  ]
}
```

## Responses

### 200

**Description:** OTP sent

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
        "ttlSeconds": {
          "type": "number",
          "example": 120,
          "description": "OTP validity window in seconds."
        }
      },
      "required": [
        "ttlSeconds"
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
