---
name: prisma-naming
description: >-
  Enforce production-grade Prisma and PostgreSQL naming conventions.
  Apply when creating, editing, reviewing, or refactoring Prisma schema
  models, fields, relations, indexes, constraints, or database mappings.
---

# Prisma & PostgreSQL Naming Conventions

Apply these conventions to all Prisma schema files.

The goal is to maintain a clean separation between Prisma/TypeScript naming and PostgreSQL naming.

Use Prisma `@map` and `@@map` to keep both layers idiomatic.

## Core Rules

### Prisma / TypeScript

* Models: `PascalCase`, singular
* Fields: `camelCase`
* Relation fields: `camelCase`
* Collection relation fields: plural `camelCase`
* Enums: `PascalCase`
* Enum values: `UPPER_SNAKE_CASE`

### PostgreSQL

* Tables: lowercase `snake_case`, normally plural
* Columns: lowercase `snake_case`
* Indexes: lowercase `snake_case`
* Constraints: lowercase `snake_case`

### Mapping

Use:

* `@map("column_name")` for PostgreSQL columns
* `@@map("table_name")` for PostgreSQL tables
* `map:` for explicitly named indexes and constraints

The Prisma Client API MUST remain idiomatic to TypeScript.

The PostgreSQL schema MUST remain idiomatic to PostgreSQL.

---

## Models

Every Prisma model MUST:

1. Use `PascalCase`.
2. Use a singular name.
3. Use `@@map`.
4. Map to a lowercase plural `snake_case` PostgreSQL table name.

### Correct

```prisma
model User {
  id String @id @default(uuid())

  @@map("users")
}

model ProductCategory {
  id String @id @default(uuid())

  @@map("product_categories")
}

model AuthSession {
  id String @id @default(uuid())

  @@map("auth_sessions")
}
```

### Incorrect

```prisma
model user {
  ...
}

model product_category {
  ...
}

model ProductCategories {
  ...
}
```

Do not use database naming conventions directly as Prisma model names.

---

## Fields

Prisma fields MUST use `camelCase`.

When the PostgreSQL column name uses `snake_case`, use `@map`.

### Correct

```prisma
model AuthSession {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  familyId  String?  @map("family_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  expiresAt DateTime @map("expires_at")

  @@map("auth_sessions")
}
```

Prisma Client:

```ts
session.userId
session.familyId
session.createdAt
session.updatedAt
session.expiresAt
```

PostgreSQL:

```text
user_id
family_id
created_at
updated_at
expires_at
```

Do NOT expose database `snake_case` names through Prisma Client.

### Incorrect

```prisma
model AuthSession {
  user_id    String
  created_at DateTime

  @@map("auth_sessions")
}
```

---

## Standard Fields

Use these Prisma names:

```text
id
createdAt
updatedAt
deletedAt
```

Map them to PostgreSQL:

```text
id
created_at
updated_at
deleted_at
```

Example:

```prisma
model User {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("users")
}
```

Do not unnecessarily map `id`.

Correct:

```prisma
id String @id @default(uuid())
```

Unnecessary:

```prisma
id String @id @default(uuid()) @map("id")
```

---

## Foreign Keys

Foreign key fields MUST use `camelCase` in Prisma and `snake_case` in PostgreSQL.

The Prisma field should normally follow:

```text
<relatedModelName>Id
```

Example:

```prisma
model Product {
  id         String          @id @default(uuid())
  categoryId String          @map("category_id")
  category   ProductCategory @relation(
    fields: [categoryId],
    references: [id]
  )

  @@map("products")
}
```

Prisma Client:

```ts
product.categoryId
```

PostgreSQL:

```text
category_id
```

Common examples:

```text
userId
productId
categoryId
orderId
sessionId
roleId
permissionId
```

Mapped PostgreSQL names:

```text
user_id
product_id
category_id
order_id
session_id
role_id
permission_id
```

---

## Relations

Relation fields MUST use `camelCase`.

### Singular Relations

Use singular names when the relation points to one record:

```prisma
category   ProductCategory
product    Product
user       User
session    AuthSession
role       Role
permission Permission
```

### Collection Relations

Use plural names when the relation returns multiple records:

```prisma
products Product[]
sessions AuthSession[]
orders   Order[]
users    User[]
roles    Role[]
```

Do NOT use `snake_case` for Prisma relation fields.

Incorrect:

```prisma
product_category ProductCategory
```

Correct:

```prisma
productCategory ProductCategory
```

---

## Tables

PostgreSQL table names MUST:

* be lowercase
* use `snake_case`
* normally be plural
* be explicitly mapped with `@@map`

### Correct

```text
users
products
product_categories
product_variants
auth_sessions
refresh_tokens
role_permissions
variant_attribute_values
```

### Incorrect

```text
User
ProductCategory
productCategory
product-category
ProductCategories
```

Example:

```prisma
model ProductVariant {
  id String @id @default(uuid())

  @@map("product_variants")
}
```

The Prisma model is:

```text
ProductVariant
```

The PostgreSQL table is:

```text
product_variants
```

---

## Columns

PostgreSQL column names MUST:

* be lowercase
* use `snake_case`
* avoid camelCase
* avoid PascalCase
* avoid kebab-case

### Correct

```text
user_id
product_id
category_id
created_at
updated_at
expires_at
refresh_token
is_active
```

### Incorrect

```text
userId
createdAt
UserID
user-id
```

Example:

```prisma
model User {
  id         String  @id @default(uuid())
  firstName  String  @map("first_name")
  lastName   String  @map("last_name")
  isActive   Boolean @map("is_active")

  @@map("users")
}
```

Prisma Client:

```ts
user.firstName
user.lastName
user.isActive
```

PostgreSQL:

```text
first_name
last_name
is_active
```

---

## Boolean Fields

Boolean Prisma fields SHOULD use descriptive `camelCase` names.

Preferred forms:

```text
isActive
isVerified
isPublished
isDeleted
hasPassword
hasAccess
canLogin
```

Map them to PostgreSQL `snake_case`:

```prisma
isActive    Boolean @map("is_active")
isVerified  Boolean @map("is_verified")
isPublished Boolean @map("is_published")
```

Avoid ambiguous names when the boolean meaning is unclear.

---

## Timestamp Fields

Timestamp fields SHOULD use clear semantic names.

Common names:

```text
createdAt
updatedAt
deletedAt
expiresAt
verifiedAt
publishedAt
revokedAt
lastLoginAt
```

Map them to PostgreSQL:

```text
created_at
updated_at
deleted_at
expires_at
verified_at
published_at
revoked_at
last_login_at
```

Example:

```prisma
model User {
  id          String    @id @default(uuid())
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  verifiedAt  DateTime? @map("verified_at")
  lastLoginAt DateTime? @map("last_login_at")

  @@map("users")
}
```

---

## Indexes

Index names SHOULD use lowercase `snake_case`.

When explicitly naming an index, use:

```text
<entity>_<columns>_idx
```

Examples:

```text
auth_sessions_user_id_idx
products_category_id_idx
product_variants_product_id_idx
users_email_idx
orders_user_id_idx
```

Example:

```prisma
@@index(
  [userId],
  map: "auth_sessions_user_id_idx"
)
```

Composite index:

```prisma
@@index(
  [userId, createdAt],
  map: "auth_sessions_user_id_created_at_idx"
)
```

Do not change index column order merely to make the name shorter.

Index column order is a database design decision and can affect query performance.

---

## Unique Constraints

Explicit unique constraint names SHOULD use lowercase `snake_case`.

Convention:

```text
<entity>_<columns>_key
```

Example:

```prisma
@@unique(
  [userId, familyId],
  map: "auth_sessions_user_id_family_id_key"
)
```

Other examples:

```text
users_email_key
users_username_key
products_sku_key
orders_order_number_key
```

---

## Primary Keys

Primary key fields SHOULD normally use:

```text
id
```

Example:

```prisma
model User {
  id String @id @default(uuid())

  @@map("users")
}
```

Do not use unnecessary variants such as:

```text
userId
user_id
UserID
```

for the primary key when the conventional `id` pattern is appropriate.

Foreign keys should use the related entity name:

```text
userId
productId
orderId
```

---

## File Naming

Prisma schema files MUST use lowercase `snake_case`.

### Correct

```text
prisma/
├── schema.prisma
└── models/
    ├── user.prisma
    ├── auth_session.prisma
    ├── product.prisma
    ├── product_category.prisma
    └── product_variant.prisma
```

### Incorrect

```text
Product.prisma
ProductCategory.prisma
productCategory.prisma
product-category.prisma
```

The file name does NOT determine:

* the Prisma model name
* the PostgreSQL table name
* the Prisma Client API

Example:

```text
product_category.prisma
```

can contain:

```prisma
model ProductCategory {
  id String @id @default(uuid())

  @@map("product_categories")
}
```

---

## Enums

Enums are Prisma/application-level types.

They are not PostgreSQL tables.

Use `PascalCase` for enum names.

Use `UPPER_SNAKE_CASE` for enum values.

Example:

```prisma
enum UserStatus {
  ACTIVE
  BANNED
  DISABLED
}
```

Another example:

```prisma
enum OrderStatus {
  PENDING
  PAID
  CANCELLED
  COMPLETED
}
```

Do not apply table naming rules to enum identifiers.

---

## Many-to-Many Relations

For many-to-many relations, follow the same naming rules.

Prisma models remain singular `PascalCase`.

PostgreSQL tables remain plural `snake_case`.

Example:

```prisma
model User {
  id    String @id @default(uuid())
  roles Role[]

  @@map("users")
}

model Role {
  id    String @id @default(uuid())
  users User[]

  @@map("roles")
}
```

For an explicit join model:

```prisma
model UserRole {
  userId String @map("user_id")
  roleId String @map("role_id")

  user User @relation(
    fields: [userId],
    references: [id]
  )

  role Role @relation(
    fields: [roleId],
    references: [id]
  )

  @@id([userId, roleId])
  @@map("user_roles")
}
```

The Prisma model is:

```text
UserRole
```

The PostgreSQL table is:

```text
user_roles
```

---

## Explicit Constraint Naming

When explicitly naming database constraints, use lowercase `snake_case`.

Preferred suffixes:

```text
_pk
_key
_fk
_check
```

Examples:

```text
users_pkey
users_email_key
orders_user_id_fkey
products_price_check
```

Do not manually name every constraint unless there is a reason to do so.

Explicit names are most useful when:

* migrations need stable names
* database administration requires predictable names
* constraints are referenced externally
* an existing database already has established names

---

## Existing Database

When working with an existing database, do NOT rename tables or columns solely to satisfy these conventions.

The existing database schema is the source of truth.

If the database uses different names:

1. Preserve the existing database names.
2. Use `@map` for columns.
3. Use `@@map` for tables.
4. Do not create unnecessary rename migrations.
5. Only rename database objects when explicitly required.

Example:

Existing PostgreSQL table:

```text
legacy_product_category
```

Use:

```prisma
model ProductCategory {
  id String @id

  @@map("legacy_product_category")
}
```

The application still gets:

```ts
prisma.productCategory.findMany()
```

while PostgreSQL continues using:

```text
legacy_product_category
```

---

## Migration Safety

Naming changes can result in database renames.

Before applying a naming change to an existing database:

1. Inspect the generated migration.
2. Verify whether Prisma generated a rename, drop, or recreate operation.
3. Determine whether the operation is safe for production.
4. Prefer an explicit safe rename migration when appropriate.
5. Verify that data is preserved.
6. Never silently drop production data because of a naming-only change.

A naming refactor MUST NOT become an accidental destructive migration.

---

## Naming Consistency

When introducing a new model, inspect nearby models first.

Do not introduce inconsistent naming within the same domain.

Avoid:

```text
createdAt
created_at
createdDate
creationDate
```

Prefer:

```text
createdAt
updatedAt
deletedAt
```

mapped to:

```text
created_at
updated_at
deleted_at
```

---

## Do Not Overuse `@map`

Use `@map` when the database representation differs from the Prisma representation.

Do not add redundant mappings.

Correct:

```prisma
id String @id @default(uuid())

createdAt DateTime @default(now()) @map("created_at")
```

Unnecessary:

```prisma
id String @id @default(uuid()) @map("id")
```

The goal is not to maximize the number of `@map` declarations.

The goal is to maintain a clean separation between application and database naming.

---

## Do Not Rename Existing Database Objects Without Reason

If an existing database already follows a different naming convention, do not perform a naming migration merely for stylistic consistency.

For example, if the database already contains:

```text
customer_accounts
```

do not rename it to:

```text
customers
```

unless the rename is an intentional database change.

Instead:

```prisma
model CustomerAccount {
  id String @id @default(uuid())

  @@map("customer_accounts")
}
```

---

## Complete Example

```prisma
model ProductVariant {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  sku       String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product Product @relation(
    fields: [productId],
    references: [id],
    onDelete: Cascade
  )

  @@index(
    [productId],
    map: "product_variants_product_id_idx"
  )

  @@unique(
    [sku],
    map: "product_variants_sku_key"
  )

  @@map("product_variants")
}
```

Result:

```text
Prisma                    PostgreSQL

ProductVariant      →    product_variants
productId           →    product_id
createdAt           →    created_at
updatedAt           →    updated_at
```

Prisma Client remains idiomatic:

```ts
prisma.productVariant.findMany()

variant.productId
variant.createdAt
variant.product
```

---

## Review Checklist

### Models

* [ ] Model names use `PascalCase`.
* [ ] Model names are singular.
* [ ] Models use `@@map`.
* [ ] PostgreSQL table names are lowercase `snake_case`.
* [ ] PostgreSQL table names are normally plural.

### Fields

* [ ] Prisma fields use `camelCase`.
* [ ] PostgreSQL columns use `snake_case`.
* [ ] Fields use `@map` when required.
* [ ] `id` is not unnecessarily mapped.
* [ ] Standard timestamp fields follow the project convention.

### Foreign Keys

* [ ] Foreign keys use `<entity>Id`.
* [ ] Prisma foreign keys use `camelCase`.
* [ ] PostgreSQL foreign keys use `snake_case`.
* [ ] Foreign keys use `@map` when required.

### Relations

* [ ] Singular relations use singular `camelCase`.
* [ ] Collection relations use plural `camelCase`.
* [ ] Relation fields never use `snake_case`.

### Indexes

* [ ] Explicit index names use lowercase `snake_case`.
* [ ] Index names follow `<entity>_<columns>_idx`.
* [ ] Composite index column order is preserved.

### Constraints

* [ ] Explicit unique constraint names use lowercase `snake_case`.
* [ ] Constraint names are stable and descriptive.
* [ ] Constraint naming does not unnecessarily create migration churn.

### Files

* [ ] Prisma schema files use lowercase `snake_case`.
* [ ] File names do not dictate model or table names.

### Existing Databases

* [ ] Existing database names are preserved unless a rename is intentional.
* [ ] `@map` and `@@map` are used to adapt legacy names.
* [ ] Generated migrations are inspected before applying naming changes.
* [ ] Naming changes never silently cause destructive data loss.

---

## Final Convention

```text
Prisma Model        → PascalCase, singular
Prisma Field        → camelCase
Prisma Relation     → camelCase
Prisma Enum         → PascalCase
Prisma Enum Value   → UPPER_SNAKE_CASE

Database Table      → plural snake_case
Database Column     → snake_case
Database Index      → snake_case
Database Constraint → snake_case

Schema File         → snake_case
```

The application layer MUST remain idiomatic to Prisma and TypeScript.

The database layer MUST remain idiomatic to PostgreSQL.

Use:

```text
@map("column_name")
```

for PostgreSQL column names.

Use:

```text
@@map("table_name")
```

for PostgreSQL table names.

Never sacrifice application-layer ergonomics merely to mirror database naming.

Never rename existing production database objects merely to satisfy naming preferences without an explicit migration requirement.
