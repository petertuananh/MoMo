# 📦 momo-payment

[![NPM Version](https://img.shields.io/npm/v/momo-payment)](https://www.npmjs.com/package/momo-payment)
[![NPM Downloads](https://img.shields.io/npm/dm/momo-payment)](https://www.npmjs.com/package/momo-payment)
[![License](https://img.shields.io/npm/l/momo-payment)](https://github.com/petertuananh/MoMo)

**Thư viện Node.js hiện đại cho tích hợp cổng thanh toán [MoMo](https://developers.momo.vn/) vào ứng dụng của bạn.**

Hỗ trợ TypeScript, modular imports, tree-shaking và không có runtime dependency.

## 🔗 Thông tin thư viện

- [Website](https://momo.js.org)
- [npm](https://www.npmjs.com/package/momo-payment)
- [GitHub](https://github.com/petertuananh/MoMo)
- [Ví dụ tích hợp](https://github.com/petertuananh/momo-payment-nodejs-example)

> ⚠️ Đây là thư viện **backend-only**. Không import `MomoClient` trong React,
> Vue hoặc Angular vì `secretKey` phải được giữ ở server.

## ✨ Tính năng

- Tạo payment request MoMo v2 (`captureWallet`, `payWithMethod`).
- Tra cứu trạng thái giao dịch.
- Confirm hoặc cancel giao dịch đã được authorize.
- Hoàn tiền toàn phần, một phần và tra cứu kết quả hoàn tiền.
- HMAC-SHA256 signing theo chuẩn MoMo.
- Xác thực chữ ký IPN bằng so sánh timing-safe.
- Sandbox mặc định, hỗ trợ production và custom endpoint.
- Timeout, kiểm tra input và lỗi có mã rõ ràng.
- Dùng được với Express, Fastify, NestJS hoặc server Node.js thuần.
- Không phụ thuộc `axios`; dùng `fetch` có sẵn từ Node.js 18.

## 📚 Tài liệu

- [MoMo Developer Portal](https://developers.momo.vn/)
- [MoMo API Create Payment](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/create)
- [MoMo API Query Transaction](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/query)
- [MoMo API Confirm](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/confirm)
- [MoMo API Refund](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/refund)
- [GitHub](https://github.com/petertuananh/MoMo)
- [Ví dụ Node.js](https://github.com/petertuananh/momo-payment-nodejs-example)

## 🚀 Cài đặt

```bash
npm install momo-payment
```

## 📦 Import

### Import đầy đủ

```ts
import {
  MomoClient,
  MOMO_SANDBOX_URL,
  MOMO_PRODUCTION_URL
} from "momo-payment";
```

### Import theo module

```ts
import { MomoClient } from "momo-payment/momo";
import {
  MOMO_SANDBOX_URL,
  MOMO_PRODUCTION_URL
} from "momo-payment/constants";
```

### Types-only

```ts
import type {
  CreatePaymentOptions,
  MomoCreatePaymentResponse,
  MomoIpnPayload
} from "momo-payment/types-only";
```

## 💳 Khởi tạo client

```ts
import { MomoClient, MOMO_SANDBOX_URL } from "momo-payment";

const momo = new MomoClient({
  partnerCode: process.env.MOMO_PARTNER_CODE!,
  accessKey: process.env.MOMO_ACCESS_KEY!,
  secretKey: process.env.MOMO_SECRET_KEY!,
  endpoint: MOMO_SANDBOX_URL,
  timeoutMs: 30_000
});
```

Production sử dụng `endpoint: MOMO_PRODUCTION_URL`.

Mọi API của client đều yêu cầu `timeoutMs` tối thiểu `30_000` (30 giây), theo
yêu cầu của MoMo. Giá trị nhỏ hơn sẽ bị từ chối với lỗi `INVALID_ARGUMENT`.

## 🗺️ Chức năng và endpoint MoMo

| Chức năng trong thư viện | Method | HTTP request MoMo |
| --- | --- | --- |
| Tạo payment và lấy `payUrl` | `createPayment()` | `POST /v2/gateway/api/create` |
| Kiểm tra trạng thái giao dịch | `queryTransaction()` | `POST /v2/gateway/api/query` |
| Confirm giao dịch đã authorize | `confirmPayment({ requestType: "capture" })` | `POST /v2/gateway/api/confirm` |
| Cancel giao dịch đã authorize | `confirmPayment({ requestType: "cancel" })` | `POST /v2/gateway/api/confirm` |
| Refund giao dịch | `refundPayment()` | `POST /v2/gateway/api/refund` |
| Kiểm tra kết quả refund | `queryRefund()` | `POST /v2/gateway/api/refund/query` |

Các method trên gửi request JSON đến `endpoint` đã cấu hình, tự tạo chữ ký
HMAC-SHA256 bằng `secretKey`, parse response JSON và ném `MomoApiError` khi
MoMo trả `resultCode` khác `0` hoặc HTTP status không thành công.

## 🔗 Tạo payment URL

MoMo trả về `payUrl`; ứng dụng tự quyết định redirect hoặc trả URL cho frontend.

```ts
const payment = await momo.createPayment({
  orderId: transaction.id,
  amount: transaction.amount,
  orderInfo: `Thanh toan giao dich ${transaction.id}`,
  redirectUrl: "https://yourapp.com/payments/momo/return",
  ipnUrl: "https://yourapp.com/payments/momo/ipn"
});

console.log("Payment URL:", payment.payUrl);
// Express: return res.redirect(payment.payUrl!);
```

`amount` phải là số nguyên dương theo đơn vị VND. `requestId` mặc định bằng
`orderId`, `requestType` mặc định là `captureWallet`, `lang` mặc định là `vi`
và `extraData` mặc định là chuỗi rỗng.

Để kiểm tra payload trước khi gửi:

```ts
const requestBody = momo.buildCreatePaymentRequest({
  orderId: "ORDER_123",
  amount: 100000,
  orderInfo: "Thanh toan don hang 123",
  redirectUrl: "https://yourapp.com/payments/momo/return",
  ipnUrl: "https://yourapp.com/payments/momo/ipn"
});
```

## 🔎 Kiểm tra trạng thái giao dịch

Sử dụng `queryTransaction()` để lấy trạng thái mới nhất của một `orderId`.
`requestId` là mã duy nhất cho request query.

```ts
const status = await momo.queryTransaction({
  requestId: `QUERY_${transaction.id}`,
  orderId: transaction.id,
  lang: "vi"
});

console.log(status.resultCode, status.message, status.transId);
```

Request được gửi đến `POST /v2/gateway/api/query` với chữ ký theo thứ tự:

```text
accessKey → orderId → partnerCode → requestId
```

## ✅ Confirm hoặc cancel payment

Chỉ gọi API này khi giao dịch có trạng thái **9000: Authorized**. Dùng
`requestType: "capture"` để nhận tiền hoặc `"cancel"` để hủy authorization và
hoàn tiền đang bị giữ cho khách hàng.

### Confirm giao dịch

```ts
const confirmed = await momo.confirmPayment({
  requestId: `CONFIRM_${transaction.id}`,
  orderId: transaction.id,
  requestType: "capture",
  amount: transaction.amount,
  lang: "vi"
});
```

### Cancel giao dịch

```ts
const cancelled = await momo.confirmPayment({
  requestId: `CANCEL_${transaction.id}`,
  orderId: transaction.id,
  requestType: "cancel",
  amount: transaction.amount,
  description: "Huy giao dich do khong xu ly duoc don hang",
  lang: "vi"
});
```

Cả hai thao tác đều gọi `POST /v2/gateway/api/confirm`. MoMo dùng `requestId`
để kiểm soát idempotency, vì vậy mỗi request cần một ID ổn định và duy nhất.

## ↩️ Refund payment

`refundPayment()` dùng để hoàn tiền toàn phần hoặc một phần cho giao dịch đã
thanh toán thành công. `amount` là số tiền cần hoàn, còn `transId` là
transaction ID do MoMo trả về.

```ts
const refund = await momo.refundPayment({
  requestId: `REFUND_${transaction.id}`,
  orderId: `REFUND_ORDER_${transaction.id}`,
  amount: 50000,
  transId: status.transId as number,
  description: "Khach hang yeu cau hoan tien",
  lang: "vi"
});
```

Request được gửi đến `POST /v2/gateway/api/refund`. `orderId` của refund phải
khác `orderId` của giao dịch mua ban đầu. `amount` phải là số nguyên dương VND.

Với giao dịch Buy Now Pay Later cần hoàn theo từng item, truyền thêm
`transGroup`:

```ts
await momo.refundPayment({
  requestId: "REFUND_ORDER_123",
  orderId: "REFUND_123",
  amount: 350000,
  transId: 144492817,
  transGroup: [
    { itemId: "SKU_1", amount: 200000, transId: 2824581984 },
    { itemId: "SKU_2", amount: 150000, transId: 2824581983 }
  ]
});
```

## 🔁 Kiểm tra kết quả refund

Sau khi gọi refund, dùng `queryRefund()` để tra cứu trạng thái refund theo
`orderId` của giao dịch refund:

```ts
const refundStatus = await momo.queryRefund({
  requestId: `REFUND_QUERY_${transaction.id}`,
  orderId: `REFUND_ORDER_${transaction.id}`,
  lang: "vi"
});

console.log(refundStatus.resultCode, refundStatus.refundTransList);
```

Method này gọi `POST /v2/gateway/api/refund/query`. `queryRefund()` sử dụng
cùng định dạng chữ ký query của MoMo:

```text
accessKey → orderId → partnerCode → requestId
```

## ✅ Xác thực IPN

```ts
app.post("/payments/momo/ipn", (req, res) => {
  if (!momo.verifySignature(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid MoMo signature"
    });
  }

  // Kiểm tra idempotency, orderId, amount và cập nhật giao dịch.
  return res.json({ success: true });
});
```

Luôn xác thực chữ ký, `orderId`, số tiền và trạng thái giao dịch trước khi ghi
nhận thanh toán. Không log hoặc đưa `secretKey` vào frontend.

## ⚠️ Xử lý lỗi

```ts
import { MomoApiError, MomoError } from "momo-payment";

try {
  await momo.createPayment(/* ... */);
} catch (error) {
  if (error instanceof MomoApiError) {
    console.error(error.response.resultCode, error.response.message);
  } else if (error instanceof MomoError) {
    console.error(error.code, error.message);
  }
}
```

## 🛠️ Phát triển

```bash
npm install
npm run build
npm test
npm pack --dry-run
```

Test sử dụng `node:assert/strict` và mock `fetch` từ Node.js built-in thông qua
`test.js`, không cần cài thêm test framework.

Thư viện không quản lý database hoặc route HTTP. Ứng dụng tích hợp chịu trách
nhiệm tìm giao dịch `PENDING`, redirect người dùng, xử lý return/IPN và cập nhật
trạng thái giao dịch.
