# POST /auth/dev/login

**Operation ID:** AuthController_devLogin
**Tags:** Auth
**Security:** none

> Dev only: establish a session and return a CSRF token in one call (requires DEV_AUTH=true)


## Parameters

_None_

## Request Body

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "Phone number to log in as.",
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

**Description:** Session established and CSRF token issued

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
        "csrfToken": {
          "type": "string",
          "example": "dGhpcyBpcyBhIGNzcmYgdG9rZW4",
          "description": "CSRF token to echo back in the X-CSRF-Token header."
        },
        "user": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number",
              "example": 1
            },
            "username": {
              "type": "string",
              "example": "09123456789"
            },
            "name": {
              "type": "object",
              "example": "Dev",
              "nullable": true
            },
            "lastName": {
              "type": "object",
              "example": "User",
              "nullable": true
            }
          },
          "required": [
            "id",
            "username",
            "name",
            "lastName"
          ]
        }
      },
      "required": [
        "csrfToken",
        "user"
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
