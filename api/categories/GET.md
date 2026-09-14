# GET /categories

**Operation ID:** CategoryPublicController_getCategories
**Tags:** CategoryPublic
**Security:** none

> Get all site categories as a nested tree


## Parameters

_None_

## Request Body

_None_

## Responses

### 200

**Description:** Nested category tree

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
        "categories": {
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
                "example": "پوشاک"
              },
              "imageUrl": {
                "type": "object",
                "example": "/uploads/images/category-1.png",
                "nullable": true
              },
              "children": {
                "type": "array",
                "items": {
                  "circular": "#/components/schemas/CategoryDto"
                }
              }
            },
            "required": [
              "id",
              "name",
              "imageUrl",
              "children"
            ]
          }
        }
      },
      "required": [
        "categories"
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
