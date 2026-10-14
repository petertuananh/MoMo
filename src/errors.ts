export class MomoError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "MomoError";
    this.code = code;
    this.details = details;
  }
}

export class MomoApiError extends MomoError {
  readonly status?: number;
  readonly response: Record<string, unknown>;

  constructor(response: Record<string, unknown>, status?: number) {
    super(
      typeof response.message === "string"
        ? response.message
        : "MoMo returned an unsuccessful response.",
      `MOMO_RESULT_${response.resultCode ?? "UNKNOWN"}`,
      response
    );
    this.name = "MomoApiError";
    this.status = status;
    this.response = response;
  }
}
