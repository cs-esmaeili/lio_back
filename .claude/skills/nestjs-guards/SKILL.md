---
name: nestjs-guards
description: Rules for placing NestJS guards on controller classes and mandating CSRF checks on every cookie-authenticated endpoint. Apply whenever authoring, editing, or reviewing controllers, guards, or access control.
---

# NestJS Guard Placement & CSRF Enforcement

These rules are mandatory for every controller in this project.

Guards are **not** registered globally (`APP_GUARD` is intentionally absent). Every guard is applied explicitly, so placement and coverage are the author's responsibility.

---

## 1. Guards Go On The Controller Class

Apply shared guards at the **class level**, not on each method.

If every method of a controller uses the same guards, declare them once above `@Controller(...)`.

Correct:

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/page-sections')
export class PageSectionController {
  @Post()
  createSection(...) {}

  @Get(':id')
  getSection(...) {}
}
```

Incorrect:

```ts
@Controller('admin/page-sections')
export class PageSectionController {
  @UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
  @Post()
  createSection(...) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
  @Get(':id')
  getSection(...) {}
}
```

Rules:

- Class-level guards apply to every route in the controller.
- Unlike pipes, method-level and class-level guards are **both** executed. Only add a guard on a method when that method needs an **extra** guard the class does not have.
- Keep the class-level guard order consistent: authentication first, then authorization, then CSRF (`JwtAuthGuard`, `PermissionsGuard`, `CsrfGuard`).

---

## 2. Permissions Are Declared Per Method

`@Permissions(...)` stays on the method, even when guards are class-level.

`PermissionsGuard` reads metadata with `getAllAndOverride([handler, class])`, so a method-level `@Permissions` overrides a class-level one. A class-level `@Permissions` is allowed only when **every** method requires the exact same permission.

Correct:

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin')
export class AuthorizationController {
  @Permissions('role:read')
  @Get('roles')
  listRoles() {}

  @Permissions('role:write')
  @Post('roles')
  createRole() {}
}
```

---

## 3. Public Methods Inside A Guarded Class

When a class-level `JwtAuthGuard` is present and a method must stay public, mark it `@Public()`.

- `JwtAuthGuard` honors `@Public()` and skips authentication.
- `PermissionsGuard` returns `true` when no permission metadata exists, so a public method with no `@Permissions` passes.
- `CsrfGuard` only enforces on unsafe methods (`POST`/`PUT`/`PATCH`/`DELETE`), so public `GET` routes pass automatically.

Correct:

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('site-settings')
export class SiteSettingController {
  @Public()
  @Get(':key')
  getByKey() {}

  @Permissions('site:manage')
  @Put(':key')
  upsertByKey() {}
}
```

---

## 4. CSRF Is Mandatory On Every Cookie-Authenticated Endpoint

This project authenticates with **cookies** (`access_token` / `refresh_token`). Any route that is protected by `JwtAuthGuard`, `OptionalAuthGuard`, or `LocalAuthGuard` and can change state MUST also be protected by `CsrfGuard`.

Whenever you add `JwtAuthGuard` or `PermissionsGuard` to a controller or route, add `CsrfGuard` in the same change.

Correct:

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('files')
export class FileManagerController {}
```

Incorrect (cookie-authenticated, state-changing, no CSRF):

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('files')
export class FileManagerController {}
```

Notes:

- `CsrfGuard` skips safe methods (`GET`, `HEAD`, `OPTIONS`), so it is safe to attach at the class level.
- `CsrfGuard` performs an Origin check and a double-submit cookie check (`X-CSRF-Token` header must match the `csrf_token` cookie).
Exceptions:

- Pure public controllers (e.g. `PageSectionPublicController`, `AppController`) that use no auth guard and no cookie-authenticated state change do not need CSRF.
- `POST /auth/dev/login` (`DevAuthGuard`) intentionally has no CSRF: it is a dev-only bootstrap endpoint whose contract is to establish a session and return a CSRF token in a single call. Requiring a pre-existing CSRF token would defeat that purpose. Do not flag it as a violation.
- `POST /auth/test/hash-password` is a pure public function with no cookies or session, so CSRF is irrelevant.

---

## 5. Decorator Ordering

Follow the ordering defined in `nestjs-api-contract` section 28:

1. Swagger/OpenAPI decorators (`@ApiOperation`, `@ApiBody`, `@Api*Response`, ...)
2. Access-control decorators (`@Public`, `@Permissions`)
3. Guards (`@UseGuards`) — class level when shared
4. HTTP method + path (`@Post(...)`, `@Get(...)`, ...)

At the class level, `@UseGuards(...)` sits directly above `@Controller(...)`.

---

## 6. Definition of Done

A controller change is not complete until:

```text
[ ] Shared guards are declared once on the controller class
[ ] Per-method @Permissions are present where permissions differ
[ ] Public methods inside a guarded class are marked @Public()
[ ] Every cookie-authenticated state-changing route has CsrfGuard
[ ] Decorator ordering follows nestjs-api-contract section 28
```
