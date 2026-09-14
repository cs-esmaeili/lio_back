# GET /site-settings/{key}

**Operation ID:** SiteSettingController_getByKey
**Tags:** SiteSetting
**Security:** none

> Get a site setting by key (e.g. header, footer)


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| path | key | yes | string |  |

## Request Body

_None_

## Responses

### 200

**Description:** Setting payload

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
          "example": "header"
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

### 404

**Description:** Setting not found

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
