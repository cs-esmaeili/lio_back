# POST /admin/permissions

**Operation ID:** AuthorizationController_createPermission
**Tags:** Authorization
**Security:** access_token

> Create a permission


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
      "description": "Unique permission key",
      "example": "product:write"
    },
    "description": {
      "type": "string",
      "description": "Permission description",
      "example": "Create and edit products"
    }
  },
  "required": [
    "name"
  ]
}
```

## Responses

### 201

**Description:** Created permission

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
