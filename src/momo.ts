import { MOMO_CREATE_PAYMENT_PATH, MOMO_SANDBOX_URL } from "./constants.js";
import { MomoApiError, MomoError } from "./errors.js";
import type {
  CreatePaymentOptions,
  MomoClientOptions,
  MomoCreatePaymentRequest,
  MomoCreatePaymentResponse,
  MomoIpnPayload
} from "./types.js";
import {
  IPN_SIGNATURE_FIELDS,
  normalizeAmount,
  requireText,
  safeSignatureEquals,
  sign
} from "./utils.js";

export class MomoClient {
  private readonly options: Required<Pick<MomoClientOptions, "endpoint" | "timeoutMs">> &
    Omit<MomoClientOptions, "endpoint" | "timeoutMs">;

  constructor(options: MomoClientOptions) {
    this.options = {
      ...options,
      endpoint: (options.endpoint || MOMO_SANDBOX_URL).replace(/\/+$/, ""),
      timeoutMs: options.timeoutMs ?? 30_000
    };
    requireText(options.partnerCode, "partnerCode");
    requireText(options.accessKey, "accessKey");
    requireText(options.secretKey, "secretKey");
    if (!Number.isInteger(this.options.timeoutMs) || this.options.timeoutMs <= 0) {
      throw new MomoError("timeoutMs must be a positive integer.", "INVALID_ARGUMENT");
    }
  }

  buildCreatePaymentRequest(options: CreatePaymentOptions): MomoCreatePaymentRequest {
    const orderId = requireText(options.orderId, "orderId");
    const orderInfo = requireText(options.orderInfo, "orderInfo");
    const redirectUrl = requireText(options.redirectUrl, "redirectUrl");
    const ipnUrl = requireText(options.ipnUrl, "ipnUrl");
    const requestId = options.requestId?.trim() || orderId;
    const amount = normalizeAmount(options.amount);
    const extraData = options.extraData ?? "";
    const requestType = options.requestType ?? "captureWallet";
    const lang = options.lang ?? "vi";
    const partnerName = options.partnerName ?? this.options.partnerCode;
    const storeId = options.storeId ?? this.options.partnerCode;
    const rawSignature = [
      `accessKey=${this.options.accessKey}`, `amount=${amount}`,
      `extraData=${extraData}`, `ipnUrl=${ipnUrl}`, `orderId=${orderId}`,
      `orderInfo=${orderInfo}`, `partnerCode=${this.options.partnerCode}`,
      `redirectUrl=${redirectUrl}`, `requestId=${requestId}`,
      `requestType=${requestType}`
    ].join("&");
    const request: MomoCreatePaymentRequest = {
      partnerCode: this.options.partnerCode, partnerName, storeId, requestId,
      amount, orderId, orderInfo, redirectUrl, ipnUrl, extraData, requestType,
      signature: sign(this.options.secretKey, rawSignature), lang
    };
    if (options.autoCapture !== undefined) request.autoCapture = options.autoCapture;
    return request;
  }

  async createPayment(options: CreatePaymentOptions): Promise<MomoCreatePaymentResponse> {
    const request = this.buildCreatePaymentRequest(options);
    const fetchImpl = this.options.fetch ?? globalThis.fetch;
    if (!fetchImpl) throw new MomoError("A fetch implementation is required.", "FETCH_UNAVAILABLE");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(`${this.options.endpoint}${MOMO_CREATE_PAYMENT_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new MomoError("MoMo request timed out.", "TIMEOUT", error);
      }
      throw new MomoError(
        `Unable to connect to MoMo: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR", error
      );
    } finally {
      clearTimeout(timeout);
    }
    let data: MomoCreatePaymentResponse;
    try {
      data = await response.json() as MomoCreatePaymentResponse;
    } catch (error) {
      throw new MomoError("MoMo returned invalid JSON.", "INVALID_RESPONSE", error);
    }
    if (!response.ok || data.resultCode !== 0) throw new MomoApiError(data, response.status);
    return data;
  }

  verifySignature(payload: MomoIpnPayload): boolean {
    const signature = typeof payload.signature === "string" ? payload.signature : "";
    if (!signature) return false;
    const rawSignature = IPN_SIGNATURE_FIELDS
      .map((field) => `${field}=${payload[field] ?? ""}`).join("&");
    return safeSignatureEquals(sign(this.options.secretKey, rawSignature), signature);
  }
}

export function createMomoClient(options: MomoClientOptions): MomoClient {
  return new MomoClient(options);
}
