# GET /admin/roles

**Operation ID:** AuthorizationController_listRoles
**Tags:** Authorization
**Security:** access_token

> List all roles with their permissions


## Parameters

_None_

## Request Body

_None_

## Responses

### 200

**Description:** Roles

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
            "example": "admin"
          },
          "description": {
            "type": "object",
            "example": "Full access",
            "nullable": true
          },
          "permissions": {
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
                  "example": "role:read"
                },
                "description": {
                  "type": "object",
                  "example": "List roles",
                  "nullable": true
                }
              },
              "required": [
                "id",
                "name",
                "description"
              ]
            }
          }
        },
        "required": [
          "id",
          "name",
          "description",
          "permissions"
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
