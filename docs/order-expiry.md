# انقضای سفارش‌های پرداخت‌نشده (Order Expiry Job)

سفارش در لحظه‌ی `POST /payments` ساخته می‌شود، موجودی را **رزرو** می‌کند و کاربر به درگاه می‌رود. اگر کاربر پرداخت را رها کند، موجودی تا ابد رزرو می‌ماند. این جاب دوره‌ای سفارش‌هایی را که مهلتشان گذشته پیدا می‌کند، به وضعیت `EXPIRED` می‌برد و موجودی رزروشده را برمی‌گرداند.

> پکیج: `@nestjs/schedule` — `ScheduleModule.forRoot()` یک‌بار در `AppModule` ثبت شده است.

---

## ۱. زمان‌بندی

```ts
@Cron(CronExpression.EVERY_5_MINUTES, { name: 'order-expiry' })
async expireUnpaidOrders(): Promise<void> {
  const expired = await this.repository.expireStaleOrders(new Date());
  if (expired > 0) {
    this.logger.log(`Expired ${expired} unpaid order(s) and released their reserved stock`);
  }
}
```

- فایل: `src/checkout/services/order-expiry.service.ts` (provider در `CheckoutModule`).
- هر **۵ دقیقه** یک‌بار (ثانیه‌ی ۰ هر دقیقه‌ی مضرب ۵).
- فقط وقتی سفارشی واقعاً منقضی شده باشد لاگ می‌زند.

---

## ۲. مهلت (TTL) از کجا می‌آید

موقع ساخت سفارش، فیلد `orders.expiresAt` این‌طور ست می‌شود:

```ts
expiresAt = now + PAYMENT_ORDER_TTL_MINUTES * 60_000
```

| منبع | مقدار |
|---|---|
| `.env` | `PAYMENT_ORDER_TTL_MINUTES=30` |
| config | `payment.orderTtlMinutes` (`src/config/configuration.ts:75`) |
| استفاده | `CheckoutPaymentService` هنگام `createOrder` |

جاب مستقیماً روی `orders.expires_at <= now()` فیلتر می‌زند (ایندکس `orders_expires_at_idx`). یعنی مهلت هر سفارش همان چیزی است که در لحظه‌ی ساختش وعده داده شده؛ تغییر بعدی env روی سفارش‌های قدیمی اثر نمی‌گذارد.

---

## ۳. الگوریتم

`CheckoutPaymentRepository.expireStaleOrders(now)`:

1. **انتخاب نامزدها**: سفارش‌های `PENDING_PAYMENT` که `expires_at <= now` (حداکثر ۵۰۰ ردیف در هر تیک).
2. برای هر سفارش، `expireOrder(id)` در یک **تراکنش**:
   - **Claim با آپدیت گارد‌دار**: `UPDATE orders SET status='EXPIRED' WHERE id=? AND status='PENDING_PAYMENT'`. اگر ردیفی برنگردد یعنی دیگری (callback یا تیک قبلی) برده است → `false`.
   - **آزادسازی انبار**: آیتم‌های سفارش را به ترتیب صعودی `variant_id` قفل (`SELECT ... FOR UPDATE`) و `stock += quantity` می‌کند.
   - **باطل کردن پرداخت‌های معلق**: `payments`هایی با وضعیت `INITIATED` این سفارش → `CANCELED`.

خروجی: تعداد سفارش‌هایی که واقعاً به `EXPIRED` رفتند.

---

## ۴. وضعیت‌ها و ایمنی همروندی

| قبل | بعد | توضیح |
|---|---|---|
| `PENDING_PAYMENT` | `EXPIRED` | مهلت گذشته و پرداخت نشده |
| `payments.status = INITIATED` | `CANCELED` | تراکنش معلق باطل می‌شود |
| `product_variants.stock` | `stock + quantity` | واحدهای رزروشده برمی‌گردند |

- آپدیت گارد‌دار `PENDING_PAYMENT → EXPIRED` تضمین می‌کند آزادسازی موجودی **دوبار** انجام نشود (همان الگوی `cancelOrder`).
- قفل واریانت‌ها با همان ترتیب صعودی `createOrder` انجام می‌شود تا reserve و expiry هم‌زمان به deadlock نخورند.

> ⚠️ ریسک callback دیرهنگام: اگر بانک بعد از منقضی‌شدن callback موفق بزند، `markOrderPaid` به‌خاطر گارد `PENDING_PAYMENT` شکست می‌خورد و سفارش `not_payable` می‌شود؛ در این حالت اگر پول واقعاً کم شده باشد نیاز به refund دستی است. این پنجره را می‌توان با کوتاه‌تر کردن TTL یا اعتبارسنجی بیشتر در callback محدود کرد.

---

## ۵. تست سریع

برای دیدن رفتار بدون انتظار ۵ دقیقه، موقتاً کرون را کوتاه کن:

```ts
@Cron(CronExpression.EVERY_10_SECONDS, { name: 'order-expiry' })
```

یک سفارش `PENDING_PAYMENT` با `expires_at` در گذشته بساز (یا موجود را به گذشته ببر):

```sql
UPDATE orders SET expires_at = now() - interval '1 minute' WHERE id = <id>;
```

بعد سرور را بالا بیاور و تأیید کن:
- `orders.status` → `EXPIRED`
- `product_variants.stock` به اندازه‌ی quantity آیتم‌ها زیاد شده
- `payments.status` همان سفارش → `CANCELED`

در پایان کرون را به `EVERY_5_MINUTES` برگردان.
