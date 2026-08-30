---
name: naming-conventions
description: Enforces the project's file, folder, class, method, and NestJS DTO naming conventions.
---

# Project Naming Conventions

These naming conventions are mandatory when creating, renaming, or restructuring files, folders, classes, methods, controllers, services, and DTOs.

Do not introduce a different naming convention unless explicitly requested.

---

## 1. General File Naming

All TypeScript file names MUST use kebab-case.

Examples:

- `auth.controller.ts`
- `auth.service.ts`
- `csrf.guard.ts`
- `jwt-auth.guard.ts`
- `public.decorator.ts`
- `otp.service.ts`

Incorrect:

- `AuthController.ts`
- `authController.ts`
- `auth_controller.ts`
- `JWTAuthGuard.ts`

---

## 2. General Folder Naming

Normal project folders MUST use kebab-case.

Examples:

```text
services/
guards/
strategies/
decorators/
```

---

## 3. DTO Placement (Mandatory)

DTOs belong INSIDE the module they serve, never in a shared/global DTO folder.

- Module DTO folder: `src/<module>/dtos/`

Every controller method MUST get its own subfolder, named exactly after the method (verbatim, camelCase):

```text
src/<module>/dtos/<methodName>/
```

Each method folder contains exactly TWO DTO files — one request, one response:

```text
src/auth/dtos/requestOtp/
  request-otp-request.dto.ts     # request body
  request-otp-response.dto.ts    # response body
```

### 3.1 File naming (kebab-case, per rule #1)

- Request:  `<method-kebab>-request.dto.ts`
- Response: `<method-kebab>-response.dto.ts`

### 3.2 Class naming (PascalCase)

- Request:  `<MethodPascal>RequestDto`
- Response: `<MethodPascal>ResponseDto`

### 3.3 Example — method `requestOtp`

```text
src/auth/dtos/requestOtp/request-otp-request.dto.ts
  export class RequestOtpRequestDto { phone!: string; }

src/auth/dtos/requestOtp/request-otp-response.dto.ts
  export class RequestOtpResponseDto { ttlSeconds!: number; }
```

Import in controller:

```ts
import type { RequestOtpRequestDto } from './dtos/requestOtp/request-otp-request.dto';
import { RequestOtpResponseDto } from './dtos/requestOtp/request-otp-response.dto';
```

Rules:

- One method folder per controller method. No combined/group DTO files.
- Request DTO = method input body. Response DTO = method return payload.
- If a method has no body or no return payload, still create the folder with the applicable DTO(s); do not skip the folder.
- Never reuse a method's DTO across different methods. Each method owns its two DTOs.