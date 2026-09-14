# GET /admin/page-sections/{id}

**Operation ID:** PageSectionController_getSection
**Tags:** PageSection
**Security:** access_token

> Get a page section with its typed data


## Parameters

| In | Name | Required | Type | Description |
| --- | --- | --- | --- | --- |
| path | id | yes | number |  |

## Request Body

_None_

## Responses

### 200

**Description:** Page section

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
          "example": 50
        },
        "pageId": {
          "type": "number",
          "example": 1
        },
        "type": {
          "example": "SLIDER",
          "allOf": [
            {
              "type": "string",
              "enum": [
                "SLIDER",
                "PRODUCT_LIST",
                "BANNER",
                "INTRODUCTION"
              ]
            }
          ]
        },
        "location": {
          "example": "SLIDER",
          "allOf": [
            {
              "type": "string",
              "enum": [
                "SLIDER",
                "PRODUCT_LIST",
                "AMAZING_PRODUCTS",
                "BANNER",
                "BANNER_3",
                "BANNER_4",
                "INTRODUCTION"
              ],
              "description": "Render location; defaults to the section type when omitted"
            }
          ]
        },
        "title": {
          "type": "object",
          "example": "محصولات شگفت‌انگیز",
          "nullable": true
        },
        "link": {
          "type": "object",
          "example": "/products/sale",
          "nullable": true
        },
        "sortOrder": {
          "type": "number",
          "example": 1
        },
        "status": {
          "example": "ACTIVE",
          "allOf": [
            {
              "type": "string",
              "enum": [
                "ACTIVE",
                "INACTIVE"
              ]
            }
          ]
        },
        "data": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "slides": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "number",
                        "example": 11
                      },
                      "desktopFileUrl": {
                        "type": "object",
                        "example": null,
                        "nullable": true
                      },
                      "tabletFileUrl": {
                        "type": "object",
                        "example": null,
                        "nullable": true
                      },
                      "mobileFileUrl": {
                        "type": "object",
                        "example": null,
                        "nullable": true
                      },
                      "url": {
                        "type": "object",
                        "example": null,
                        "nullable": true
                      }
                    },
                    "required": [
                      "id",
                      "desktopFileUrl",
                      "tabletFileUrl",
                      "mobileFileUrl",
                      "url"
                    ]
                  }
                }
              },
              "required": [
                "slides"
              ]
            },
            {
              "type": "object",
              "properties": {
                "products": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "number",
                        "example": 11
                      },
                      "sortOrder": {
                        "type": "number",
                        "example": 0
                      },
                      "productId": {
                        "type": "number",
                        "example": 42
                      },
                      "productName": {
                        "type": "string",
                        "example": "Product name"
                      },
                      "productSlug": {
                        "type": "string",
                        "example": "product-name"
                      },
                      "images": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "number",
                              "example": 7
                            },
                            "url": {
                              "type": "object",
                              "example": "/uploads/images/product-1.png",
                              "nullable": true
                            },
                            "isPrimary": {
                              "type": "boolean",
                              "example": true
                            },
                            "isThumbnail": {
                              "type": "boolean",
                              "example": false
                            },
                            "sortOrder": {
                              "type": "number",
                              "example": 0
                            }
                          },
                          "required": [
                            "id",
                            "url",
                            "isPrimary",
                            "isThumbnail",
                            "sortOrder"
                          ]
                        }
                      }
                    },
                    "required": [
                      "id",
                      "sortOrder",
                      "productId",
                      "productName",
                      "productSlug",
                      "images"
                    ]
                  }
                }
              },
              "required": [
                "products"
              ]
            },
            {
              "type": "object",
              "properties": {
                "banners": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "number",
                        "example": 11
                      },
                      "sortOrder": {
                        "type": "number",
                        "example": 0
                      },
                      "title": {
                        "type": "string",
                        "example": "Summer sale"
                      },
                      "subtitle": {
                        "type": "object",
                        "example": "Up to 50% off selected items",
                        "nullable": true
                      },
                      "buttonTitle": {
                        "type": "object",
                        "example": "Shop now",
                        "nullable": true
                      },
                      "buttonUrl": {
                        "type": "object",
                        "example": "/products/sale",
                        "nullable": true
                      },
                      "desktopFileUrl": {
                        "type": "object",
                        "example": "/uploads/images/banner-desktop.png",
                        "nullable": true
                      },
                      "tabletFileUrl": {
                        "type": "object",
                        "example": "/uploads/images/banner-tablet.png",
                        "nullable": true
                      },
                      "mobileFileUrl": {
                        "type": "object",
                        "example": "/uploads/images/banner-mobile.png",
                        "nullable": true
                      }
                    },
                    "required": [
                      "id",
                      "sortOrder",
                      "title",
                      "subtitle",
                      "buttonTitle",
                      "buttonUrl",
                      "desktopFileUrl",
                      "tabletFileUrl",
                      "mobileFileUrl"
                    ]
                  }
                }
              },
              "required": [
                "banners"
              ]
            },
            {
              "type": "object",
              "properties": {
                "titles": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "string"
                  },
                  "example": {
                    "title": "عنوان اصلی",
                    "subtitle": "توضیح کوتاه"
                  }
                },
                "desktopFileUrl": {
                  "type": "object",
                  "example": "/uploads/images/intro-desktop.png",
                  "nullable": true
                },
                "tabletFileUrl": {
                  "type": "object",
                  "example": "/uploads/images/intro-tablet.png",
                  "nullable": true
                },
                "mobileFileUrl": {
                  "type": "object",
                  "example": "/uploads/images/intro-mobile.png",
                  "nullable": true
                }
              },
              "required": [
                "titles",
                "desktopFileUrl",
                "tabletFileUrl",
                "mobileFileUrl"
              ]
            }
          ]
        }
      },
      "required": [
        "id",
        "pageId",
        "type",
        "location",
        "title",
        "link",
        "sortOrder",
        "status",
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

### 404

**Description:** Section not found

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
