# راهنمای سفارشات (Orders API) — برای فرانت‌اند

دو سطح دسترسی جدا برای سفارشات وجود دارد:

| متد | مسیر | هویت | دسترسی | `data` |
|---|---|---|---|---|
| GET | `/profile/orders` | نشست کاربر (اجباری) | فقط سفارش‌های خودِ کاربر | لیست صفحه‌بندی‌شده |
| GET | `/profile/orders/summary` | نشست کاربر (اجباری) | فقط سفارش‌های خودِ کاربر | شمارش به‌تفکیک وضعیت |
| GET | `/profile/orders/{orderNumber}` | نشست کاربر (اجباری) | فقط سفارش خودِ کاربر | جزئیات سفارش |
| GET | `/admin/orders` | نشست کاربر + مجوز `order:read` | سفارش همه‌ی کاربران | لیست صفحه‌بندی‌شده |
| GET | `/admin/orders/{id}` | نشست کاربر + مجوز `order:read` | سفارش همه‌ی کاربران | جزئیات سفارش |
| PATCH | `/admin/orders/{id}/ship` | نشست کاربر + مجوز `order:manage` | ثبت ارسال (کد رهگیری) | `{ ok: true }` |
| PATCH | `/admin/orders/{id}/complete` | نشست کاربر + مجوز `order:manage` | اتمام سفارش | `{ ok: true }` |

> URL پایه بدون prefix است؛ مستندات Swagger روی `/docs`.

---

## ۱. قالب پاسخ

```jsonc
{ "statusCode": 200, "data": { /* ... */ }, "message": "OK" }
```

پاسخ خطا (از `AllExceptionsFilter`):

```jsonc
{ "statusCode": 401, "message": "Unauthorized" }
```

---

## ۲. احراز هویت و مجوز

- هر دو سطح نیاز به **کوکی نشست** دارند؛ بدون آن → `401`.
- مسیرهای `/admin/orders` برای خواندن به مجوز `order:read` نیاز دارند؛ بدون آن → `403`.
- مسیرهای `PATCH /admin/orders/{id}/ship|complete` علاوه بر آن به مجوز `order:manage` نیاز دارند و چون `PATCH` هستند به هدر `X-CSRF-Token` هم نیاز دارند.
- مسیرهای `/profile/orders` **فقط** سفارش‌های همان کاربر نشست را برمی‌گردانند (مالک هرگز از ورودی گرفته نمی‌شود).
- `GET` است؛ `X-CSRF-Token` لازم نیست. `credentials: 'include'` را بزن.

### افزودن مجوز

مجوزهای `order:read` و `order:manage` در seed تعریف شده‌اند (`lio_back/src/database/seed/permissions.ts`) و نقش `admin` در seed نقش‌ها همه‌ی مجوزها را می‌گیرد. برای اعمال روی یک محیط موجود:

```bash
pnpm db:seed permissions
pnpm db:seed role
```

---

## ۳. انواع (TypeScript)

```ts
type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELED' | 'EXPIRED';

interface OrderListItem {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
}

interface AdminOrderListItem extends OrderListItem {
  customerName: string;
  phone: string;
  userId: number | null;   // null برای مهمان یا کاربر حذف‌شده
  username: string | null;
}

interface OrderListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrderLine {
  id: number;
  productId: number | null;   // فقط اثری از محصول؛ اسنپ‌شات پایین معتبر است
  productName: string;
  productSlug: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string | null;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  customer: { firstName: string; lastName: string; phone: string; company: string | null };
  shippingAddress: { province: string; city: string; address: string; postalCode: string };
  payment: { provider: string | null; status: string | null; refId: string | null } | null;
  items: OrderLine[];
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  canceledAt: string | null;
  trackingCode: string | null;   // کد رهگیری پست؛ وقتی ارسال شود پر می‌شود
  shippedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  // فقط در قرارداد ادمین:
  userId?: number | null;
  username?: string | null;
}
```

**خلاصه‌ی داشبورد (`GET /profile/orders/summary`):**

```ts
interface OrderStatusSummary {
  total: number;                                       // مجموع سفارش‌های کاربر
  items: { status: OrderStatus; count: number }[];     // همه‌ی وضعیت‌ها، حتی با count = 0
}
```

**فیلترهای لیست:**

| پارامتر | `/profile/orders` | `/admin/orders` | توضیح |
|---|---|---|---|
| `page` | ✅ | ✅ | پیش‌فرض ۱ |
| `limit` | ✅ | ✅ | پیش‌فرض ۲۰، حداکثر ۱۰۰ |
| `status` | ✅ | ✅ | یکی از مقادیر `OrderStatus` |
| `search` | ✅ | ✅ | در پروفایل: بخشی از شماره سفارش. در ادمین: شماره سفارش، نام، فامیل یا تلفن |
| `userId` | ❌ | ✅ | فقط سفارش‌های یک کاربر |

---

## ۴. اکشن‌های اتمام سفارش (Fulfilment)

بعد از پرداخت موفق، وضعیت سفارش این مسیر را طی می‌کند:

```text
PAID  --(ثبت ارسال + کد رهگیری)-->  SHIPPED  --(اتمام)-->  COMPLETED
```

### `PATCH /admin/orders/{id}/ship`

- **بدنه:** `{ "trackingCode": "12345678901234567890" }` — اجباری، رشته‌ی غیرخالی، حداکثر ۱۰۰ کاراکتر.
- **پیش‌نیاز وضعیت:** فقط سفارش `PAID` پذیرفته می‌شود؛ در غیر این صورت `400` با پیام `Only a paid order can be shipped`.
- **اثر:** `status → SHIPPED`، ست‌شدن `trackingCode` و `shippedAt`.
- **پاسخ:** `200` و `{ "ok": true }`.

```bash
curl -s -X PATCH http://localhost:3000/admin/orders/5/ship \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: <token>" \
  -b 'session=...' \
  -d '{"trackingCode":"12345678901234567890"}'
```

### `PATCH /admin/orders/{id}/complete`

- **بدنه:** ندارد.
- **پیش‌نیاز وضعیت:** فقط سفارش `SHIPPED` پذیرفته می‌شود؛ در غیر این صورت `400` با پیام `Only a shipped order can be completed`.
- **اثر:** `status → COMPLETED` و ست‌شدن `completedAt`.
- **پاسخ:** `200` و `{ "ok": true }`.

> پاسخ این دو اکشن فقط `{ ok: true }` است؛ برای نمایش وضعیت و `trackingCode` جدید دوباره `GET /admin/orders/{id}` را بگیر.

---

## ۵. تله‌ها ⚠️

1. **تفکیک مسیرها را حفظ کن:** پنل کاربر همیشه `/profile/orders` را صدا بزند (سرور خودش محدود می‌کند) و پنل ادمین `/admin/orders`. هیچ‌وقت برای دیدن سفارش‌های خودت به مسیر ادمین تکیه نکن.
2. **`/profile/orders` مالک نمی‌گیرد:** کاربر نمی‌تواند `userId` بفرستد؛ اگر بفرستد نادیده گرفته می‌شود.
3. **`imageUrl` ممکن است `null` باشد:** محصول حذف‌شده یا بدون تصویر. UI باید placeholder داشته باشد.
4. **مبالغ snapshot هستند:** قیمت‌ها در لحظه‌ی ثبت سفارش کپی شده‌اند؛ بعد از تغییر محصول عوض نمی‌شوند.
5. **`orderNumber` شناسه‌ی مسیر پنل کاربر است، نه `id`:** لینک جزئیات `/profile/orders/{orderNumber}` است (مثل `ORD-20260926-4F2A9C10BD`). در ادمین مسیر با `id` عددی است: `/admin/orders/{id}`.
6. **`status` و `paidAt` را جدا نگه دار:** `PAID` معادل پرداخت‌شده است؛ `PENDING_PAYMENT` یعنی هنوز پرداخت نشده و با گذشت `expiresAt` به `EXPIRED` می‌رود (جزئیات: `docs/order-expiry.md`).
7. **فقط ادمین با `order:manage` می‌تواند ارسال/اتمام بزند:** نمایش دکمه‌ها در UI را با همین مجوز گارد کن؛ اکشن بدون این مجوز `403` می‌گیرد.
