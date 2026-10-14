export type MomoRequestType = "captureWallet" | "payWithMethod";

export interface MomoClientOptions {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

export interface CreatePaymentOptions {
  orderId: string;
  requestId?: string;
  amount: number | string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
  requestType?: MomoRequestType;
  lang?: "vi" | "en";
  partnerName?: string;
  storeId?: string;
  autoCapture?: boolean;
}

export interface MomoCreatePaymentRequest {
  partnerCode: string;
  partnerName: string;
  storeId: string;
  requestId: string;
  amount: string;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData: string;
  requestType: MomoRequestType;
  signature: string;
  lang: "vi" | "en";
  autoCapture?: boolean;
}

export interface MomoCreatePaymentResponse {
  partnerCode?: string;
  requestId?: string;
  orderId?: string;
  amount?: number;
  responseTime?: number;
  message?: string;
  resultCode?: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  signature?: string;
  [key: string]: unknown;
}

export type MomoIpnPayload = Record<string, unknown>;
