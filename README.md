# 📦 momo-payment

[![NPM Version](https://img.shields.io/npm/v/momo-payment)](https://www.npmjs.com/package/momo-payment)
[![NPM Downloads](https://img.shields.io/npm/dm/momo-payment)](https://www.npmjs.com/package/momo-payment)
[![License](https://img.shields.io/npm/l/momo-payment)](https://github.com/petertuananh/MoMo)

**Thư viện Node.js hiện đại cho tích hợp cổng thanh toán [MoMo](https://developers.momo.vn/) vào ứng dụng của bạn.**

Hỗ trợ TypeScript, modular imports, tree-shaking và không có runtime dependency.

> ⚠️ Đây là thư viện **backend-only**. Không import `MomoClient` trong React,
> Vue hoặc Angular vì `secretKey` phải được giữ ở server.

## ✨ Tính năng

- Tạo payment request MoMo v2 (`captureWallet`, `payWithMethod`).
- HMAC-SHA256 signing theo chuẩn MoMo.
- Xác thực chữ ký IPN bằng so sánh timing-safe.
- Sandbox mặc định, hỗ trợ production và custom endpoint.
- Timeout, kiểm tra input và lỗi có mã rõ ràng.
- Dùng được với Express, Fastify, NestJS hoặc server Node.js thuần.
- Không phụ thuộc `axios`; dùng `fetch` có sẵn từ Node.js 18.

## 📚 Tài liệu

- [MoMo Developer Portal](https://developers.momo.vn/)
- [MoMo API Create Payment](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/create)
- [GitHub](https://github.com/petertuananh/MoMo)

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
