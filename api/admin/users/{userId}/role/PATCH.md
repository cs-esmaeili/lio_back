# PATCH /admin/users/{userId}/role

**Operation ID:** AuthorizationController_assignRole
**Tags:** Authorization
**Security:** access_token

> Assign or remove a role on a user


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| path | userId | yes | number |  |
| header | X-CSRF-Token | yes | string | CSRF token from GET /auth/csrf — copy the csrfToken field into this header. |

## Request Body

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "roleId": {
      "type": "object",
      "description": "Role id, or null to remove the role",
      "example": 1,
      "nullable": true
    }
  },
  "required": [
    "roleId"
  ]
}
```

## Responses

### 200

**Description:** Role assigned

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

### 403

**Description:** Missing permission

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "number",
      "example": 403
    },
    "message": {
      "type": "string",
      "example": "Forbidden"
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

### 404

**Description:** Role not found

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "number",
      "example": 404
    },
    "message": {
      "type": "string",
      "example": "Not Found"
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
