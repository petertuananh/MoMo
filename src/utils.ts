import { createHmac, timingSafeEqual } from "node:crypto";
import { MomoError } from "./errors.js";

export function requireText(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new MomoError(`${name} is required.`, "INVALID_ARGUMENT");
  }
  return value;
}

export function normalizeAmount(amount: number | string): string {
  const value = typeof amount === "number" ? amount.toString() : amount.trim();
  if (!/^\d+$/.test(value) || BigInt(value) <= 0n) {
    throw new MomoError("amount must be a positive integer in VND.", "INVALID_AMOUNT");
  }
  return value;
}

export function sign(secretKey: string, rawSignature: string): string {
  return createHmac("sha256", secretKey).update(rawSignature, "utf8").digest("hex");
}

export function safeSignatureEquals(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  return expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer);
}

export const IPN_SIGNATURE_FIELDS = [
  "amount", "extraData", "message", "orderId", "orderInfo",
  "orderType", "partnerCode", "payType", "requestId",
  "responseTime", "resultCode", "transId"
] as const;
