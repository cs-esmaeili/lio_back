# GET /auth/csrf

**Operation ID:** AuthController_issueCsrf
**Tags:** Auth
**Security:** none

> Issue a CSRF token


## Parameters

_None_

## Request Body

_None_

## Responses

### 200

**Description:** CSRF token issued

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
        "ok": {
          "type": "boolean",
          "example": true
        },
        "csrfToken": {
          "type": "string",
          "example": "dGhpcyBpcyBhIGNzcmYgdG9rZW4",
          "description": "CSRF token to echo back in the X-CSRF-Token header."
        }
      },
      "required": [
        "ok",
        "csrfToken"
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
