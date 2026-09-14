# GET /auth/me

**Operation ID:** AuthController_me
**Tags:** Auth
**Security:** access_token

> Return the current authenticated user (or anonymous status)


## Parameters

_None_

## Request Body

_None_

## Responses

### 200

**Description:** Authentication status and user

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
        "authenticated": {
          "type": "boolean",
          "example": true
        },
        "user": {
          "nullable": true,
          "type": "object",
          "allOf": [
            {
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
                }
              },
              "required": [
                "id",
                "username"
              ]
            }
          ]
        },
        "loading": {
          "type": "boolean",
          "example": false
        }
      },
      "required": [
        "authenticated",
        "user",
        "loading"
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
