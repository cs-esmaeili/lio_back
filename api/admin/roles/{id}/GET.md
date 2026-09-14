# GET /admin/roles/{id}

**Operation ID:** AuthorizationController_getRole
**Tags:** Authorization
**Security:** access_token

> Get a single role by id


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| path | id | yes | number |  |

## Request Body

_None_

## Responses

### 200

**Description:** Role

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
