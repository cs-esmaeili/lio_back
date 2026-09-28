# راهنمای شرایط پرداخت (Payment Eligibility) — برای فرانت‌اند

این سند می‌گوید **قبل از پرداخت چه شرایطی باید برقرار باشد** و فرانت چطور بفهمد کدام شرط برقرار نیست.

> ⚠️ **تغییر در دو روت موجود** — هیچ روت جدیدی اضافه نشده است:
>
> | روت | تغییر |
> |---|---|
> | `GET /checkout` | فیلد جدید `paymentEligibility` به `data` اضافه شد |
> | `POST /payments` | اگر شرایط برقرار نباشد، **`409`** با `code: "PAYMENT_NOT_ALLOWED"` و آرایه‌ی `reasons` برمی‌گردد (قبلاً چنین خطایی وجود نداشت) |
>
> سندهای مرتبط: `docs/checkout-api.md` و `docs/payment-api.md`.

---

## ۱. شرط فعلی

در حال حاضر **فقط یک شرط** داریم:

| کد دلیل | شرط | فیلدهای مرتبط |
|---|---|---|
| `PROFILE_INCOMPLETE` | کاربر باید **نام**، **نام خانوادگی** و **کد ملی** خودش را ثبت کرده باشد | `name`, `lastName`, `nationalCode` |

- اگر یکی از این فیلدها `null` یا خالی باشد، شرط برقرار نیست.
- **آدرس جزو این شرط نیست**؛ آدرس در مرحله‌ی checkout انتخاب و در `POST /payments` اعتبارسنجی می‌شود.
- **شرط‌های بیشتر بعداً اضافه می‌شوند.** پس فرانت باید روی `code` سوییچ کند و فرض نکند همیشه فقط `PROFILE_INCOMPLETE` وجود دارد.

---

## ۲. شکل پاسخ موفق (بدون تغییر ساختار envelope)

```jsonc
{
  "statusCode": 200,
  "data": { /* Checkout */ },
  "message": "OK"
}
```

فیلد جدید در `data`:

```jsonc
{
  "paymentEligibility": {
    "eligible": false,
    "reasons": [
      {
        "code": "PROFILE_INCOMPLETE",
        "message": "Complete your profile (name, lastName and nationalCode) before paying",
        "fields": ["nationalCode"]
      }
    ]
  }
}
```

- `eligible: true` → `reasons` آرایه‌ی خالی `[]` است.
- `eligible: false` → هر آیتم یک شرط برقرارنشده است.
- `fields` فقط وقتی می‌آید که دلیل به فیلدهای مشخصی اشاره کند (اختیاری).

### انواع (TypeScript)

```ts
export type PaymentEligibilityReasonCode =
  | 'PROFILE_INCOMPLETE'; // ممکن است در آینده مقادیر بیشتری اضافه شود

export interface PaymentEligibilityReason {
  code: PaymentEligibilityReasonCode | string; // برای آینده string بگیرت امن‌تر است
  message: string;
  fields?: string[];
}

export interface PaymentEligibility {
  eligible: boolean;
  reasons: PaymentEligibilityReason[];
}

// افزوده‌شده به Checkout:
export interface Checkout {
  // ... فیلدهای قبلی ...
  paymentEligibility: PaymentEligibility;
}
```

---

## ۳. خطای `POST /payments` وقتی شرط برقرار نیست

**`409 Conflict`** با این بدنه:

```jsonc
{
  "statusCode": 409,
  "message": "Payment requirements are not met",
  "code": "PAYMENT_NOT_ALLOWED",
  "reasons": [
    {
      "code": "PROFILE_INCOMPLETE",
      "message": "Complete your profile (name, lastName and nationalCode) before paying",
      "fields": ["name", "nationalCode"]
    }
  ]
}
```

- `code` سطح‌بالا و `reasons` **فقط در همین خطای جدید** برگردانده می‌شوند؛ بقیه‌ی خطاها همان `{ statusCode, message }` یا `{ statusCode, message, details }` قبلی هستند.
- در این حالت **هیچ سفارشی ساخته نمی‌شود** و **هیچ موجودی‌ای رزرو نمی‌شود**؛ پس کاربر می‌تواند بعد از تکمیل پروفایل دوباره تلاش کند.
- ترتیب بررسی در `POST /payments`: اول سبد خالی (`400`)، بعد شرایط پرداخت (`409`)، بعد آدرس (`404`).

---

## ۴. جریان پیشنهادی فرانت

1. روی بارگذاری صفحه‌ی checkout، `GET /checkout` را بزن.
2. اگر `data.itemCount === 0` → حالت «سبد خالی».
3. اگر `data.paymentEligibility.eligible === false`:
   - دکمه‌ی **پرداخت را غیرفعال** کن.
   - `reasons` را به متن کاربرفهم نگاشت کن (کلید = `code`، نه `message`).
   - اگر `code === 'PROFILE_INCOMPLETE'` بود، دکمه/لینک «تکمیل پروفایل» بگذار که کاربر را به صفحه‌ی پروفایل ببرد (`GET`/`PATCH /profile` — راهنما: `docs/profile-api.md`).
4. هنگام کلیک پرداخت، باز هم `POST /payments` را بزن؛ اگر `409` گرفتی، همان `reasons` را نمایش بده (این خطا حالت رقابتی و تغییر بین دو درخواست را هم پوشش می‌دهد).

> یعنی یک‌بار پیش از کلیک (روی `GET /checkout`) و یک‌بار هم روی خود کلیک (`POST /payments`) چک می‌شود. این عمدی است: شرط ممکن است بین دو درخواست عوض شود.

---

## ۵. کلاینت نمونه

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  code?: string;
  reasons?: Array<{ code: string; message: string; fields?: string[] }>;
  details?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody) {
    super(body?.message ?? 'Request failed');
  }
}

/** نگاشت کدِ دلیل به متنِ نمایشی (فارسی). */
const ELIGIBILITY_MESSAGES: Record<string, string> = {
  PROFILE_INCOMPLETE: 'برای پرداخت، ابتدا نام، نام خانوادگی و کد ملی خود را در پروفایل ثبت کنید.',
};

function reasonText(reason: { code: string; message: string }): string {
  return ELIGIBILITY_MESSAGES[reason.code] ?? reason.message;
}

// --- روی بارگذاری checkout ---
async function getCheckout() {
  const res = await fetch(`${API}/checkout`, { headers: { Accept: 'application/json' }, credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (res.status === 401) throw new Error('LOGIN_REQUIRED');
  if (!res.ok) throw new ApiError(res.status, body);

  const checkout = body.data;
  const canPay: boolean = checkout.paymentEligibility.eligible;
  const messages: string[] = checkout.paymentEligibility.reasons.map(reasonText);
  return { checkout, canPay, messages };
}

// --- روی کلیک پرداخت ---
async function startPayment(addressId: number, csrfToken: string) {
  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrfToken },
    credentials: 'include',
    body: JSON.stringify({ addressId }),
  });
  const body = await res.json().catch(() => null);

  if (res.status === 401) throw new Error('LOGIN_REQUIRED');
  if (res.status === 409 && body?.code === 'PAYMENT_NOT_ALLOWED') {
    // شرایط پرداخت برقرار نیست
    throw new ApiError(res.status, body); // body.reasons را نمایش بده
  }
  if (!res.ok) throw new ApiError(res.status, body);

  window.location.assign(body.data.paymentUrl);
}
```

---

## ۶. تله‌ها ⚠️

1. **روی `code` سوییچ کن، نه روی `message`:** متن پیام ممکن است تغییر کند یا انگلیسی باشد. `code` پایدار است.
2. **فقط `PROFILE_INCOMPLETE` را هندل نکن:** در آینده `reasons` می‌تواند بیش از یک آیتم یا کدهای جدید داشته باشد. اگر کدی را نمی‌شناسی، `message` خام را نشان بده.
3. **`eligible` را از پاسخ checkout بخوان، خودت محاسبه نکن:** فرانت نباید `name`/`lastName`/`nationalCode` را برای تشخیص دوباره چک کند (منبع حقیقت بک است).
4. **`409` اینجا با `403` فرق دارد:** `403` مربوط به CSRF/دسترسی است؛ `409` با `code: PAYMENT_NOT_ALLOWED` مربوط به شرایط پرداخت است.
5. **`409` سفارش نمی‌سازد:** نیازی به پاک‌سازی یا retry خاص نیست؛ بعد از رفع شرط دوباره `POST /payments` بزن.
6. **آدرس شرطِ فعلی نیست:** حتی اگر `paymentEligibility.eligible === true` باشد، `addressId` نامعتبر → `404` و آدرس اجباری است.
7. **`fields` اختیاری است:** همیشه وجود ندارد؛ اگر بود برای هایلایت کردن فیلدهای پروفایل استفاده کن.

---

## ۷. جدول مرجع سریع

| متد | مسیر | چه چیزی | موفق | خطای مربوط |
|---|---|---|---|---|
| GET | `/checkout` | فیلد `paymentEligibility` در `data` | 200 | 401 |
| POST | `/payments` | گیت شرایط پرداخت | 201 | 409 `PAYMENT_NOT_ALLOWED` + `reasons` |

**کدهای دلیل فعلی:**

| `code` | معنی | `fields` ممکن |
|---|---|---|
| `PROFILE_INCOMPLETE` | نام/نام خانوادگی/کد ملی کامل نیست | `name`, `lastName`, `nationalCode` |
