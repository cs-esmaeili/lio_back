# NestJS API Contract & Swagger Skill

## Purpose

You are working on a production-grade NestJS backend.

**Every HTTP route is an API contract.**

Whenever you create, modify, or remove a route, you MUST keep its Swagger/OpenAPI contract synchronized with the actual implementation.

Swagger documentation is NOT optional, cosmetic, or a final cleanup step.

The frontend must be able to understand the API contract from Swagger alone:

* What must be sent
* What may be sent
* What must NOT be sent
* What will be returned
* Which response fields are required
* Which response fields are optional
* The exact type of every field
* Validation constraints
* Authentication requirements
* Possible HTTP status codes
* Error response structures

---

# 1. Mandatory Rule

**NEVER create or modify a route without creating or updating its Swagger contract in the same change.**

For every route, verify all of the following:

1. Request schema exists.
2. Response schema exists.
3. Required request fields are explicitly represented.
4. Optional request fields are explicitly represented.
5. Required response fields are explicitly represented.
6. Optional response fields are explicitly represented.
7. Field types are correct.
8. Validation constraints are reflected where appropriate.
9. HTTP status codes are documented.
10. Authentication/authorization requirements are documented.
11. Error responses are documented when relevant.
12. DTOs used by the route are Swagger-compatible.
13. The Swagger contract matches the actual runtime behavior.

If any of these are missing, the route is considered **incomplete**.

---

# 2. Request Schema Is Mandatory

Every route that accepts input MUST expose an explicit Swagger request schema.

Do NOT rely on undocumented implicit behavior.

For body input, use DTOs.

Example:

```ts
export class CreateUserDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+989121234567',
    required: true,
  })
  @IsPhoneNumber('IR')
  phone: string;

  @ApiProperty({
    description: 'User display name',
    example: 'Javad',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
```

The controller must expose this DTO:

```ts
@Post()
@ApiBody({
  type: CreateUserDto,
})
createUser(@Body() dto: CreateUserDto) {
  // ...
}
```

---

# 3. Required vs Optional Fields

This distinction is critical.

Swagger MUST accurately communicate whether a field is required.

### Required

Use:

```ts
@ApiProperty({
  required: true,
})
```

and the TypeScript/validation model must agree.

### Optional

Use:

```ts
@ApiPropertyOptional({
  required: false,
})
```

and:

```ts
email?: string;
```

with appropriate validation such as:

```ts
@IsOptional()
```

Do NOT mark a field as optional in Swagger if the backend rejects requests without it.

Do NOT mark a field as required if the backend accepts it as optional.

The implementation, validation, TypeScript type, and Swagger schema must agree.

---

# 4. Response Schema Is Mandatory

Every successful response MUST have an explicit response schema.

This is mandatory even for simple responses.

BAD:

```ts
@ApiResponse({
  status: 200,
  description: 'Success',
})
```

This does NOT define what the frontend receives.

GOOD:

```ts
@ApiOkResponse({
  description: 'User information',
  type: UserResponseDto,
})
```

With:

```ts
export class UserResponseDto {
  @ApiProperty({
    example: 'cm123abc',
  })
  id: string;

  @ApiProperty({
    example: 'Javad',
  })
  name: string;

  @ApiProperty({
    example: '+989121234567',
  })
  phone: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    nullable: true,
  })
  email?: string | null;
}
```

The frontend should be able to determine the response structure without reading backend source code.

---

# 5. Never Use `any` in API Contracts

Do NOT expose:

```ts
@ApiProperty()
data: any;
```

Do NOT expose:

```ts
@ApiResponse({
  schema: {
    type: 'object',
  },
})
```

when the actual response has a known structure.

If the response has a structure, create a DTO.

BAD:

```ts
data: any;
```

GOOD:

```ts
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
```

---

# 6. Arrays Must Have Item Schemas

If the API returns an array, Swagger MUST know the type of each item.

BAD:

```ts
@ApiOkResponse({
  schema: {
    type: 'array',
  },
})
```

GOOD:

```ts
@ApiOkResponse({
  type: UserResponseDto,
  isArray: true,
})
```

or:

```ts
@ApiProperty({
  type: () => [UserResponseDto],
})
users: UserResponseDto[];
```

The generated OpenAPI schema must clearly indicate:

```text
array<UserResponseDto>
```

---

# 7. Nested Objects Must Have Schemas

Do not hide nested API structures inside generic objects.

BAD:

```ts
@ApiProperty({
  type: Object,
})
profile: object;
```

GOOD:

```ts
export class AddressResponseDto {
  @ApiProperty()
  city: string;

  @ApiProperty()
  postalCode: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    type: () => AddressResponseDto,
  })
  address: AddressResponseDto;
}
```

---

# 8. Query Parameters Must Be Documented

Every query parameter must be represented in Swagger.

Example:

```ts
@Get()
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  example: 20,
})
findUsers(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  // ...
}
```

Prefer DTO-based query contracts when multiple query parameters exist.

Example:

```ts
export class UserListQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
```

Then:

```ts
@Get()
findUsers(@Query() query: UserListQueryDto) {
  // ...
}
```

Swagger must expose the DTO fields.

---

# 9. Path Parameters Must Be Documented

Every `@Param()` used by a route must have Swagger documentation.

Example:

```ts
@Get(':id')
@ApiParam({
  name: 'id',
  type: String,
  example: 'cm123abc',
  description: 'User ID',
})
@ApiOkResponse({
  type: UserResponseDto,
})
findOne(@Param('id') id: string) {
  // ...
}
```

Do not leave path parameters undocumented.

---

# 10. Headers Must Be Documented

If a route requires a custom header, document it.

Example:

```ts
@ApiHeader({
  name: 'X-Request-ID',
  required: true,
  example: 'req_123456',
})
```

Do not require undocumented headers.

---

# 11. Authentication Must Be Documented

Protected routes MUST declare their authentication requirement.

For bearer authentication:

```ts
@ApiBearerAuth()
```

For cookie authentication:

```ts
@ApiCookieAuth('access_token')
```

The Swagger contract must make it obvious whether authentication is required.

If a route is public, do not falsely document authentication.

---

# 12. HTTP Status Codes

Document the successful response status code explicitly.

Examples:

```ts
@ApiOkResponse({
  type: UserResponseDto,
})
```

```ts
@ApiCreatedResponse({
  type: UserResponseDto,
})
```

```ts
@ApiNoContentResponse()
```

The documented status must match the actual controller behavior.

---

# 13. Error Responses

Important expected errors should be documented.

Example:

```ts
@ApiBadRequestResponse({
  description: 'Invalid request data',
  type: ErrorResponseDto,
})
@ApiUnauthorizedResponse({
  description: 'Authentication required',
  type: ErrorResponseDto,
})
@ApiNotFoundResponse({
  description: 'User not found',
  type: ErrorResponseDto,
})
```

If the project has a standardized error response, ALWAYS use that DTO.

Example:

```ts
export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    example: 'Validation failed',
  })
  message: string;

  @ApiPropertyOptional({
    example: 'VALIDATION_ERROR',
  })
  code?: string;
}
```

Do not invent a different error structure for individual endpoints when the project already has a global error contract.

---

# 14. DTOs Are the Source of Truth

For request and response contracts, prefer explicit DTO classes.

Recommended separation:

```text
dto/
├── create-user.dto.ts
├── update-user.dto.ts
├── user-response.dto.ts
├── user-list-query.dto.ts
└── user-list-response.dto.ts
```

Do not reuse a request DTO as a response DTO merely for convenience if their contracts differ.

For example:

```text
CreateUserDto
UserResponseDto
```

should normally be separate concepts.

---

# 15. Do Not Expose Internal Models

Never expose Prisma/database entities directly as API contracts unless that is an intentional architectural decision.

BAD:

```ts
@ApiOkResponse({
  type: User,
})
```

where `User` is a Prisma/database model.

GOOD:

```ts
@ApiOkResponse({
  type: UserResponseDto,
})
```

API contracts should represent the public API, not the database schema.

This prevents accidental exposure of fields such as:

```text
passwordHash
otpHash
refreshTokenHash
internal flags
database metadata
```

---

# 16. Enums Must Be Documented

For enum fields, expose the enum values.

Example:

```ts
export enum OtpPurpose {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
}
```

Then:

```ts
@ApiProperty({
  enum: OtpPurpose,
  example: OtpPurpose.LOGIN,
})
purpose: OtpPurpose;
```

The generated OpenAPI specification must expose the allowed values.

---

# 17. Constraints Must Be Reflected

If validation imposes constraints, Swagger should expose them whenever OpenAPI supports them.

Example:

```ts
@ApiProperty({
  minLength: 8,
  maxLength: 64,
})
@MinLength(8)
@MaxLength(64)
password: string;
```

For numbers:

```ts
@ApiProperty({
  minimum: 1,
  maximum: 100,
})
@Min(1)
@Max(100)
limit: number;
```

For strings:

```ts
@ApiProperty({
  minLength: 3,
  maxLength: 50,
})
```

The frontend should be able to understand important input constraints from Swagger.

---

# 18. Nullable Is Not Optional

These are different concepts.

Optional:

```ts
email?: string;
```

means the property may be omitted.

Nullable:

```ts
email: string | null;
```

means the property exists but may contain `null`.

If both are possible:

```ts
email?: string | null;
```

Swagger must communicate both semantics.

Do NOT confuse:

```text
required: false
```

with:

```text
nullable: true
```

---

# 19. Boolean, Number, Date and UUID Types

Never rely on TypeScript inference when it can produce an ambiguous OpenAPI schema.

Explicitly document important types.

Example:

```ts
@ApiProperty({
  type: Boolean,
  example: true,
})
isActive: boolean;
```

```ts
@ApiProperty({
  type: Number,
  example: 150000,
})
price: number;
```

For dates:

```ts
@ApiProperty({
  type: String,
  format: 'date-time',
  example: '2026-08-30T12:00:00.000Z',
})
createdAt: Date;
```

For UUID:

```ts
@ApiProperty({
  format: 'uuid',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
id: string;
```

---

# 20. Pagination Contracts

If an endpoint is paginated, Swagger must document both the data and pagination metadata.

Example:

```ts
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
```

Response:

```ts
export class UserListResponseDto {
  @ApiProperty({
    type: () => [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
```

---

# 21. Controller Example

A complete route should look conceptually like this:

```ts
@Post()
@ApiOperation({
  summary: 'Create a user',
})
@ApiBody({
  type: CreateUserDto,
})
@ApiCreatedResponse({
  description: 'User created successfully',
  type: UserResponseDto,
})
@ApiBadRequestResponse({
  description: 'Invalid request',
  type: ErrorResponseDto,
})
@ApiUnauthorizedResponse({
  description: 'Authentication required',
  type: ErrorResponseDto,
})
create(
  @Body() dto: CreateUserDto,
): Promise<UserResponseDto> {
  return this.usersService.create(dto);
}
```

This is the minimum quality level expected for a production API.

---

# 22. Before Creating a Route

Before writing a route, determine:

```text
HTTP Method
Path
Authentication
Path Parameters
Query Parameters
Headers
Request Body
Request DTO
Response DTO
Success Status
Error Responses
```

Then implement both:

```text
Implementation
+
Swagger Contract
```

in the same change.

---

# 23. Definition of Done

A route is NOT finished until this checklist passes:

```text
[ ] HTTP method documented
[ ] Path documented
[ ] Authentication documented
[ ] Path parameters documented
[ ] Query parameters documented
[ ] Required headers documented
[ ] Request body schema exists
[ ] Required request fields are correct
[ ] Optional request fields are correct
[ ] Request field types are correct
[ ] Request validation constraints are represented
[ ] Success response schema exists
[ ] Required response fields are correct
[ ] Optional response fields are correct
[ ] Nullable response fields are correct
[ ] Response field types are correct
[ ] Nested objects have schemas
[ ] Arrays have item schemas
[ ] Enums are documented
[ ] Important error responses are documented
[ ] Error response schema is defined
[ ] Database/internal fields are not accidentally exposed
[ ] Swagger matches actual runtime behavior
```

If any applicable item is missing, **do not consider the route complete.**

---

# 24. Mandatory Self-Review

After implementing or modifying an endpoint, perform a Swagger contract audit.

Ask yourself:

> "Could a frontend developer implement this endpoint correctly using ONLY the generated Swagger/OpenAPI specification, without reading the backend source code?"

If the answer is **NO**, the implementation is incomplete.

Specifically verify:

```text
What exactly must the frontend send?
What exactly may the frontend omit?
What exact type does every field have?
Which fields may be null?
What exact object does the frontend receive?
Which response fields are guaranteed?
Which fields are optional?
What are the possible success statuses?
What are the expected error responses?
Does authentication require a token/cookie/header?
```

---

# 25. No Fake Swagger

Never add Swagger decorators merely to satisfy the appearance of documentation.

BAD:

```ts
@ApiResponse({
  status: 200,
  description: 'Success',
})
```

when the actual response schema is unknown.

BAD:

```ts
@ApiProperty()
data: object;
```

when the structure is known.

BAD:

```ts
@ApiProperty()
value: any;
```

BAD:

```ts
@ApiOkResponse()
```

without a response type when the endpoint returns structured data.

Swagger must describe the **actual API contract**, not merely prove that Swagger decorators exist.

---

# 26. Change Synchronization Rule

Whenever any of these change:

```text
DTO
validation
controller input
service output
response structure
field names
field types
required/optional state
nullable state
authentication
status code
error behavior
```

the Swagger contract MUST be reviewed and updated in the same change.

Never leave Swagger stale.

---

# 27. Final Rule

**API implementation and Swagger documentation are one unit of work.**

Never produce:

```text
Route now
Swagger later
```

Always produce:

```text
Route
+
Request Schema
+
Response Schema
+
Error Schemas
+
Authentication Documentation
+
Parameter Documentation
```

A route without an accurate Swagger request/response contract is an **incomplete implementation**.
