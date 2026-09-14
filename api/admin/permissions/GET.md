# GET /admin/permissions

**Operation ID:** AuthorizationController_listPermissions
**Tags:** Authorization
**Security:** access_token

> List all permissions


## Parameters

_None_

## Request Body

_None_

## Responses

### 200

**Description:** Permissions

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
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "example": 1
          },
          "name": {
            "type": "string",
            "example": "product:write"
          },
          "description": {
            "type": "object",
            "example": "Create and edit products",
            "nullable": true
          }
        },
        "required": [
          "id",
          "name",
          "description"
        ]
      }
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
