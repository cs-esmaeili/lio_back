# راهنمای پروفایل کاربر (Profile API) — برای فرانت‌اند

این سند قرارداد **مشاهده و ویرایش اطلاعات فردی خودِ کاربر** است. هر کاربر لاگین‌کرده فقط به اطلاعات **خودش** دسترسی دارد.

> URL پایه: بدون `globalPrefix` — مسیرها مستقیم `/profile` هستند. Swagger روی `/docs`.
>
> این مسیر جدا از `/profile/orders` (تاریخچه سفارش‌ها) و `/addresses` (آدرس‌ها) است.

---

## ۱. قالب پاسخ (خیلی مهم)

همه‌ی پاسخ‌های موفق داخل envelope هستند:

```jsonc
{
  "statusCode": 200,
  "data": { /* payload واقعی */ },
  "message": "OK"
}
```

پس همیشه `body.data` را بخوان، نه ریشه‌ی پاسخ.

پاسخ خطا:

```jsonc
// خطای منطقی
{ "statusCode": 409, "message": "National code is already in use" }

// خطای اعتبارسنجی بدنه
{
  "statusCode": 400,
  "message": "Bad Request",
  "details": [ { "field": "nationalCode", "message": "nationalCode must be exactly 10 digits" } ]
}
```

---

## ۲. احراز هویت و CSRF

- هر دو endpoint نیاز به **لاگین** دارند (`SessionAuthGuard`). بدون سشن → `401`.
- روی `PATCH` هدر **`X-CSRF-Token`** اجباری است و باید برابر مقدار کوکی `csrf_token` باشد.
  - توکن را **لحظه‌ی درخواست از کوکی بخوان** و هرگز cache نکن (بعد از login/otpVerify عوض می‌شود).
- کوکی‌ها فقط با `credentials: 'include'` فرستاده می‌شوند.
- **بدون permission خاص**: هر کاربر لاگین‌کرده مجاز به ویرایش پروفایل خودش است.

---

## ۳. مدل داده و محدوده‌ی ویرایش

| فیلد | نوع | قابل ویرایش؟ | توضیح |
|---|---|---|---|
| `id` | `number` | ❌ | شناسه‌ی کاربر |
| `username` | `string` | ❌ | شماره موبایل؛ شناسه‌ی ورود است و تغییر نمی‌کند |
| `name` | `string \| null` | ✅ | نام (حداکثر ۲۵۵ کاراکتر) |
| `lastName` | `string \| null` | ✅ | نام خانوادگی (حداکثر ۲۵۵ کاراکتر) |
| `nationalCode` | `string \| null` | ✅ | کد ملی؛ **دقیقاً ۱۰ رقم** |
| `createdAt` | `string` | ❌ | ISO 8601 |
| `updatedAt` | `string` | ❌ | ISO 8601 |

> ⚠️ **آدرس در این endpoint نیست.** آدرس‌ها قرارداد جداگانه‌ای دارند (`/addresses` — به سند `address-location-api.md` مراجعه کن).
>
> ⚠️ **`username` ویرایش نمی‌شود.** اگر آن را در بدنه بفرستی → `400` با `property username should not exist`.

---

## ۴. انواع (TypeScript)

```ts
export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface Profile {
  id: number;
  username: string;          // شماره موبایل — فقط خواندنی
  name: string | null;
  lastName: string | null;
  nationalCode: string | null;
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}

export interface UpdateProfileInput {
  name?: string;
  lastName?: string;
  nationalCode?: string;     // دقیقاً ۱۰ رقم
}
```

---

## ۵. Endpointها

### ۵.۱ خواندن پروفایل خود — `GET /profile`

- دسترسی: فقط لاگین.
- بدون CSRF.
- داده فقط از روی **سشن** خوانده می‌شود؛ هیچ `id`‌ای در مسیر یا بدنه نیست.

**پاسخ ۲۰۰:** `data` = `Profile`

```jsonc
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "username": "09123456789",
    "name": "Ali",
    "lastName": "Rezaei",
    "nationalCode": "1234567890",
    "createdAt": "2026-08-30T12:00:00.000Z",
    "updatedAt": "2026-09-28T09:30:00.000Z"
  },
  "message": "OK"
}
```

**خطاها:** `401 Unauthorized` بدون سشن معتبر.

---

### ۵.۲ ویرایش پروفایل خود — `PATCH /profile`

| | |
|---|---|
| هدرها | `Content-Type: application/json`، `X-CSRF-Token: <...>` |
| بدنه | ترکیبی از `name`، `lastName`، `nationalCode` (همه اختیاری) |
| موفق | `200` + `data` = پروفایل به‌روز |
| خطاها | `400` اعتبارسنجی، `401` بدون سشن، `403` CSRF، `409` کد ملی تکراری |

**بدنه:**

```jsonc
{
  "name": "Ali",
  "lastName": "Rezaei",
  "nationalCode": "1234567890"
}
```

**پاسخ ۲۰۰:** `data` = `Profile` (همان شکل `GET`).

**نکات مهم:**

- فقط فیلدهایی که در بدنه می‌فرستی تغییر می‌کنند؛ بقیه دست‌نخورده می‌مانند (partial update).
- بدنه‌ی خالی `{}` مجاز است و پروفایل را بدون تغییر برمی‌گرداند.
- `nationalCode` باید **دقیقاً ۱۰ رقم** باشد (فقط عدد). وگرنه → `400`.
- اگر `nationalCode` قبلاً برای کاربر دیگری ثبت شده باشد → `409 National code is already in use`.

**خطاها:**

```jsonc
// 400 — کد ملی نامعتبر
{
  "statusCode": 400,
  "message": "Bad Request",
  "details": [ { "field": "nationalCode", "message": "nationalCode must be exactly 10 digits" } ]
}

// 400 — فیلد غیرمجاز (مثلاً username)
{
  "statusCode": 400,
  "message": "Bad Request",
  "details": [ { "field": "username", "message": "property username should not exist" } ]
}

// 409 — کد ملی تکراری
{ "statusCode": 409, "message": "National code is already in use" }
```

---

## ۶. نمونه‌ی curl

```bash
# ۱) گرفتن توکن CSRF (کوکی csrf_token را هم ست می‌کند)
curl -i -c cookies.txt -b cookies.txt http://localhost:3000/auth/csrf

# ۲) خواندن پروفایل خود
curl -i -b cookies.txt http://localhost:3000/profile

# ۳) ویرایش پروفایل خود
curl -i -b cookies.txt -c cookies.txt \
  -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <csrf-token-from-cookie>' \
  -d '{"name":"Ali","lastName":"Rezaei","nationalCode":"1234567890"}' \
  -X PATCH http://localhost:3000/profile
```

---

## ۷. کلاینت نمونه

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody) {
    super(body?.message ?? 'Request failed');
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');

  // توکن CSRF را همان لحظه از کوکی بخوان (هرگز cache نکن!)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = readCookie('csrf_token');
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const res = await fetch(`${API}${path}`, { ...init, method, headers, credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body.data as T;
}

// --- Profile ---
const getProfile = () => apiFetch<Profile>('/profile');
const updateProfile = (input: UpdateProfileInput) =>
  apiFetch<Profile>('/profile', { method: 'PATCH', body: JSON.stringify(input) });
```

---

## ۸. جریان پیشنهادی UI

1. در بوت‌اپ با `GET /auth/me` مطمئن شو کاربر لاگین است (وضعیت نشست).
2. صفحه‌ی پروفایل: `GET /profile` را بگیر و فرم را با مقادیر فعلی پر کن.
3. `username` را به‌صورت **فقط‌خواندنی** (disabled) نشان بده.
4. آدرس‌ها را از `GET /addresses` جداگانه بگیر و در همان صفحه نمایش بده (این endpoint آدرس را برنمی‌گرداند).
5. ذخیره: `PATCH /profile` با فقط فیلدهای تغییر‌یافته → روی `409` پیام «این کد ملی قبلاً استفاده شده» را کنار فیلد نشان بده و روی `400` از `body.details` استفاده کن.

---

## ۹. تله‌ها ⚠️

### تله ۱ — فقط خودت را می‌بینی
هیچ `id` یا `userId` در URL/بدنه نیست. مالک از سشن خوانده می‌شود؛ امکان خواندن/ویرایش کاربر دیگر وجود ندارد.

### تله ۲ — `username` و آدرس ویرایش نمی‌شوند
`username` اصلاً در بدنه مجاز نیست (`400`)، و آدرس قرارداد جداگانه (`/addresses`) دارد. این‌ها را در این فرم نفرست.

### تله ۳ — CSRF را cache نکن
کوکی `csrf_token` بعد از login/otpVerify عوض می‌شود. همیشه لحظه‌ی `PATCH` از `document.cookie` بخوان.

### تله ۴ — `nationalCode` دقیقاً ۱۰ رقم
اگر صفر ابتدایی دارد، آن را به‌صورت رشته (`string`) بفرست، نه عدد؛ وگرنه صفرها حذف می‌شوند.

### تله ۵ — `409` یعنی کد ملی برای دیگری ثبت شده
پیام را کنار فیلد `nationalCode` نشان بده و از کاربر بخواه کد را اصلاح کند.

### تله ۶ — partial update
فقط فیلدهایی که می‌فرستی تغییر می‌کنند. برای پاک‌کردن یک فیلد مقدار `""` نفرست؛ فعلاً امکان `null` کردن وجود ندارد.

---

## ۱۰. جدول مرجع سریع

| متد | مسیر | دسترسی | CSRF | موفق | `data` |
|---|---|---|---|---|---|
| GET | `/profile` | لاگین (فقط خودش) | نه | 200 | `Profile` |
| PATCH | `/profile` | لاگین (فقط خودش) | بله | 200 | `Profile` |

**بدنه‌های مجاز:**
- `PATCH /profile` → `{ name?, lastName?, nationalCode? }`
