# POST /auth/test/hash-password

**Operation ID:** AuthController_hashPassword
**Tags:** Auth
**Security:** none

> Hash a plain password (test/dev only)


## Parameters

_None_

## Request Body

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "password": {
      "type": "string",
      "description": "Plain password to hash",
      "example": "secret-password"
    }
  },
  "required": [
    "password"
  ]
}
```

## Responses

### 200

**Description:** Hashed password

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
        "hash": {
          "type": "string",
          "description": "Argon2id hash of the password",
          "example": "$argon2id$v=19$m=19456,t=2,p=1$..."
        }
      },
      "required": [
        "hash"
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
