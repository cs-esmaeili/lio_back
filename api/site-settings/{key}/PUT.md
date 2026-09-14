# PUT /site-settings/{key}

**Operation ID:** SiteSettingController_upsertByKey
**Tags:** SiteSetting
**Security:** access_token

> Create or update a site setting by key


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| path | key | yes | string |  |
| header | X-CSRF-Token | yes | string | CSRF token from GET /auth/csrf — copy the csrfToken field into this header. |

## Request Body

**Content-Type:** `application/json`

```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "additionalProperties": true,
      "example": {
        "menu": []
      }
    }
  },
  "required": [
    "data"
  ]
}
```

## Responses

### 200

**Description:** Upserted setting

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
        "key": {
          "type": "string",
          "example": "footer"
        },
        "data": {
          "type": "object",
          "additionalProperties": true,
          "example": {
            "menu": []
          }
        }
      },
      "required": [
        "key",
        "data"
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
