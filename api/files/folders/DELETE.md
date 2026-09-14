# DELETE /files/folders

**Operation ID:** FileManagerController_deleteFolder
**Tags:** FileManager
**Security:** access_token

> Delete a folder and its contents


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| query | path | yes | string | Relative folder path to delete |
| header | X-CSRF-Token | yes | string | CSRF token from GET /auth/csrf — copy the csrfToken field into this header. |

## Request Body

_None_

## Responses

### 200

**Description:** Folder deleted

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
