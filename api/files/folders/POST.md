# POST /files/folders

**Operation ID:** FileManagerController_createFolder
**Tags:** FileManager
**Security:** access_token

> Create a folder


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
    "path": {
      "type": "string",
      "description": "Relative folder path to create",
      "example": "images/banners"
    }
  },
  "required": [
    "path"
  ]
}
```

## Responses

### 201

**Description:** Folder created

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
        "ok": {
          "type": "boolean",
          "example": true
        },
        "path": {
          "type": "string",
          "example": "images/banners"
        }
      },
      "required": [
        "ok",
        "path"
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
