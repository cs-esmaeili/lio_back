# راهنمای صفحه‌ی پرداخت (Checkout API) — برای فرانت‌اند

این سند قرارداد یک endpoint است که **همه‌ی داده‌ی لازم برای رندر صفحه‌ی checkout** را در یک درخواست برمی‌گرداند: آیتم‌های سبد با قیمت لحظه‌ای، breakdown قیمت (جمع، ارسال، تخفیف، مبلغ قابل پرداخت)، تنظیمات ارسال، اطلاعات تماس کاربر، آدرس‌ها و درگاه پرداخت فعال.

> این endpoint فقط **نمایش** است و هیچ سفارشی نمی‌سازد. ساخت سفارش، رزرو موجودی و شروع پرداخت در `POST /payments` انجام می‌شود (راهنما: `docs/payment-api.md`).

> URL پایه: بدون prefix؛ مسیر مستقیم `/checkout`. مستندات Swagger روی `/docs`.

---

## ۱. قالب پاسخ

مثل بقیه‌ی endpointها، پاسخ موفق داخل envelope است:

```jsonc
{
  "statusCode": 200,
  "data": { /* Checkout */ },
  "message": "OK"
}
```

پس همیشه `body.data` را بخوان.

پاسخ خطا (از `AllExceptionsFilter`):

```jsonc
{ "statusCode": 401, "message": "Unauthorized" }
```

---

## ۲. احراز هویت (مهم)

`GET /checkout` **فقط برای کاربر لاگین‌شده** است. مالک سبد همان کاربر نشست است؛ هیچ توکن مهمانی پذیرفته نمی‌شود.

- بدون کوکی نشست معتبر → **`401 Unauthorized`**. فرانت باید کاربر را به لاگین ببرد.
- خرید مهمان (guest checkout) وجود ندارد؛ آدرس و اطلاعات تماس از حساب کاربری خوانده می‌شود.

| هدر | اجباری؟ | توضیح |
|---|---|---|
| `Cookie: session` | بله | نشست کاربر. |
| `X-CSRF-Token` | نه | `GET` معاف است؛ CSRF لازم نیست. |

> `credentials: 'include'` را در همه‌ی درخواست‌ها بزن تا کوکی نشست فرستاده شود.

> مرج سبد مهمان کارِ endpointهای cart است، نه checkout: بعد از لاگین یک‌بار `GET /cart` را با `X-Cart-Token` بزن (بند ۶.۴ در `docs/cart-api.md`) و بعد checkout را صدا بزن.

---

## ۳. انواع (TypeScript)

```ts
export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
}

export interface CheckoutProduct {
  id: number;
  name: string;
  slug: string;
  image: string | null;   // URL عکس اصلی محصول
}

export interface CheckoutVariant {
  id: number;
  sku: string;
  price: number;              // قیمت فروش لحظه‌ای
  compareAtPrice: number | null;
  stock: number;
}

export interface CheckoutItem {
  variantId: number;
  quantity: number;
  lineTotal: number;          // price * quantity
  discount: number;           // (compareAtPrice - price) * quantity → صفر اگر نبود
  product: CheckoutProduct;
  variant: CheckoutVariant;
}

export interface CheckoutShipping {
  enabled: boolean;           // آیا ارسال هزینه دارد
  cost: number;               // هزینه‌ی ثابت ارسال
  freeOver: number;           // از این مبلغ سبد به بالا ارسال رایگان؛ ۰ = قاعده غیرفعال
}

export interface CheckoutCustomer {
  id: number;
  phone: string;              // شناسه‌ی ورود = شماره موبایل
  name: string | null;
  lastName: string | null;
}

export interface CheckoutAddress {
  id: number;
  title: string;
  address: string;
  postalCode: string;
  isMain: boolean;
  locationId: number;
  location: { id: number; province: string; city: string };
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPayment {
  provider: string;           // درگاه فعال؛ فعلاً "zarinpal"
}

export interface Checkout {
  items: CheckoutItem[];
  itemCount: number;          // جمع همه‌ی quantityها
  distinctItemCount: number;  // تعداد variantهای متمایز = items.length
  subtotal: number;           // جمع lineTotalها
  shippingCost: number;       // هزینه‌ی ارسال این سفارش (پس از اعمال freeOver)
  orderDiscount: number;      // تخفیف سطح سفارش؛ فعلاً همیشه ۰ (کوپن نداریم)
  totalDiscount: number;      // «سود شما از خرید» — فقط نمایشی
  total: number;              // مبلغ قابل پرداخت
  shipping: CheckoutShipping;
  customer: CheckoutCustomer;
  addresses: CheckoutAddress[];   // default اول لیست
  defaultAddressId: number | null;
  payment: CheckoutPayment;
}
```

**فرمول مبلغ:**

```text
total = subtotal + shippingCost - orderDiscount
```

- `totalDiscount` روی `total` اثر ندارد (چون `price` از قبل قیمت فروش است و `compareAtPrice` فقط مرجع خط‌خورده است).
- `orderDiscount` فعلاً همیشه `0` است؛ برای آینده‌ی کوپن در قرارداد هست.

---

## ۴. Endpoint

### `GET /checkout`

- **موفق:** `200` و `data` = `Checkout`.
- **سبد خالی:** همچنان `200` با `items: []` و همه‌ی مبالغ `0`؛ **خطا نمی‌دهد** (مثل `GET /cart`). فرانت باید حالت «سبد خالی» را از `itemCount === 0` تشخیص دهد.
- **خطا:** `401` بدون نشست معتبر.

```bash
curl -s http://localhost:3000/checkout -b 'session=...'
```

پاسخ نمونه (خلاصه):

```jsonc
{
  "statusCode": 200,
  "data": {
    "items": [
      {
        "variantId": 3744,
        "quantity": 2,
        "lineTotal": 3388000,
        "discount": 1000000,
        "product": { "id": 3342, "name": "کمل کامپکت آبی ایرانی", "slug": "kamel-compact-abi", "image": "/uploads/images/product-1.png" },
        "variant": { "id": 3744, "sku": "SEED-SKU-1-1", "price": 1694000, "compareAtPrice": 1744000, "stock": 12 }
      }
    ],
    "itemCount": 2,
    "distinctItemCount": 1,
    "subtotal": 3388000,
    "shippingCost": 0,
    "orderDiscount": 0,
    "totalDiscount": 1000000,
    "total": 3388000,
    "shipping": { "enabled": true, "cost": 0, "freeOver": 0 },
    "customer": { "id": 1, "phone": "09123456789", "name": "Ali", "lastName": "Rezaei" },
    "addresses": [
      {
        "id": 1, "title": "Home", "address": "خیابان ولیعصر، پلاک ۱۲", "postalCode": "1234567890",
        "isMain": true, "locationId": 12,
        "location": { "id": 12, "province": "Tehran", "city": "Tehran" },
        "createdAt": "2026-09-02T12:00:00.000Z", "updatedAt": "2026-09-02T12:00:00.000Z"
      }
    ],
    "defaultAddressId": 1,
    "payment": { "provider": "zarinpal" }
  },
  "message": "OK"
}
```

---

## ۵. جریان فرانت

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function getCheckout(): Promise<Checkout> {
  const res = await fetch(`${API}/checkout`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  const body = await res.json().catch(() => null);

  if (res.status === 401) throw new Error('LOGIN_REQUIRED');
  if (!res.ok) throw new Error(body?.message ?? 'Request failed');

  return body.data as Checkout;
}
```

- پیش‌فرم فرم تماس با `customer` (شماره همیشه هست؛ `name`/`lastName` ممکن است `null` باشند).
- انتخاب آدرس با `addresses` و پیش‌انتخاب `defaultAddressId`.
- پیش از کلیک پرداخت، از `itemCount > 0` مطمئن شو.

---

## ۶. تله‌ها ⚠️

1. **فقط لاگین:** بدون نشست `401` می‌گیری؛ `GET /cart` روی مهمان `401` نمی‌دهد ولی checkout می‌دهد. به `401` واکنش «برو به لاگین» بده، نه «کاربر مهمان».
2. **مرج سبد مهمان را قبل از checkout انجام بده:** checkout توکن مهمان نمی‌پذیرد. اگر کاربر مهمان سبد داشته، در اولین درخواست بعد از لاگین `GET /cart` را با `X-Cart-Token` بزن تا مرج شود، بعد checkout را صدا بزن.
3. **قیمت لحظه‌ای است، نه snapshot:** `price`/`compareAtPrice`/`stock` هر لحظه از variant خوانده می‌شوند. بین `GET /checkout` و پرداخت ممکن است عوض شوند؛ قیمت را cache نکن و در لحظه‌ی نهایی‌سازی دوباره از بک بگیر.
4. **موجودی اینجا تضمین نمی‌شود:** checkout فقط `stock` فعلی را گزارش می‌کند. اعتبارسنجی و کسر موجودی در ساخت سفارش انجام می‌شود. اگر `quantity > stock` بود، UI هشدار بده و اجازه‌ی پرداخت نده.
5. **سبد خالی خطا نیست:** `200` با `items: []`. با `itemCount === 0` به صفحه‌ی سبد برگردان.
6. **`freeOver` بر اساس `subtotal` است نه `total`.** برای نمایش «X تومان تا ارسال رایگان»: اگر `shipping.enabled && shipping.freeOver > subtotal`، مقدار `shipping.freeOver - subtotal` را نشان بده.
7. **`defaultAddressId` ممکن است `null` باشد** (کاربر آدرس پیش‌فرض ندارد) و `addresses` ممکن است خالی باشد؛ فرم افزودن آدرس را آماده داشته باش.
8. **`orderDiscount` فعلاً همیشه ۰ است؛** `totalDiscount` فقط «سود شما»ی نمایشی است و روی `total` اثر ندارد. این دو را قاطی نکن.
9. **تنظیمات ارسال از site-setting خوانده می‌شود:** اگر کلید `shipping` نباشد یا خراب باشد، checkout به‌صورت امن «ارسال غیرفعال/رایگان» (`enabled:false`, `cost:0`، `freeOver:0`) برمی‌گرداند و خطا نمی‌دهد.
10. **`payment.provider` نام درگاه است، نه متن نمایشی.** فرانت باید آن را به برند/متن فارسی نگاشت کند؛ فعلاً فقط `zarinpal` وجود دارد.

---

## ۷. چک‌لیست فرانت

- [ ] فقط برای کاربر لاگین‌شده صدا بزن؛ روی `401` به لاگین ببر.
- [ ] `credentials: 'include'` و هم‌راستایی origin با `APP_ORIGIN` بک.
- [ ] قبل از checkout، مرج سبد مهمان را با یک `GET /cart` + `X-Cart-Token` انجام بده.
- [ ] payload را از `body.data` و خطا را از `body.message` بخوان.
- [ ] فرم تماس را با `customer` پیش‌پر کن و `null` بودن `name`/`lastName` را هندل کن.
- [ ] آدرس‌ها را از `addresses` بساز و `defaultAddressId` را انتخاب کن.
- [ ] `itemCount === 0` → حالت سبد خالی.
- [ ] `total` را از پاسخ نمایش بده؛ خودت جمع نزن.
- [ ] `payment.provider` را به درگاه نگاشت کن.

---

## ۸. جدول مرجع سریع

| متد | مسیر | هویت | CSRF | موفق | `data` |
|---|---|---|---|---|---|
| GET | `/checkout` | نشست کاربر (اجباری) | نه | 200 | `Checkout` |
| | | | | 401 | بدون نشست معتبر |
