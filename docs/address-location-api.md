# راهنمای آدرس و لوکیشن (Address & Location API) — برای فرانت‌اند

این سند قرارداد کامل **آدرس‌های کاربر** و **لوکیشن‌ها (استان/شهر)** است: دسترسی‌ها، هدرها، endpointها، شکل پاسخ و تله‌هایی که سمت UI باید مدیریت شوند.

---

## ۱. مدل داده

| موجودیت | مالکیت | توضیح |
|---|---|---|
| `Address` | **مخصوص هر کاربر** | فقط صاحب آدرس می‌تواند ببیند/تغییر دهد |
| `Location` | **مشترک بین همه** | فقط یک جفت استان/شهر؛ کاربران می‌خوانند، ادمین مدیریت می‌کند |

- هر آدرس یک `locationId` دارد که به یک `Location` اشاره می‌کند.
- `userId` آدرس **هرگز** از سمت کلاینت فرستاده نمی‌شود؛ بک آن را از **سشن** می‌خواند.
- خواندن لوکیشن‌ها برای هر کاربر لاگین‌کرده آزاد است؛ ساخت/ویرایش/حذف لوکیشن نیاز به permission دارد.

> URL پایه: بدون `globalPrefix` — مسیرها مستقیم `/addresses`، `/locations`، `/auth/csrf` هستند. Swagger روی `/docs`.

---

## ۲. قالب پاسخ (مهم)

**همه‌ی** پاسخ‌های موفق داخل envelope هستند:

```jsonc
{
  "statusCode": 200,
  "data": { /* payload واقعی */ },
  "message": "OK"
}
```

پس همیشه `body.data` را بخوان، نه ریشه‌ی پاسخ.

پاسخ خطا (از `AllExceptionsFilter`):

```jsonc
// خطای منطقی
{ "statusCode": 404, "message": "Address not found" }

// خطای اعتبارسنجی
{
  "statusCode": 400,
  "message": "Bad Request",
  "details": [ { "field": "postalCode", "message": "postalCode should not be empty" } ]
}
```

| کد | معنا | نمونه پیام |
|---|---|---|
| `400` | داده‌ی نامعتبر / فیلد ناشناس در بدنه | `Bad Request` + `details` |
| `401` | بدون سشن معتبر | `Unauthorized` |
| `403` | CSRF خراب یا نداشتن permission | `Invalid CSRF token` / `Insufficient permissions` |
| `404` | آدرس یا لوکیشن پیدا نشد | `Address not found` / `Location not found` |
| `409` | لوکیشن در حال استفاده در یک آدرس | `Location is in use by an address` |

---

## ۳. احراز هویت، CSRF و دسترسی‌ها

- **همه‌ی** endpointهای آدرس و لوکیشن نیاز به **لاگین** دارند (`SessionAuthGuard`).
  - بدون سشن → `401`. (برخلاف سبد خرید که «نرم» است و مهمان تلقی می‌شود.)
- روی `POST`/`PATCH`/`DELETE` هدر **`X-CSRF-Token`** اجباری است و باید برابر مقدار کوکی `csrf_token` باشد.
  - توکن را **لحظه‌ی درخواست از کوکی بخوان** و هرگز cache نکن (بعد از login/otpVerify عوض می‌شود).
- کوکی‌ها فقط با `credentials: 'include'` فرستاده می‌شوند.

### دسترسی‌ها

| عملیات | دسترسی لازم |
|---|---|
| خواندن آدرس‌ها (فقط مال خود کاربر) | فقط لاگین |
| ساخت/ویرایش/حذف آدرس (فقط مال خود کاربر) | فقط لاگین |
| خواندن لوکیشن‌ها | فقط لاگین |
| `POST /locations` | `location:create` |
| `PATCH /locations/:id` | `location:update` |
| `DELETE /locations/:id` | `location:delete` |

> لیست permissionهای کاربر از `GET /auth/me` (فیلد `permissions`) قابل خواندن است. اگر پنل مدیریت لوکیشن می‌سازی، دکمه‌های ساخت/ویرایش/حذف را با همین permissionها show/hide کن.

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

/** جفت استان/شهر تودرتو در پاسخ آدرس */
export interface LocationRef {
  id: number;
  province: string;
  city: string;
}

export interface Address {
  id: number;
  title: string;
  address: string;            // نشانی دقیق (خیابان، کوچه، پلاک، واحد)
  postalCode: string;
  isMain: boolean;            // پیش‌فرض کاربر (برای هر کاربر فقط یکی true است)
  locationId: number;
  location: LocationRef;      // اطلاعات نمایشی؛ نیازی به درخواست جدا نیست
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}

export interface Location {
  id: number;
  province: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  title: string;
  address: string;            // نشانی دقیق؛ اجباری
  postalCode: string;
  locationId: number;
  isMain?: boolean;           // اختیاری، پیش‌فرض false
}
export type UpdateAddressInput = Partial<CreateAddressInput>;

export interface CreateLocationInput {
  province: string;
  city: string;
}
export type UpdateLocationInput = Partial<CreateLocationInput>;
```

---

## ۵. Endpointهای لوکیشن

### ۵.۱ لیست — `GET /locations`

- دسترسی: فقط لاگین.
- ترتیب: `province` صعودی، بعد `city` صعودی.
- **صفحه‌بندی ندارد**؛ کل لیست را برمی‌گرداند (برای فرم انتخاب شهر کافی است).

**پاسخ ۲۰۰:** `data` = `Location[]`

```jsonc
[
  { "id": 12, "province": "تهران", "city": "تهران", "createdAt": "...", "updatedAt": "..." },
  { "id": 13, "province": "تهران", "city": "کرج",  "createdAt": "...", "updatedAt": "..." }
]
```

### ۵.۲ یک لوکیشن — `GET /locations/:id`

- دسترسی: فقط لاگین. → `data` = `Location` — نبود → `404 Location not found`.

### ۵.۳ ساخت — `POST /locations`  (permission: `location:create`)

**بدنه:**

```jsonc
{ "province": "تهران", "city": "تهران" }   // هر دو اجباری، رشته‌ی غیرخالی، حداکثر ۲۵۵ کاراکتر
```

**پاسخ ۲۰۱:** `data` = `Location`

### ۵.۴ ویرایش — `PATCH /locations/:id`  (permission: `location:update`)

**بدنه:** ترکیبی از `province` و/یا `city` (هر دو اختیاری). بدنه‌ی خالی مجاز است و منبع را بدون تغییر برمی‌گرداند.

**پاسخ ۲۰۰:** `data` = `Location` — نبود → `404`.

### ۵.۵ حذف — `DELETE /locations/:id`  (permission: `location:delete`)

**پاسخ ۲۰۰:** `data` = `{ "ok": true }`

**خطاها:**
- `404 Location not found`
- `409 Location is in use by an address` — تا وقتی حداقل یک آدرس به این لوکیشن وصل است، حذف نمی‌شود. پیام را به کاربر نشان بده.

---

## ۶. Endpointهای آدرس (همه فقط مال کاربر جاری)

### ۶.۱ لیست — `GET /addresses`

- ترتیب: آدرس پیش‌فرض (`isMain`) اول، بعد قدیمی‌ترین.
- اگر کاربر آدرسی ندارد: آرایه‌ی خالی `[]` با وضعیت ۲۰۰.

**پاسخ ۲۰۰:** `data` = `Address[]`

### ۶.۲ یک آدرس — `GET /addresses/:id`

**پاسخ ۲۰۰:** `data` = `Address` — اگر آدرس متعلق به کاربر نباشد یا نباشد → `404 Address not found`.

### ۶.۳ ساخت — `POST /addresses`

**بدنه:**

```jsonc
{
  "title": "خانه",          // اجباری
  "address": "خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳", // اجباری؛ نشانی دقیق
  "postalCode": "1234567890", // اجباری
  "locationId": 12,          // اجباری؛ باید یک Location موجود باشد
  "isMain": true             // اختیاری، پیش‌فرض false
}
```

**پاسخ ۲۰۱:** `data` = `Address`

**خطاها:**
- `404 Location not found` اگر `locationId` موجود نباشد.
- `400` اگر فیلد ناشناس (مثلاً `userId`) بفرستی: `property userId should not exist`.

### ۶.۴ ویرایش — `PATCH /addresses/:id`

**بدنه:** هر زیرمجموعه‌ای از `title` / `address` / `postalCode` / `locationId` / `isMain`. بدنه‌ی خالی مجاز است.

**پاسخ ۲۰۰:** `data` = `Address`

**خطاها:** `404 Address not found` (یا آدرس دیگری) — `404 Location not found` اگر `locationId` جدید نامعتبر باشد.

### ۶.۵ تعیین پیش‌فرض — `PATCH /addresses/:id/main`

- بدون بدنه.
- این آدرس `isMain: true` می‌شود و **بقیه‌ی آدرس‌های همان کاربر خودکار `false` می‌شوند** (اتمیک).

**پاسخ ۲۰۰:** `data` = `Address` (با `isMain: true`)

**خطا:** `404 Address not found`.

### ۶.۶ حذف — `DELETE /addresses/:id`

**پاسخ ۲۰۰:** `data` = `{ "ok": true }` — `404 Address not found`.

---

## ۷. رفتار `isMain` (پیش‌فرض)

- برای هر کاربر حداکثر **یک** آدرس `isMain: true` دارد.
- اگر با `isMain: true` بسازی یا ویرایش کنی، بک خودش بقیه را `false` می‌کند.
- پس از `PATCH /addresses/:id/main` یا هر تغییر `isMain`، **لیست را دوباره بگیر** تا وضعیت بقیه‌ی آیتم‌ها هم در UI درست شود.
- اگر بدنه‌ی `PATCH` بدنه‌ی خالی باشد یا `isMain` نفرستی، وضعیت پیش‌فرض دست‌نخورده می‌ماند.

---

## ۸. کلاینت نمونه

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
```

```ts
// --- Locations ---
const listLocations = () => apiFetch<Location[]>('/locations');
const getLocation = (id: number) => apiFetch<Location>(`/locations/${id}`);
const createLocation = (input: CreateLocationInput) =>
  apiFetch<Location>('/locations', { method: 'POST', body: JSON.stringify(input) });
const updateLocation = (id: number, input: UpdateLocationInput) =>
  apiFetch<Location>(`/locations/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
const deleteLocation = (id: number) =>
  apiFetch<{ ok: true }>(`/locations/${id}`, { method: 'DELETE' });

// --- Addresses ---
const listAddresses = () => apiFetch<Address[]>('/addresses');
const getAddress = (id: number) => apiFetch<Address>(`/addresses/${id}`);
const createAddress = (input: CreateAddressInput) =>
  apiFetch<Address>('/addresses', { method: 'POST', body: JSON.stringify(input) });
const updateAddress = (id: number, input: UpdateAddressInput) =>
  apiFetch<Address>(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
const setMainAddress = (id: number) =>
  apiFetch<Address>(`/addresses/${id}/main`, { method: 'PATCH' });
const deleteAddress = (id: number) =>
  apiFetch<{ ok: true }>(`/addresses/${id}`, { method: 'DELETE' });
```

---

## ۹. جریان‌های پیشنهادی UI

### ۹.۱ لیست آدرس‌ها
`GET /addresses` → کارت هر آدرس با `title`, `address`, `postalCode`, `location.province + location.city` و نشان «پیش‌فرض» برای `isMain`.

### ۹.۲ فرم ساخت/ویرایش آدرس
1. یک‌بار `GET /locations` را بگیر و cache کن (در state/کش).
2. اگر cascade استان/شهر می‌خواهی، روی `province` گروه‌بندی کن: `Map<province, Location[]>`.
3. انتخاب کاربر را به `locationId` نگاشت کن.
4. برای ساخت: `POST /addresses`؛ برای ویرایش: `PATCH /addresses/:id`.
5. اگر `isMain` را true کردی، بعد از موفقیت، لیست را refetch کن.

### ۹.۳ تعیین پیش‌فرض
`PATCH /addresses/:id/main` → سپس refetch لیست (چون `isMain` بقیه عوض شده).

### ۹.۴ حذف
تأیید بگیر، بعد `DELETE /addresses/:id` → refetch لیست.

### ۹.۵ مدیریت لوکیشن (پنل ادمین)
- فقط اگر `location:create/update/delete` را از `GET /auth/me` گرفتی، فرم/دکمه‌ها را نشان بده.
- هنگام حذف، خطای `409` را با پیام «این لوکیشن در آدرس‌ها استفاده شده» مدیریت کن.

---

## ۱۰. تله‌ها ⚠️

### تله ۱ — `userId` هرگز فرستاده نمی‌شود
مالک آدرس از سشن خوانده می‌شود. اگر `userId` در بدنه بفرستی، `400` با `property userId should not exist` می‌گیری (چون `forbidNonWhitelisted` فعال است).

### تله ۲ — آدرس دیگران = ۴۰۴ (نه ۴۰۳)
دسترسی به آدرس یک کاربر دیگر `404 Address not found` می‌دهد (نه `403`). پس در UI فرض نکن «وجود دارد ولی اجازه ندارم»؛ برای کلاینت مثل «پیدا نشد» رفتار کن.

### تله ۳ — آدرس سخت‌گیر است (۴۰۱)، سبد نرم
بدون سشن روی `/addresses` و `/locations` همیشه `401` می‌گیری. قبل از رفتن به صفحه‌ی آدرس‌ها، با `GET /auth/me` مطمئن شو لاگین است.

### تله ۴ — CSRF را cache نکن
کوکی `csrf_token` بعد از login/otpVerify عوض می‌شود. همیشه لحظه‌ی mutation از `document.cookie` بخوان.

### تله ۵ — `locationId` باید معتبر باشد
ساخت/ویرایش آدرس با `locationId` ناموجود → `404 Location not found`. مقدار را از `GET /locations` بردار، نه دستی.

### تله ۶ — حذف لوکیشنِ در حال استفاده ممنوع است
`DELETE /locations/:id` وقتی آدرسی به آن وصل است → `409`. این محدودیت عمدی است تا آدرس‌ها بی‌مرجع نشوند.

### تله ۷ — فقط یک پیش‌فرض
`isMain` انحصاری است. بعد از هر تغییر پیش‌فرض، لیست را دوباره بگیر؛ خودت دستی `isMain` بقیه را false نکن.

### تله ۸ — بدنه‌ی خالی `PATCH` مجاز است
`PATCH` با `{}` خطا نمی‌دهد و منبع را بدون تغییر برمی‌گرداند. برای «هیچ تغییری» می‌توانی درخواست را نزنی.

### تله ۹ — تاریخ‌ها ISO string هستند
`createdAt`/`updatedAt` رشته‌ی ISO 8601 هستند؛ در UI فرمت کن.

### تله ۱۰ — فیلد ناشناس = ۴۰۰
هر فیلد اضافه در بدنه (غیر از فیلدهای DTO) → `400 Bad Request` با `details`. دقیقاً همان فیلدهای مجاز را بفرست.

### تله ۱۱ — `address` (نشانی دقیق) اجباری است
در ساخت آدرس، فیلد `address` (خیابان/کوچه/پلاک/واحد) **اجباری** است و حداکثر ۱۰۰۰ کاراکتر. اگر نفرستی یا خالی بگذاری → `400`. در فرم، این را به‌صورت `textarea` قرار بده نه input تک‌خطی.

---

## ۱۱. چک‌لیست فرانت

- [ ] صفحه‌ی آدرس‌ها فقط برای کاربر لاگین‌کرده (بررسی با `GET /auth/me`).
- [ ] خواندن تازه‌ی `csrf_token` از کوکی برای هر `POST`/`PATCH`/`DELETE`.
- [ ] `credentials: 'include'` روی همه‌ی درخواست‌ها.
- [ ] خواندن payload از `body.data` و خطا از `body.message` / `body.details`.
- [ ] گرفتن `GET /locations` برای پر کردن انتخاب استان/شهر (نگاشت `locationId`).
- [ ] بعد از ساخت/ویرایش با `isMain` و بعد از `PATCH .../main`، refetch لیست آدرس‌ها.
- [ ] مدیریت `404` آدرس، `404` لوکیشن، `409` حذف لوکیشن و `403` در پنل ادمین.
- [ ] `userId` را در هیچ بدنه‌ای نفرست.

---

## ۱۲. جدول مرجع سریع

| متد | مسیر | دسترسی | CSRF | موفق | `data` |
|---|---|---|---|---|---|
| GET | `/locations` | لاگین | نه | 200 | `Location[]` |
| GET | `/locations/:id` | لاگین | نه | 200 | `Location` |
| POST | `/locations` | `location:create` | بله | 201 | `Location` |
| PATCH | `/locations/:id` | `location:update` | بله | 200 | `Location` |
| DELETE | `/locations/:id` | `location:delete` | بله | 200 | `{ ok: true }` |
| GET | `/addresses` | لاگین (مال خودش) | نه | 200 | `Address[]` |
| GET | `/addresses/:id` | لاگین (مال خودش) | نه | 200 | `Address` |
| POST | `/addresses` | لاگین | بله | 201 | `Address` |
| PATCH | `/addresses/:id` | لاگین (مال خودش) | بله | 200 | `Address` |
| PATCH | `/addresses/:id/main` | لاگین (مال خودش) | بله | 200 | `Address` |
| DELETE | `/addresses/:id` | لاگین (مال خودش) | بله | 200 | `{ ok: true }` |

**بدنه‌های مجاز:**
- `POST /locations` → `{ province, city }`
- `PATCH /locations/:id` → `{ province?, city? }`
- `POST /addresses` → `{ title, address, postalCode, locationId, isMain? }`
- `PATCH /addresses/:id` → `{ title?, address?, postalCode?, locationId?, isMain? }`
- `PATCH /addresses/:id/main` → بدون بدنه
