# راهنمای سبد خرید (Cart API) — برای فرانت‌اند

این سند قرارداد کامل سبد خرید بین فرانت و بک است: مفهوم‌ها، هدرها، endpointها، شکل پاسخ و **تله‌هایی که باید سمت فرانت مدیریت شوند**.

---

## ۱. مفهوم اصلی: هویت سبد

سبد خرید هم برای کاربر لاگین‌شده و هم برای مهمان کار می‌کند. مالک سبد دقیقاً یکی از این دو است:

| حالت | شناسه‌ی سبد | محل نگه‌داری |
|---|---|---|
| کاربر لاگین‌شده | کوکی `access_token` (HttpOnly) | مرورگر، خودکار |
| مهمان | هدر `X-Cart-Token` (UUID که **فرانت می‌سازد**) | `localStorage` فرانت |

- فرانت یک UUID می‌سازد، ذخیره می‌کند و در **همه‌ی** درخواست‌های سبد به‌عنوان `X-Cart-Token` می‌فرستد.
- اگر هم کوکی auth باشد و هم `X-Cart-Token`، بک **اول سبد مهمان را در سبد کاربر مرج می‌کند** و بعد درخواست را اجرا می‌کند.
- سبد مهمان بلافاصله بعد از مرج حذف می‌شود.

> URL پایه: در این پروژه `setGlobalPrefix` نداریم؛ پس مسیرها مستقیم `/cart`، `/cart/items`، `/auth/csrf` هستند. مستندات Swagger روی `/docs`.

---

## ۲. قالب پاسخ (خیلی مهم)

**همه‌ی** پاسخ‌های موفق داخل یک envelope هستند:

```jsonc
{
  "statusCode": 200,
  "data": { /* payload واقعی */ },
  "message": "OK"
}
```

پس سبد واقعی همیشه زیر `response.data` است، نه در ریشه‌ی پاسخ.

پاسخ خطا (از `AllExceptionsFilter`):

```jsonc
// خطای منطقی (مثلاً موجودی)
{ "statusCode": 400, "message": "Only 3 item(s) available" }

// خطای اعتبارسنجی بدنه/پارامتر
{
  "statusCode": 400,
  "message": "Bad Request",
  "details": [ { "field": "quantity", "message": "quantity must not be less than 1" } ]
}
```

> هیچ‌وقت فرض نکن پاسخ، خودِ آبجکت سبد است. همیشه `body.data` را بخوان. برای خطا هم `body.message` (و اگر بود `body.details`) را نشان بده.

---

## ۳. هدرها

| هدر | اجباری؟ | توضیح |
|---|---|---|
| `X-Cart-Token` | برای مهمان: بله | UUID سبد مهمان. با `crypto.randomUUID()` بساز. |
| `X-CSRF-Token` | روی `POST`/`PATCH`/`DELETE`: بله | باید برابر مقدار کوکی `csrf_token` باشد (double-submit). |
| `Cookie` | خودکار | کوکی‌های auth و csrf؛ فقط با `credentials: 'include'` فرستاده می‌شوند. |
| `Content-Type: application/json` | برای بدنه‌دار: بله | — |

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

export interface CartProduct {
  id: number;
  name: string;
  slug: string;
}

export interface CartVariant {
  id: number;
  sku: string;
  price: number;              // قیمت لحظه‌ای (عدد صحیح در ارز فروشگاه)
  compareAtPrice: number | null;
  stock: number;
}

export interface CartItem {
  variantId: number;          // کلید PATCH/DELETE
  quantity: number;
  lineTotal: number;          // price * quantity
  product: CartProduct;
  variant: CartVariant;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;          // جمع همه‌ی quantityها
  distinctItemCount: number;  // تعداد variantهای متمایز = items.length
  subtotal: number;           // جمع lineTotalها
}
```

---

## ۵. Endpointها

### ۵.۱ خواندن سبد — `GET /cart`

- با auth: سبد کاربر (یا سبد خالی اگر ندارد).
- فقط با `X-Cart-Token`: سبد مهمان (یا سبد خالی اگر وجود ندارد — **خطا نمی‌دهد**).
- با هر دو: اول مرج، بعد سبد کاربر.
- بدون هیچ‌کدام: سبد خالی `{ items: [], itemCount: 0, distinctItemCount: 0, subtotal: 0 }` با وضعیت ۲۰۰.

**پاسخ ۲۰۰:** `data` = `Cart`

```bash
curl -s http://localhost:3000/cart \
  -H 'X-Cart-Token: 3f2504e0-4f89-41d3-9a0c-0305e82c3301' \
  -b 'access_token=...'
```

> سبد خالی و «توکن ناشناس» هر دو یک نتیجه دارند: سبد خالی. برای همین اگر کاربر خواست سبد مهمانش را بعد از پاک‌شدن مثل حالت خصوصی مرورگر ببیند، چیزی برای بازیابی وجود ندارد.

---

### ۵.۲ افزودن — `POST /cart/items`

**بدنه:**

```jsonc
{ "variantId": 3744, "quantity": 1 }   // quantity اختیاری، پیش‌فرض ۱، حداقل ۱
```

**پاسخ ۲۰۱:** `data` = `Cart` (سبد کامل بعد از افزودن)

**خطاها:**
- `400` بدون هویت: `X-Cart-Token header is required for guests`
- `400` نامعتبر بودن توکن: `Invalid X-Cart-Token header`
- `404` اگر variant نباشد: `Variant not found`
- `400` اگر موجودی صفر: `Variant is out of stock`
- `400` اگر مجموع از موجودی بگذرد: `Only N item(s) available`
- `403` اگر CSRF درست نباشد: `Invalid CSRF token` (یا `Invalid origin`)

> `variantId` را از پاسخ محصول بگیر، نه `productId`. یک محصول با چند رنگ/سایز چند variant دارد و هرکدام یک آیتم جدا در سبد است.

---

### ۵.۳ تغییر تعداد — `PATCH /cart/items/:variantId`

**بدنه:** `{ "quantity": 2 }` (حداقل ۱)

**پاسخ ۲۰۰:** `data` = `Cart`

**خطاها:**
- `404` اگر سبد وجود ندارد: `Cart is empty`
- `404` اگر آن variant در سبد نیست: `Variant is not in the cart`
- `400` اگر از موجودی بگذرد: `Only N item(s) available`
- `403` CSRF.

> برای حذف، `quantity: 0` نفرست؛ از `DELETE` استفاده کن. مقدار ۰ خطای اعتبارسنجی (۴۰۰) می‌دهد.

---

### ۵.۴ حذف — `DELETE /cart/items/:variantId`

**پاسخ ۲۰۰:** `data` = `Cart`

**خطاها:**
- `404` سبد خالی: `Cart is empty`
- `404` آن variant در سبد نیست: `Variant is not in the cart`
- `403` CSRF.

---

## ۶. جریان کامل فرانت

### ۶.۱ راه‌اندازی (bootstrap)

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// (۱) برای همه‌ی بازدیدکننده‌ها، حتی مهمان: کوکی CSRF را بگیر
export async function bootstrapCsrf(): Promise<void> {
  await fetch(`${API}/auth/csrf`, { credentials: 'include' });
}

// (۲) توکن مهمان را یک‌بار بساز و نگه دار
export function getOrCreateGuestToken(): string {
  let token = localStorage.getItem('cart_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('cart_token', token);
  }
  return token;
}
```

### ۶.۲ کلاینت درخواست

```ts
function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody) {
    super(body?.message ?? 'Request failed');
  }
}

export async function cartFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');

  // توکن CSRF را همان لحظه از کوکی بخوان (هرگز cache نکن!)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = readCookie('csrf_token');
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const guest = localStorage.getItem('cart_token');
  if (guest) headers.set('X-Cart-Token', guest);

  const res = await fetch(`${API}${path}`, { ...init, method, headers, credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body.data as T;
}
```

### ۶.۳ عملیات سبد

```ts
const getCart = () => cartFetch<Cart>('/cart');

const addItem = (variantId: number, quantity = 1) =>
  cartFetch<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });

const updateItem = (variantId: number, quantity: number) =>
  cartFetch<Cart>(`/cart/items/${variantId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });

const removeItem = (variantId: number) =>
  cartFetch<Cart>(`/cart/items/${variantId}`, { method: 'DELETE' });
```

> هر سه‌ی mutation سبد کامل و به‌روز را برمی‌گردانند. همان را در state بگذار؛ لازم نیست دوباره `GET /cart` بزنی.

### ۶.۴ بعد از لاگین (مرج)

```ts
async function onLoggedIn(): Promise<void> {
  // CSRF در لاگین عوض شده؛ چون cartFetch آن را تازه می‌خواند، مشکلی نیست.
  await getCart();                       // این درخواست با X-Cart-Token می‌رود → مرج انجام می‌شود
  localStorage.removeItem('cart_token'); // سبد مهمان مصرف شد
}
```

### ۶.۵ بعد از خروج (logout)

```ts
function onLoggedOut(): void {
  localStorage.removeItem('cart_token');       // توکن قبلی دیگر معتبر نیست
  localStorage.setItem('cart_token', crypto.randomUUID()); // اگر سبد مهمان تازه می‌خواهی
}
```

---

## ۷. تله‌ها (این‌ها باید سمت فرانت درست شوند) ⚠️

### تله ۱ — بدون CSRF، مهمان هم ۴۰۳ می‌گیرد
`GET /auth/csrf` را در bootstrap برای **همه** صدا بزن، نه فقط قبل از لاگین. وگرنه اولین `POST /cart/items` مهمان با `403 Invalid CSRF token` می‌خورد. کوکی CSRF به auth گره نخورده و برای همه ست می‌شود.

### تله ۲ — توکن CSRF را cache نکن
کوکی `csrf_token` در لاگین، `/auth/otp/verify`، `/auth/refresh` و لاگ‌اوت **rotate** می‌شود (و پاسخ بدنه‌شان توکن جدید را برنمی‌گرداند). اگر توکن را در state/axios-default نگه داری، بعد از هرکدام از این‌ها stale می‌شود → `403`. همیشه لحظه‌ی درخواست از `document.cookie` بخوان.

### تله ۳ — دقیقاً بعد از لاگین، اولین درخواست سبد همان درخواست مرج است
اگر با توکن CSRF قدیمی بزنی، ۴۰۳ می‌خورد و **مرج انجام نمی‌شود** و کاربر فکر می‌کند سبدش پرید. قاعده: CSRF را تازه بخوان (بند ۱) و `X-Cart-Token` را در همان اولین درخواست بعد از لاگین بفرست (بند ۶.۴).

### تله ۴ — انقضای access token کاربر را بی‌صدا مهمان می‌کند
`OptionalAuthGuard` اگر توکن منقضی/نامعتبر باشد خطا نمی‌دهد و درخواست را **مهمان** فرض می‌کند. یعنی کاربر لاگین‌شده‌ای که access tokenش (۱۵ دقیقه) منقضی شده:
- اگر `X-Cart-Token` بفرستد → آیتم در سبد مهمان می‌رود؛
- اگر نفرستد → روی mutation خطای `400` می‌گیرد.

راه‌حل: قبل از عملیات سبد مطمئن شو نشست تازه است (رفرش proactive یا هندل ۴۰۱ روی بقیه‌ی endpointها)، و برای کاربر لاگین‌شده هم یک fallback توکن مهمان داشته باش، یا حداقل ۴۰۰ را به‌عنوان «نشست منقضی» تفسیر کن و رفرش بزن.

### تله ۵ — چند تب، یک کوکی CSRF
کوکی `csrf_token` بین تب‌ها مشترک است. اگر یک تب لاگین/رفرش کند، تب دیگر با توکن cache‌شده ۴۰۳ می‌گیرد. فقط با «خواندن تازه از کوکی» حل می‌شود.

### تله ۶ — رفرش خودکار توکن (interceptor) CSRF را عوض می‌کند
اگر interceptor روی ۴۰۱ خودش `/auth/refresh` بزند و درخواست را retry کند، CSRF عوض شده. قبل از retry، توکن CSRF را از کوکی دوباره بخوان.

### تله ۷ — `X-Cart-Token` حتماً UUID باشد
مقدار غیر-UUID → `400`. با `crypto.randomUUID()` بساز. هرگز در URL یا query نگذار (لاگ می‌شود)؛ همیشه هدر. این توکن یک **رمز حامل** است؛ مثل پسورد با آن رفتار کن: لاگ نکن، در analytics نفرست.

### تله ۸ — سبد مهمان در `localStorage` است
اگر کاربر storage را پاک کند یا حالت خصوصی باشد، سبد مهمان از دست می‌رود (سمت بک هم رکوردش بی‌استفاده می‌ماند). توکن را پایدار نگه دار و در رویدادهای `storage` بین تب‌ها همگام کن.

### تله ۹ — CORS و Origin
- فرانت باید `credentials: 'include'` بزند تا کوکی‌ها بروند.
- `assertOrigin` در CSRF، هدر `Origin` را با `APP_ORIGIN` بک چک می‌کند. اگر origin فرانت با `APP_ORIGIN` یکی نباشد → `403 Invalid origin` (برای همه‌ی mutationها، نه فقط سبد).
- اگر فرانت و API روی سایت‌های متفاوت‌اند (نه فقط پورت متفاوت)، با `SameSite=Lax` پیش‌فرض کوکی ردوبدل نمی‌شود؛ باید `SameSite=None; Secure` ست شود (تنظیمات env سمت بک).

### تله ۱۰ — قیمت **لحظه‌ای** است، نه snapshot
`price`/`compareAtPrice`/`stock` هر لحظه از variant خوانده می‌شوند. قیمت بین دو درخواست ممکن است عوض شود و `subtotal` هم به‌همین‌خاطر تغییر کند. قیمت‌ها را cache نکن و بعد از هر پاسخ دوباره render کن.

### تله ۱۱ — عملیات روی `variantId` است، نه `productId`
`PATCH`/`DELETE` کلیدشان `variantId` است. یک محصول با چند variant = چند آیتم مستقل. هنگام حذف/ویرایش، `variant.id` را از `item.variantId` بفرست.

### تله ۱۲ — محدودیت موجودی
افزودن/ویرایش اگر از `stock` بگذرد `400` می‌دهد. اگر کاربر تعداد را سریع بالا ببرد، پیام خطا را نشان بده و مقدار را clamp کن. توجه: در **مرج** تعدادها جمع می‌شوند و ممکن است موقتاً از stock بگذرد؛ UI باید از پاسخ آگاه بماند و اجازه‌ی نهایی‌شدن سفارش را تا اصلاح تعداد ندهد.

### تله ۱۳ — تفاوت ۴۰۴ها را از پیام تشخیص بده
`Cart is empty` / `Variant is not in the cart` / `Variant not found` هر سه ۴۰۴ هستند ولی معنای متفاوتی دارند. پیام را map کن.

### تله ۱۴ — احراز هویت «نرم» است؛ ۴۰۱ انتظار نداشته باش
روی `/cart` با توکن خراب، `401` نمی‌گیری؛ درخواست مهمان تلقی می‌شود. برای تشخیص لاگین بودن، از `GET /auth/me` استفاده کن و به نبود `401` روی سبد تکیه نکن.

### تله ۱۵ — دوبار کلیک / درخواست هم‌زمان
افزودن روی بک atomic است (upsert)؛ پس دو کلیک سریع = جمع شدن تعداد، نه خطا. برای UX، دکمه را موقتاً disable کن یا درخواست‌ها را coalesce کن.

---

## ۸. چک‌لیست فرانت

- [ ] `GET /auth/csrf` در bootstrap برای همه‌ی بازدیدکننده‌ها (مهمان هم).
- [ ] ساخت و نگه‌داری `X-Cart-Token` به‌صورت UUID در `localStorage`.
- [ ] ارسال `X-Cart-Token` در همه‌ی درخواست‌های سبد.
- [ ] خواندن تازه‌ی `csrf_token` از کوکی برای هر mutation (بدون cache).
- [ ] بعد از login/otpVerify/refresh، CSRF را دوباره sync کن؛ اولین درخواست سبد را با `X-Cart-Token` بزن (مرج)، بعد توکن مهمان را پاک کن.
- [ ] `credentials: 'include'` و هم‌راستایی origin با `APP_ORIGIN` بک.
- [ ] خواندن payload از `body.data` و خطا از `body.message` / `body.details`.
- [ ] مدیریت proactive/refresh نشست تا کاربر با توکن منقضی بی‌صدا مهمان نشود.
- [ ] استفاده از `variantId` برای PATCH/DELETE و فرستادن `quantity >= 1`؛ حذف فقط با DELETE.
- [ ] خواندن `stock` از پاسخ و clamp کردن تعداد؛ نمایش پیام‌های ۴۰۰ موجودی.
- [ ] در نظر گرفتن چند تب (storage event) و قیمت لحظه‌ای.

---

## ۹. جدول مرجع سریع

| متد | مسیر | هویت | CSRF | موفق | `data` |
|---|---|---|---|---|---|
| GET | `/cart` | auth یا `X-Cart-Token` | نه | 200 | `Cart` |
| POST | `/cart/items` | auth یا `X-Cart-Token` | بله | 201 | `Cart` |
| PATCH | `/cart/items/:variantId` | auth یا `X-Cart-Token` | بله | 200 | `Cart` |
| DELETE | `/cart/items/:variantId` | auth یا `X-Cart-Token` | بله | 200 | `Cart` |

**بدنه‌های مجاز:** `POST { variantId, quantity? }` — `PATCH { quantity }` — حداقل هر دو `quantity` برابر ۱.
