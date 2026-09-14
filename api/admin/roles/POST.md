# POST /admin/roles

**Operation ID:** AuthorizationController_createRole
**Tags:** Authorization
**Security:** access_token

> Create a role


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
    "name": {
      "type": "string",
      "description": "Unique role name",
      "example": "editor"
    },
    "description": {
      "type": "string",
      "description": "Role description",
      "example": "Can edit content"
    },
    "permissionIds": {
      "description": "Permission ids to attach",
      "example": [
        1,
        2
      ],
      "type": "array",
      "items": {
        "type": "number"
      }
    }
  },
  "required": [
    "name"
  ]
}
```

## Responses

### 201

**Description:** Created role

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "number",
      "example": 201
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
      "example": "Created"
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

**Description:** Invalid request data

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
