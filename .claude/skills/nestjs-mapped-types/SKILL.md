---
name: nestjs-mapped-types
description: Use NestJS mapped types (PartialType, PickType, OmitType, IntersectionType) to derive a DTO from an existing method DTO. Forbid plain class inheritance and shared/common DTO folders — repetition is preferred over indirection. Applies whenever authoring or refactoring NestJS DTOs.
---

# NestJS Mapped Types

These rules are mandatory whenever you create, modify, or refactor NestJS DTOs.

## 1. Derive only from an existing method DTO

Mapped types live in `@nestjs/swagger`:

- `PartialType(Base)` — all fields of `Base`, now optional.
- `PickType(Base, ['a', 'b'] as const)` — only those fields.
- `OmitType(Base, ['a'] as const)` — all fields except those.
- `IntersectionType(A, B)` — fields of `A` merged with `B`.

The base(s) MUST already exist as a method DTO in their own folder. Never create a new type just to feed a mapped type.

## 2. Update DTO = PartialType of Create DTO (canonical)

```ts
export class UpdatePermissionRequestDto extends PartialType(CreatePermissionRequestDto) {}
```

`CreatePermissionRequestDto` already lives in its own `createPermission/` folder. No shared folder needed.

## 3. Forbid bare inheritance between DTOs

NEVER plain-extend another DTO:

```ts
// FORBIDDEN
export class LoginResponseDto extends AuthUserDto {}
```

`extends` is allowed ONLY as part of a mapped type: `extends PartialType(...)`, `extends PickType(...)`, `extends OmitType(...)`, `extends IntersectionType(...)`.

## 4. No shared/common DTO folder

Do NOT create `common/`, `shared/`, or `entities/` DTO folders. Every DTO file is self-contained. Repeat fields across DTOs rather than extracting a shared base — duplication is preferred over indirection.

## 5. Nested objects: declare the nested shape inline

When a response nests another entity (e.g. `role.permissions`), declare the nested DTO class in the same file, even if that repeats it across several response files.

```ts
export class RolePermissionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'role:read' })
  name!: string;

  @ApiProperty({ example: 'List roles', nullable: true })
  description!: string | null;
}

export class CreateRoleResponseDto {
  // ...
  @ApiProperty({ type: RolePermissionDto, isArray: true })
  permissions!: RolePermissionDto[];
}
```

## 6. Only use a mapped type when its base already exists

If a `PickType`/`OmitType`/`IntersectionType` would require creating a new shared type, write the DTO explicitly instead. In practice this usually leaves `PartialType` (create→update) as the mapped type that earns its keep — its base is the Create DTO, which already exists.

## 7. Verify

Derived DTOs inherit `@ApiProperty` metadata so Swagger stays correct. `PartialType` marks inherited fields optional in class-validator and Swagger. Verify with `npx tsc --noEmit -p tsconfig.json` and `npm run build`.
