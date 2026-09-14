# POST /auth/logout

**Operation ID:** AuthController_logout
**Tags:** Auth
**Security:** access_token

> Revoke the current session and clear auth cookies


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| header | X-CSRF-Token | yes | string | CSRF token from GET /auth/csrf — copy the csrfToken field into this header. |

## Request Body

_None_

## Responses

### 200

**Description:** Logged out

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
        }
      },
      "required": [
        "ok"
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
