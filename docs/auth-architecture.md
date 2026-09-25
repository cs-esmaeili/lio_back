# راهنمای جامع احراز هویت (Auth) — نشست کوکی‌محور

این سند معماری احراز هویت این پروژه را توضیح می‌دهد: **چه چیزی وجود دارد، چرا، چه کسی چه چیزی را صدا می‌زند، و کجاها ممکن است دردسر ایجاد شود.**

> نسخه‌ی قبلی این سند بر پایه‌ی **JWT (access + refresh + rotation)** بود. اکنون به **نشست سرور-محور روی کوکی HttpOnly** مهاجرت کرده‌ایم. برای چرایی این تصمیم (و مقایسه با Passport/Sanctum) به سند `auth-passport-vs-sanctum.md` مراجعه کن.

---

## ۰. نقشه‌ی ذهنی در یک نگاه

| موضوع | چطور |
|---|---|
| **حامل اعتبار (transport)** | کوکی `session` (HttpOnly) برای وب؛ `Authorization: Bearer` برای موبایل |
| **حقیقت اصلی** | جدول `auth_sessions` در دیتابیس (توکن فقط **هش** می‌شود) |
| **تمدید** | sliding ۳۰ روزه (با استفاده) + سقف مطلق ۹۰ روزه |
| **محافظت درخواست** | CSRF double-submit + Origin (فقط برای کوکی) |
| **مجوزدهی** | RBAC با `PermissionsGuard` (بدون تغییر) |
| **JWT / refresh** | حذف شدند |

---

## ۱. اجزا و فایل‌ها

| فایل | نقش |
|---|---|
| `auth/auth.controller.ts` | همه‌ی endpointهای `/auth/*` |
| `auth/services/session.service.ts` | هسته‌ی نشست: ساخت، resolve/sliding، revoke |
| `auth/services/token.service.ts` | ساخت توکن نشست تصادفی + هش SHA-256 |
| `auth/services/cookie.service.ts` | ست/پاک‌کردن کوکی `session` |
| `auth/services/csrf.service.ts` | ساخت و اعتبارسنجی CSRF |
| `auth/services/otp.service.ts` | OTP |
| `auth/services/password.service.ts` | هش/تأیید رمز (Argon2) |
| `auth/guards/session-auth.guard.ts` | الزام نشست (با احترام به `@Public`) |
| `auth/guards/optional-session-auth.guard.ts` | نشست اختیاری |
| `auth/guards/csrf.guard.ts` | اعمال CSRF روی متدهای تغییردهنده |
| `auth/guards/local-auth.guard.ts` | ورود با رمز |
| `auth/utils/extract-session-credential.ts` | استخراج توکن از کوکی یا Bearer |
| `authorization/guards/permissions.guard.ts` | بررسی دسترسی نقش‌محور |
| `database/schema/auth-session.ts` | جدول `auth_sessions` |

---

## ۲. کوکی‌ها

| کوکی | HttpOnly | عمر | نقش |
|---|---|---|---|
| `session` | ✅ | ۳۰ روز (sliding) | احراز هویت |
| `csrf_token` | ❌ | ۸ ساعت | محافظت CSRF (double-submit) |

- در production با `COOKIE_SECURE=true` و بدون domain، نام به `__Host-session` تغییر می‌کند.
- همه‌ی کوکی‌ها `Path=/` و `SameSite` از config.

---

## ۳. مدل داده: `auth_sessions`

```
id            text pk (uuidv7)
user_id       int  -> users.id (cascade)
token_hash    text unique         ← sha256 توکن خام (توکن خام هرگز ذخیره نمی‌شود)
expires_at    timestamptz         ← انقضای sliding
revoked_at    timestamptz null    ← logout/بن/تغییر رمز
last_used_at  timestamptz null
ip            text null
user_agent    text null
created_at    timestamptz         ← مبنای سقف مطلق
```

**چرخه‌ی نشست:**

1. **ورود:** توکن ۳۲ بایتی تصادفی ساخته می‌شود؛ فقط `sha256` آن در DB ذخیره و توکن خام در کوکی می‌رود.
2. **هر درخواست:** `sha256` توکن → lookup → چک `revoked_at`/`expires_at`/سقف مطلق → بارگذاری کاربر.
3. **sliding:** اگر از نیمه‌ی عمر گذشته باشد، `expires_at = now + 30d` و کوکی دوباره ست می‌شود (حداکثر یک نوشتن در هر نیمه‌عمر).
4. **سقف مطلق:** اگر `now > created_at + 90d` → نشست باطل.
5. **revoke:** logout، تغییر رمز، یا غیرفعال‌شدن کاربر.

> چون سرور همیشه DB را می‌خواند، **لغو فوری** است (برخلاف JWT stateless).

---

## ۴. گاردها و ماتریس endpointها

> گارد گلوبال (`APP_GUARD`) وجود ندارد؛ هر کنترلر صریحاً `@UseGuards` می‌گیرد.

| متد | مسیر | گاردها | CSRF |
|---|---|---|---|
| GET | `/auth/csrf` | `@Public` | ❌ |
| POST | `/auth/otp/request` | `@Public` + `CsrfGuard` | ✅ |
| POST | `/auth/otp/verify` | `@Public` + `CsrfGuard` | ✅ |
| POST | `/auth/login` | `@Public` + `LocalAuthGuard` + `CsrfGuard` | ✅ |
| POST | `/auth/logout` | `OptionalSessionAuthGuard` + `CsrfGuard` | ✅ |
| POST | `/auth/password` | `SessionAuthGuard` + `CsrfGuard` | ✅ |
| GET | `/auth/me` | `OptionalSessionAuthGuard` | ❌ |
| POST | `/auth/dev/login` | `@Public` + `DevAuthGuard` | ❌* |
| POST | `/auth/test/hash-password` | `@Public` | ❌ |

> `POST /auth/refresh` **حذف شد**.

گارد روی کنترلرهای دیگر:

| کنترلر | پیشوند | گاردها |
|---|---|---|
| `cart` | `/cart` | `OptionalSessionAuthGuard` + `CsrfGuard` |
| `site-settings` | `/site-settings` | `SessionAuthGuard` + `PermissionsGuard` + `CsrfGuard` (یک GET: `@Public` + `OptionalSessionAuthGuard`) |
| `authorization` | `/admin` | `SessionAuthGuard` + `PermissionsGuard` + `CsrfGuard` |
| `page-section` (ادمین) | `/admin/page-sections` | `SessionAuthGuard` + `PermissionsGuard` + `CsrfGuard` |
| `file-manager` | `/files` | `SessionAuthGuard` + `PermissionsGuard` + `CsrfGuard` |
| `product-public` / `category-public` / `page-section-public` | عمومی | بدون گارد (فقط خواندن) |

`req.user` شکل زیر را دارد (سازگار با قبل):

```ts
{ userId: number; username: string; sessionId: string }
```

---

## ۵. CSRF

- `CsrfGuard` روی `GET/HEAD/OPTIONS` معاف است.
- برای درخواست‌های تغییردهنده: `assertOrigin` (هدر Origin در `APP_ORIGIN`) + `validate` (هدر `X-CSRF-Token` == کوکی `csrf_token`).
- اگر درخواست با **Bearer** احراز شده باشد، CSRF معاف است (چون مرورگر هدر را خودکار نمی‌فرستد).
- `csrf_token` بعد از `login`، `otp/verify` و `dev/login` می‌چرخد.

---

## ۶. چند حامل اعتبار (وب + موبایل)

`extractSessionCredential` توکن را از یکی از این دو می‌گیرد:

1. کوکی `session` (وب) → `authVia = 'cookie'` → CSRF لازم.
2. هدر `Authorization: Bearer <token>` (موبایل/API) → `authVia = 'bearer'` → CSRF معاف.

هر دو به **همان جدول `auth_sessions`** اشاره می‌کنند؛ یعنی یک سیستم نشست با دو حامل. برای موبایل می‌توان بعداً یک endpoint (`POST /auth/token`) اضافه کرد که همان توکن را در بدنه برگرداند.

---

## ۷. جریان‌های کلیدی

**ورود (login/otp/verify):**
```
raw = randomBytes(32)
INSERT auth_sessions { user_id, token_hash=sha256(raw), expires_at=now+30d }
Set-Cookie: session=raw; HttpOnly; Secure; SameSite=Lax; Path=/
rotate csrf_token
```

**هر درخواست:** توکن → hash → lookup → چک revoked/expires/absolute → sliding → `req.user`.

**خروج:** `revokeOne(sessionId)` + پاک‌کردن کوکی.

**تغییر رمز:** ست رمز + `revokeAllForUserExcept(userId, currentSessionId)`.

---

## ۸. SSR و PWA

- SSR فقط کوکی `session` را forward می‌کند (سرور-به-سرور). بدون interceptor، بدون refresh، بدون race.
- PWA همان مرورگر است؛ کوکی بی‌مشکل کار می‌کند. فقط کش service worker را برای داده‌ی احرازشده خاموش کن.
- برای فرانت/بک same-site (مثل `test.com` + `api.test.com`) کوکی `SameSite=Lax` کافی است.

---

## ۹. درگاه پرداخت

سه نکته‌ی حساس (همه حول CSRF/کوکی، نه نشست):

1. **callback درگاه باید `@Public` و بدون `CsrfGuard` باشد** (درگاه نه هدر CSRF می‌فرستد نه Origin معتبر دارد). ترجیحاً `GET`.
2. پاسخ callback باید `302 redirect` با `@Res()` (بدون passthrough) باشد، نه JSON.
3. اعتبار پرداخت را با **verify سمت سرور** بسنج؛ به پارامترهای callback اعتماد نکن و مبلغ را سمت سرور بازمحاسبه کن.
4. شروع پرداخت (`POST`) یک عملیات تغییردهنده‌ی عادی است → `SessionAuthGuard` + `CsrfGuard`.
5. در callback به نشست کاربر تکیه نکن؛ سفارش را با authority/شناسه پیدا کن.

---

## ۱۰. متغیرهای محیطی

```dotenv
# App / CORS+CSRF origin
APP_ORIGIN=http://localhost:5173,http://127.0.0.1:5173   # `*` فقط در dev

# Session (opaque HttpOnly cookie)
SESSION_TTL_DAYS=30          # sliding
SESSION_ABSOLUTE_DAYS=90     # hard cap

# Cookies
COOKIE_SECURE=false          # در production: true
COOKIE_SAME_SITE=lax
# COOKIE_DOMAIN=

# Dev-only
DEV_AUTH=false
```

---

## ۱۱. نکات و ریسک‌ها

- **گارد گلوبال نداریم:** هر کنترلر جدید پیش‌فرض عمومی است تا `@UseGuards` بگذاری. توصیه برای فاز بعد: `APP_GUARD` + `@Public`.
- `POST /auth/test/hash-password` عمومی است (طبق قرارداد فعلی پروژه). برای production بهتر است گیت شود.
- CORS بر اساس `APP_ORIGIN` بسته می‌شود (`*` فقط dev).
- `passport` فقط برای استراتژی‌های ورود آینده (مثل گوگل) نگه داشته شده؛ JWT حذف شده است.

---

## ۱۲. جمع‌بندی

1. **یک سیستم نشست، دو حامل** (کوکی برای وب، Bearer برای موبایل).
2. **حقیقت در DB** است؛ کوکی فقط یک اشاره‌گر → لغو فوری.
3. **sliding + absolute** برای تعادل امنیت/تجربه.
4. **CSRF** فقط برای کوکی؛ Bearer معاف.
5. **SSR/PWA** بدون هیچ لایه‌ی اضافه کار می‌کند.
6. JWT/refresh/rotation حذف شدند؛ برای چرایی به سند `auth-passport-vs-sanctum.md` نگاه کن.
