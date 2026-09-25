# راهنمای ورود و نشست (Auth API) — برای فرانت‌اند

این سند قرارداد کامل **ورود با رمز عبور** و **ورود با OTP (پیامک)** است: CSRF، کوکی نشست، endpointها، شکل پاسخ و تله‌هایی که سمت فرانت باید مدیریت شوند.

> URL پایه: مسیرها بدون prefix هستند، پس مستقیم `/auth/...`. مستندات تعاملی Swagger روی `/docs`.
>
> **تغییر مهم:** احراز هویت روی **کوکی نشست (HttpOnly)** است. دیگر `access_token`/`refresh_token` و endpoint `POST /auth/refresh` وجود ندارد. روی `401` کاربر را مهمان کن (هیچ refresh‌ای نزن).

---

## ۱. قالب پاسخ (خیلی مهم)

**همه‌ی** پاسخ‌های موفق داخل یک envelope هستند:

```jsonc
{
  "statusCode": 201,
  "data": { /* payload واقعی */ },
  "message": "Created"
}
```

پس کاربر واقعی همیشه زیر `response.data` است، نه در ریشه.

پاسخ خطا:

```jsonc
// خطای منطقی
{ "statusCode": 401, "message": "Invalid or expired OTP" }

// خطای اعتبارسنجی بدنه
{
  "statusCode": 400,
  "message": "Bad Request",
  "details": [ { "field": "username", "message": "username must be longer than or equal to 11 characters" } ]
}
```

---

## ۲. کوکی‌ها

بک از کوکی استفاده می‌کند؛ فرانت توکنی نگه نمی‌دارد و در هدر `Authorization` نمی‌فرستد (این فقط برای موبایل است).

| کوکی | HttpOnly | قابل خواندن با JS؟ | عمر | نقش |
|---|---|---|---|---|
| `session` | ✅ | ❌ | ۳۰ روز (با استفاده تمدید می‌شود) | احراز هویت |
| `csrf_token` | ❌ | ✅ | ۸ ساعت | محافظت CSRF (double-submit) |

- سقف مطلق نشست **۹۰ روز** است؛ بعد از آن کاربر باید دوباره وارد شود (حتی اگر فعال بوده باشد).
- در production با `COOKIE_SECURE=true` نام کوکی نشست به `__Host-session` تغییر می‌کند. فرانت نباید به نام کوکی وابسته باشد.
- **CORS:** در همه‌ی درخواست‌ها `credentials: 'include'`.

---

## ۳. محافظت CSRF (حتماً بخوان)

همه‌ی درخواست‌های **تغییردهنده** (`POST`/`PATCH`/`PUT`/`DELETE`) نیاز به هدر `X-CSRF-Token` دارند. `GET`/`HEAD`/`OPTIONS` معاف‌اند.

### چرخه

1. فرانت یک‌بار `GET /auth/csrf` می‌زند.
2. بک کوکی `csrf_token` (غیر-HttpOnly) را ست می‌کند و همان مقدار را در بدنه برمی‌گرداند.
3. فرانت آن را در هدر `X-CSRF-Token` همه‌ی درخواست‌های تغییردهنده می‌فرستد.
4. بک بررسی می‌کند هدر با کوکی برابر باشد (double-submit) و Origin مجاز باشد.

### ⚠️ چرخش CSRF

بعد از **هر ورود موفق** (`login`، `otp/verify`، `dev/login`) بک یک `csrf_token` تازه ست می‌کند. پس اگر با توکن قدیمی درخواست بزنی **۴۰۳** می‌گیری. راه‌حل: همیشه لحظه‌ی درخواست از کوکی بخوان.

```ts
function getCsrfToken(): string {
  return decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1] ?? '',
  );
}
```

> خروج (`logout`) کوکی CSRF را عوض نمی‌کند.

---

## ۴. ورود با رمز عبور

### `POST /auth/login`

| | |
|---|---|
| هدرها | `Content-Type: application/json`، `X-CSRF-Token: <...>` |
| بدنه | `{ "username": "09123456789", "password": "secret-password" }` |
| موفق | `201` + کوکی `session` و `csrf_token` تازه |
| خطاها | `400` اعتبارسنجی، `401` رمز/کاربر نادرست، `403` CSRF |

پاسخ موفق:

```jsonc
{
  "statusCode": 201,
  "data": { "id": 1, "username": "09123456789", "name": "Ali", "lastName": "Rezaei" },
  "message": "Created"
}
```

---

## ۵. ورود با OTP (پیامک)

### ۵.۱ `POST /auth/otp/request`

| | |
|---|---|
| هدرها | `Content-Type: application/json`، `X-CSRF-Token: <...>` |
| بدنه | `{ "username": "09123456789" }` |
| موفق | `201` |
| خطاها | `400` شماره‌ی نامعتبر، `403` CSRF یا «درخواست زیاد»، `503` شکست ارسال پیامک |

```jsonc
{ "statusCode": 201, "data": { "ttlSeconds": 120 }, "message": "Created" }
```

- `ttlSeconds` = مدت اعتبار کد. فرانت شمارش معکوس و «ارسال مجدد» را بر همین اساس بسازد.
- کد **۶ رقمی** است.
- **فقط یک OTP فعال** برای هر شماره؛ درخواست جدید کد قبلی را باطل می‌کند.
- محدودیت نرخ: `OTP_MAX_REQUESTS=10` در `OTP_REQUEST_WINDOW_SECONDS` (پیش‌فرض ۹۰۰) → عبور = **`403 Too many OTP requests`**.
- شکست پیامک → **`503 Could not send the OTP SMS`**.

### ۵.۲ `POST /auth/otp/verify`

| | |
|---|---|
| هدرها | `Content-Type: application/json`، `X-CSRF-Token: <...>` |
| بدنه | `{ "username": "09123456789", "code": "123456" }` |
| موفق | `201` + کوکی `session` و `csrf_token` تازه |
| خطاها | `400` اعتبارسنجی، `401` کد نادرست/منقضی، `403` CSRF |

- اگر کاربر با این شماره وجود نداشته باشد، **همین‌جا ساخته می‌شود** (ثبت‌نام با OTP).
- بعد از `OTP_MAX_ATTEMPTS=5` تلاش اشتباه، کد باطل می‌شود → `401`.
- کد **یک‌بارمصرف** است.

---

## ۶. نشست: me / logout / password

### `GET /auth/me` — وضعیت فعلی

بدون CSRF. همیشه `200`:

```jsonc
// لاگین
{ "statusCode": 200, "data": { "authenticated": true, "user": { "id": 1, "username": "09123456789" }, "loading": false }, "message": "OK" }
// مهمان / نشست منقضی
{ "statusCode": 200, "data": { "authenticated": false, "user": null, "loading": false }, "message": "OK" }
```

> در بوت‌اپ با این endpoint وضعیت ورود را تعیین کن (نه از localStorage).

### `POST /auth/logout`

هدر `X-CSRF-Token` لازم است. بدون بدنه.

```jsonc
{ "statusCode": 201, "data": { "ok": true }, "message": "Created" }
```

نشست جاری باطل و کوکی `session` پاک می‌شود.

### `POST /auth/password`

هدر `X-CSRF-Token` لازم است. بدنه `{ "newPassword": "..." }` (حداقل ۸ کاراکتر).

```jsonc
{ "statusCode": 201, "data": { "ok": true }, "message": "Created" }
```

> **همه‌ی نشست‌های دیگرِ آن کاربر باطل می‌شوند** (فقط نشست جاری باقی می‌ماند).

---

## ۷. جمع‌بندی خطاها

| کد | معنی | کار فرانت |
|---|---|---|
| `400` | بدنه/شماره نامعتبر | `body.details` را کنار فیلدها نشان بده |
| `401` | رمز/کد نادرست یا نشست نامعتبر/منقضی | کاربر را **مهمان** کن (هیچ refresh‌ای نیست) |
| `403` | CSRF نامعتبر/گم‌شده، Origin غیرمجاز، یا `Too many OTP requests` | توکن CSRF را تازه بخوان؛ در rate-limit پیام انتظار بده |
| `503` | ارسال پیامک ناموفق | پیام «دوباره تلاش کنید» + دکمهٔ ارسال مجدد |
| `500` | خطای غیرمنتظره | پیام عمومی |

---

## ۸. چک‌لیست سریع فرانت

- [ ] همه‌ی درخواست‌ها با `credentials: 'include'`.
- [ ] برداشتن کامل interceptor مربوط به refresh (دیگر وجود ندارد).
- [ ] قبل از اولین درخواست تغییردهنده، `GET /auth/csrf` و خواندن توکن از کوکی `csrf_token`.
- [ ] گذاشتن `X-CSRF-Token` روی همه‌ی `POST/PATCH/PUT/DELETE` (تازه از کوکی، بدون cache).
- [ ] بعد از login/verify توکن CSRF را دوباره از کوکی بخوان (عوض می‌شود).
- [ ] خواندن payload از `body.data` و خطا از `body.message`.
- [ ] در `401` صرفاً کاربر را مهمان کن.
- [ ] تعیین وضعیت ورود در بوت با `GET /auth/me`.

---

## ۹. ابزار توسعه: ورود بدون رمز/پیامک

اگر `DEV_AUTH=true` باشد:

```bash
curl -i -c cookies.txt -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"username":"09123456789"}' http://localhost:3000/auth/dev/login
```

```jsonc
{ "statusCode": 201, "data": { "csrfToken": "...", "user": { "id": 1, "username": "09123456789", "name": "Ali", "lastName": "Rezaei" } }, "message": "Created" }
```

> در production باید `DEV_AUTH=false` باشد.

---

## ۱۰. موبایل (Bearer)

اپ موبایل می‌تواند همان توکن نشست را به‌جای کوکی، در هدر بفرستد:

```
Authorization: Bearer <session-token>
```

- در این حالت **CSRF لازم نیست** (چون هدر خودکار ارسال نمی‌شود).
- کوکی و Bearer به **همان نشست** اشاره می‌کنند؛ رفتار انقضا/باطل‌سازی یکی است.
