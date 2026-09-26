/** Result of a payment request (creating a gateway session). Failures never throw across the boundary. */
export interface PaymentRequestResult {
  ok: boolean;
  /** Gateway authority/token, needed to verify the payment later. */
  authority?: string;
  /** Ready-to-use URL the payer must be redirected to. */
  paymentUrl?: string;
  /** Raw provider payload, returned so the caller can persist it for auditing. */
  raw?: unknown;
  error?: string;
}

/** Result of a payment verification. Failures never throw across the boundary. */
export interface PaymentVerifyResult {
  ok: boolean;
  /** Gateway reference id (trace number), present when the payment is verified. */
  refId?: string;
  /** Raw provider payload, returned so the caller can persist it for auditing. */
  raw?: unknown;
  error?: string;
}

/** Input for {@link PaymentProvider.request}. */
export interface PaymentRequestInput {
  /** Order id on our side, used as the gateway order reference. */
  orderId: number;
  /** Amount in the store currency (Toman). The provider converts to its own unit. */
  amount: number;
  /** Human-readable description shown to the payer in the gateway. */
  description: string;
  /** Absolute URL the gateway redirects the payer back to after payment. */
  callbackUrl: string;
  /** Payer mobile, used by some gateways for the payment receipt. */
  mobile?: string;
}

/** Input for {@link PaymentProvider.verify}. */
export interface PaymentVerifyInput {
  /** Gateway authority returned by {@link PaymentProvider.request}. */
  authority: string;
  /** Amount in the store currency (Toman); must match the requested amount. */
  amount: number;
}

/**
 * Contract every payment gateway must implement. The rest of the application
 * only depends on `PaymentService`, so adding a provider means implementing this
 * interface and wiring it in `PaymentModule`.
 */
export interface PaymentProvider {
  /** Active provider name, used for logging and persistence. */
  readonly name: string;

  /** Open a payment session and return the authority plus the redirect URL. */
  request(input: PaymentRequestInput): Promise<PaymentRequestResult>;

  /**
   * Verify a payment after the gateway redirects the payer back. Must be
   * idempotent: verifying an already-verified authority counts as success.
   */
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;

  /** Build the URL the payer is redirected to in order to pay. */
  startPayUrl(authority: string): string;
}
