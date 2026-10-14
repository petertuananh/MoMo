import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  MomoApiError,
  MomoClient,
  MomoError
} from "./dist/index.js";

const clientOptions = {
  partnerCode: "MOMO",
  accessKey: "access-key",
  secretKey: "secret-key"
};

function createIpnPayload(overrides = {}) {
  const payload = {
    amount: 100000,
    extraData: "",
    message: "Successful.",
    orderId: "ORDER_123",
    orderInfo: "Thanh toan don hang",
    orderType: "momo_wallet",
    partnerCode: "MOMO",
    payType: "qr",
    requestId: "ORDER_123",
    responseTime: 1710000000000,
    resultCode: 0,
    transId: 123456789,
    ...overrides
  };

  const rawSignature = [
    "amount", "extraData", "message", "orderId", "orderInfo",
    "orderType", "partnerCode", "payType", "requestId",
    "responseTime", "resultCode", "transId"
  ].map((field) => `${field}=${payload[field] ?? ""}`).join("&");

  return {
    ...payload,
    signature: createHmac("sha256", clientOptions.secretKey)
      .update(rawSignature)
      .digest("hex")
  };
}

async function createPaymentTest() {
  let requestUrl;
  let requestBody;

  const client = new MomoClient({
    ...clientOptions,
    fetch: async (url, init) => {
      requestUrl = url;
      requestBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        resultCode: 0,
        message: "Successful.",
        payUrl: "https://test-payment.momo.vn/pay/ORDER_123"
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  });

  const response = await client.createPayment({
    orderId: "ORDER_123",
    amount: 100000,
    orderInfo: "Thanh toan don hang",
    redirectUrl: "https://example.com/momo/return",
    ipnUrl: "https://example.com/momo/ipn"
  });

  assert.equal(requestUrl, "https://test-payment.momo.vn/v2/gateway/api/create");
  assert.equal(requestBody.partnerCode, "MOMO");
  assert.equal(requestBody.amount, "100000");
  assert.equal(requestBody.requestId, "ORDER_123");
  assert.equal(requestBody.requestType, "captureWallet");
  assert.equal(requestBody.lang, "vi");
  assert.match(requestBody.signature, /^[a-f0-9]{64}$/);
  assert.equal(response.payUrl, "https://test-payment.momo.vn/pay/ORDER_123");
}

function requestValidationTest() {
  const client = new MomoClient(clientOptions);

  assert.throws(
    () => client.buildCreatePaymentRequest({
      orderId: "ORDER_123",
      amount: 0,
      orderInfo: "Test",
      redirectUrl: "https://example.com/return",
      ipnUrl: "https://example.com/ipn"
    }),
    (error) => error instanceof MomoError && error.code === "INVALID_AMOUNT"
  );
}

async function apiErrorTest() {
  const client = new MomoClient({
    ...clientOptions,
    fetch: async () => new Response(JSON.stringify({
      resultCode: 1006,
      message: "Invalid amount."
    }), {
      status: 400,
      headers: { "content-type": "application/json" }
    })
  });

  await assert.rejects(
    () => client.createPayment({
      orderId: "ORDER_123",
      amount: 100000,
      orderInfo: "Test",
      redirectUrl: "https://example.com/return",
      ipnUrl: "https://example.com/ipn"
    }),
    (error) => error instanceof MomoApiError &&
      error.code === "MOMO_RESULT_1006" &&
      error.status === 400
  );
}

function ipnSignatureTest() {
  const client = new MomoClient(clientOptions);
  const payload = createIpnPayload();

  assert.equal(client.verifySignature(payload), true);
  assert.equal(
    client.verifySignature({ ...payload, amount: 999999 }),
    false
  );
  assert.equal(
    client.verifySignature({ ...payload, signature: "invalid" }),
    false
  );
}

test("createPayment tạo request và nhận payUrl", createPaymentTest);
test("buildCreatePaymentRequest từ chối amount không hợp lệ", requestValidationTest);
test("createPayment ném MomoApiError khi MoMo trả lỗi", apiErrorTest);
test("verifySignature xác thực và từ chối IPN bị thay đổi", ipnSignatureTest);