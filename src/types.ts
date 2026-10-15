export type MomoRequestType = "captureWallet" | "payWithMethod";
export type MomoConfirmRequestType = "capture" | "cancel";

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

export interface TransactionQueryOptions {
  requestId: string;
  orderId: string;
  lang?: "vi" | "en";
}

export interface ConfirmPaymentOptions {
  requestId: string;
  orderId: string;
  requestType: MomoConfirmRequestType;
  amount: number | string;
  description?: string;
  lang?: "vi" | "en";
}

export interface RefundTransactionItem {
  itemId: string;
  amount: number | string;
  transId: number | string;
}

export interface RefundPaymentOptions {
  requestId: string;
  orderId: string;
  amount: number | string;
  transId: number | string;
  description?: string;
  transGroup?: RefundTransactionItem[];
  lang?: "vi" | "en";
}

export interface RefundQueryOptions {
  requestId: string;
  orderId: string;
  lang?: "vi" | "en";
}

export interface MomoTransactionResponse {
  [key: string]: unknown;
}

export type MomoIpnPayload = Record<string, unknown>;
