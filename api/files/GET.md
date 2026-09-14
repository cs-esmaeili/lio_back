# GET /files

**Operation ID:** FileManagerController_listFiles
**Tags:** FileManager
**Security:** access_token

> List files and folders in a directory


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| query | path | no | string | Relative folder path (empty for root) |

## Request Body

_None_

## Responses

### 200

**Description:** Directory entries

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
        "path": {
          "type": "string",
          "example": "images"
        },
        "entries": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "folder",
                  "file"
                ],
                "example": "file"
              },
              "name": {
                "type": "string",
                "example": "photo.png"
              },
              "path": {
                "type": "string",
                "example": "images/photo-abc123.png"
              },
              "id": {
                "type": "number",
                "example": 1
              },
              "size": {
                "type": "number",
                "example": 2048
              },
              "mimeType": {
                "type": "string",
                "example": "image/png"
              },
              "url": {
                "type": "string",
                "example": "/uploads/images/photo-abc123.png"
              },
              "createdAt": {
                "type": "string",
                "example": "2026-09-02T12:00:00.000Z"
              }
            },
            "required": [
              "type",
              "name",
              "path"
            ]
          }
        }
      },
      "required": [
        "path",
        "entries"
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

**Description:** Folder not found

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
