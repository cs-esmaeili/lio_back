# POST /files/upload

**Operation ID:** FileManagerController_uploadFiles
**Tags:** FileManager
**Security:** access_token

> Upload one or more files


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| header | X-CSRF-Token | yes | string | CSRF token from GET /auth/csrf — copy the csrfToken field into this header. |

## Request Body

**Content-Type:** `multipart/form-data`

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Target folder relative path (empty for root)",
      "example": "images"
    },
    "files": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "binary"
      }
    }
  }
}
```

## Responses

### 201

**Description:** Uploaded files

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
        "files": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "example": 1
              },
              "originalName": {
                "type": "string",
                "example": "photo.png"
              },
              "storedName": {
                "type": "string",
                "example": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-9f3a2b1c.png"
              },
              "path": {
                "type": "string",
                "example": "images/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-9f3a2b1c.png"
              },
              "url": {
                "type": "string",
                "example": "/uploads/images/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-9f3a2b1c.png"
              },
              "mimeType": {
                "type": "string",
                "example": "image/png"
              },
              "size": {
                "type": "number",
                "example": 2048
              },
              "uploaderId": {
                "type": "object",
                "example": 1,
                "nullable": true
              },
              "createdAt": {
                "type": "string",
                "example": "2026-09-02T12:00:00.000Z"
              }
            },
            "required": [
              "id",
              "originalName",
              "storedName",
              "path",
              "url",
              "mimeType",
              "size",
              "createdAt"
            ]
          }
        }
      },
      "required": [
        "files"
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
