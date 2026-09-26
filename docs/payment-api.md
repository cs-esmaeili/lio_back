# راهنمای پرداخت آنلاین (Payment API) — برای فرانت‌اند

این سند قرارداد دو روت جریان پرداخت است:

`POST /payments` سفارش را از سبد کاربر می‌سازد، موجودی را رزرو می‌کند، تراکنش پرداخت را در دیتابیس ثبت می‌کند و **لینک درگاه بانک** را برمی‌گرداند.

`GET /payments/callback` آدرس بازگشت بانک است (نه فرانت). بانک کاربر را به این آدرس می‌فرستد، بک تراکنش را تایید می‌کند و سپس کاربر را به **صفحه‌ی نتیجه در فرانت** ریدایرکت می‌کند.

> URL پایه: بدون prefix؛ مسیرها مستقیم `/payments` و `/payments/callback`. مستندات Swagger روی `/docs`.

---

## ۱. تصویر کلی جریان

```text
فرانت                        بک                                    بانک
  |                           |                                      |
  |-- POST /payments -------->|                                      |
  |   (Cookie + CSRF)         | ساخت سفارش + رزرو موجودی + payment   |
  |                           |-- request to gateway --------------> |
  |<-- { paymentUrl } --------|                                      |
  |                                                                  |
  |-- window.location = paymentUrl --------------------------------->|
  |                                                                  |
  |                            |<-- GET /payments/callback (Authority, Status)
  |                            |   verify + به‌روزرسانی سفارش و پرداخت
  |<-- 302 redirect به صفحه‌ی نتیجه فرانت ----------------------------|
  |   (status, orderId, orderNumber, refId, reason)
```

نکته‌ی کلیدی: فرانت هرگز خودش `/payments/callback` را صدا نمی‌زند؛ آن را فقط بانک صدا می‌زند و پاسخش یک **ریدایرکت ۳۰۲** است، نه JSON.

---

## ۲. قالب پاسخ

`POST /payments` مثل بقیه‌ی endpointها envelope دارد:

```jsonc
{
  "statusCode": 201,
  "data": { /* CreatePayment */ },
  "message": "Created"
}
```

پاسخ خطا (از `AllExceptionsFilter`):

```jsonc
{ "statusCode": 400, "message": "Cart is empty" }
```

`GET /payments/callback` هیچ JSON برنمی‌گرداند؛ پاسخش `302 Location: <صفحه‌ی نتیجه فرانت>` است.

---

## ۳. احراز هویت

| روت | هویت | CSRF |
|---|---|---|
| `POST /payments` | کوکی نشست کاربر (اجباری) | مورد نیاز (`X-CSRF-Token`) |
| `GET /payments/callback` | عمومی (بدون نشست) | معنی ندارد |

برای `POST` مثل همیشه `credentials: 'include'` و هدر `X-CSRF-Token` (از `GET /auth/csrf`) را بفرست.

---

## ۴. انواع (TypeScript)

```ts
export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
}

export interface CreatePaymentRequest {
  addressId: number; // آدرس ذخیره‌شده‌ی کاربر؛ از addresses در GET /checkout
}

export interface CreatePayment {
  orderId: number;
  orderNumber: string;
  amount: number;      // مبلغ قابل پرداخت به تومان
  provider: string;    // نام درگاه فعال؛ فعلاً "zarinpal"
  paymentUrl: string;  // کاربر را به این آدرس ریدایرکت کن
}
```

---

## ۵. Endpointها

### `POST /payments`

- **موفق:** `201` و `data` = `CreatePayment`.
- **خطاها:**
  - `400` سبد خالی (`Cart is empty`)، `addressId` نامعتبر، یا موجودی کافی نبودن یک قلم.
  - `401` بدون نشست معتبر.
  - `404` آدرس پیدا نشد یا متعلق به کاربر نیست.
  - `502` درگاه درخواست را رد کرد. در این حالت سفارش **لغو** و موجودی **آزاد** شده است.

```bash
curl -s -X POST http://localhost:3000/payments \
  -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <token>' \
  -b 'session=...' \
  -d '{"addressId": 1}'
```

پاسخ نمونه:

```jsonc
{
  "statusCode": 201,
  "data": {
    "orderId": 42,
    "orderNumber": "ORD-20260926-4F2A9C10BD",
    "amount": 3388000,
    "provider": "zarinpal",
    "paymentUrl": "https://www.zarinpal.com/pg/StartPay/00000000000000000000000000000000000000"
  },
  "message": "Created"
}
```

### `GET /payments/callback`

- بانک کاربر را با کوئری‌استرینگ `Authority` و `Status` به این آدرس می‌فرستد (زرین‌پال: `Status=OK` یعنی پرداخت انجام شده).
- بک خودش `verify` می‌زند، سفارش/پرداخت را نهایی می‌کند و با `302` کاربر را به `PAYMENT_FRONTEND_RESULT_URL` می‌برد.
- فرانت این روت را صدا نمی‌زند.

پارامترهای اضافه‌شده به صفحه‌ی نتیجه:

| پارامتر | توضیح |
|---|---|
| `status` | `success` یا `failed` |
| `orderId` | شناسه‌ی سفارش (در بعضی خطاها ممکن است نباشد) |
| `orderNumber` | شماره‌ی سفارش |
| `refId` | شماره‌ی پیگیری بانک؛ فقط در موفقیت و اگر بانک داده باشد |
| `reason` | فقط در `failed`؛ یکی از `missing_authority`, `not_found`, `canceled`, `verify_failed`, `not_payable` |

نمونه‌ی ریدایرکت موفق:

```text
https://front.local/payment/result?status=success&orderId=42&orderNumber=ORD-20260926-4F2A9C10BD&refId=123456789
```

نمونه‌ی ریدایرکت ناموفق (کاربر انصراف داده):

```text
https://front.local/payment/result?status=failed&orderId=42&orderNumber=ORD-20260926-4F2A9C10BD&reason=canceled
```

---

## ۶. جریان فرانت

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function startPayment(addressId: number, csrfToken: string): Promise<void> {
  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ addressId }),
  });

  const body = await res.json().catch(() => null);
  if (res.status === 401) throw new Error('LOGIN_REQUIRED');
  if (!res.ok) throw new Error(body?.message ?? 'Request failed');

  // ریدایرکت کامل مرورگر (نه fetch): کاربر باید به درگاه برود.
  window.location.assign((body.data as CreatePayment).paymentUrl);
}
```

صفحه‌ی نتیجه (`/payment/result`) از کوئری‌استرینگ می‌خواند:

```ts
const params = new URLSearchParams(window.location.search);
const status = params.get('status'); // 'success' | 'failed'
const refId = params.get('refId');
const orderNumber = params.get('orderNumber');
const reason = params.get('reason');
```

- اگر `status === 'success'` صفحه‌ی موفقیت با `refId` و `orderNumber` نشان بده (و مثلاً سبد را دوباره از `GET /cart` بگیر، چون در موفقیت خالی شده است).
- وگرنه صفحه‌ی ناموفق با پیام مناسب `reason` و دکمه‌ی «تلاش دوباره» که کاربر را به سبد/checkout برگرداند.

---

## ۷. تله‌ها ⚠️

1. **ریدایرکت با `window.location` نه `fetch`:** مقدار `paymentUrl` را با fetch صدا نزن؛ مرورگر باید کامل به درگاه برود.
2. **`/payments/callback` فقط برای بانک است:** آن را در فرانت صدا نزن و روی آن fetch نزن؛ پاسخش HTML/ریدایرکت است.
3. **سبد خالی خطا می‌دهد:** برخلاف `GET /checkout`، اینجا `400` می‌گیری. قبل از پرداخت از `itemCount > 0` مطمئن شو.
4. **آدرس اجباری است:** `addressId` باید یکی از `addresses` کاربر باشد؛ وگرنه `404`. آدرس روی سفارش snapshot می‌شود و بعداً تغییر پروفایل، سفارش را عوض نمی‌کند.
5. **قیمت/موجودی لحظه‌ای است:** مبلغ نهایی همان لحظه‌ی `POST` محاسبه و روی سفارش قفل می‌شود؛ به اعداد قبلی `GET /checkout` اکتفا نکن. اگر موجودی تمام شده باشد `400` و پیام `Not enough stock for <sku>` می‌گیری.
6. **موجودی همین‌جا رزرو می‌شود:** بعد از `POST` موفق، موجودی کسر شده است. اگر پرداخت ناموفق/لغو شود، موجودی آزاد و سفارش `CANCELED` می‌شود.
7. **سبد فقط در موفقیت خالی می‌شود:** اگر پرداخت شکست بخورد، سبد دست‌نخورده می‌ماند تا کاربر دوباره تلاش کند. پس روی صفحه‌ی موفقیت، سبد را دوباره از سرور بخوان.
8. **دوبار زدن `POST` دو سفارش می‌سازد:** هر درخواست یک سفارش جدید می‌سازد. دکمه‌ی پرداخت را در حین درخواست غیرفعال کن (debounce).
9. **callback ایدمپوتنت است:** اگر بانک/مرورگر دوباره callback را بزند، سفارش دوباره پرداخت نمی‌شود و همان نتیجه‌ی موفق برمی‌گردد.
10. **کلید مبلغ تومان است:** `amount` به تومان است؛ تبدیل به ریال کار درگاه است، فرانت کاری نکند.
11. **`PAYMENT_FRONTEND_RESULT_URL` روی بک تنظیم می‌شود:** باید absolute باشد و به صفحه‌ی نتیجه در فرانت اشاره کند. `PAYMENT_CALLBACK_URL` هم باید از دید مرورگر کاربر قابل دسترس باشد (نه `localhost`، در production).

---

## ۸. چک‌لیست فرانت

- [ ] کاربر لاگین است و از `GET /checkout`، `addresses` و `defaultAddressId` را گرفته.
- [ ] از `itemCount > 0` مطمئن شو.
- [ ] `POST /payments` با `credentials: 'include'` و هدر `X-CSRF-Token`.
- [ ] در موفقیت، `paymentUrl` را با `window.location.assign` باز کن.
- [ ] در حین درخواست، دکمه را غیرفعال نگه دار.
- [ ] روی `/payment/result` پارامترهای `status`/`reason`/`refId`/`orderNumber` را از query بخوان.
- [ ] در موفقیت، سبد را دوباره از `GET /cart` بگیر (خالی شده است).
- [ ] در ناموفق، پیام `reason` را به متن کاربرفهم نگاشت کن.

---

## ۹. جدول مرجع سریع

| متد | مسیر | هویت | CSRF | موفق | `data` / نتیجه |
|---|---|---|---|---|---|
| POST | `/payments` | نشست کاربر (اجباری) | بله | 201 | `CreatePayment` |
| POST | `/payments` | — | — | 400 | سبد خالی / آدرس نامعتبر / کمبود موجودی |
| POST | `/payments` | — | — | 401 | بدون نشست |
| POST | `/payments` | — | — | 404 | آدرس پیدا نشد |
| POST | `/payments` | — | — | 502 | رد درخواست توسط درگاه (سفارش لغو شد) |
| GET | `/payments/callback` | عمومی (بانک) | — | 302 | ریدایرکت به صفحه‌ی نتیجه فرانت |
