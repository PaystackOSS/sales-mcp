export type PaymentRequest = {
  amount: number;
  currency?: string;
  reference: string;
};

export type PaymentResult = {
  id: string;
  status: "approved";
  amount: number;
  currency: string;
};

export function authorizePayment(request: PaymentRequest): PaymentResult {
  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  return {
    id: `pay_${Date.now()}`,
    status: "approved",
    amount: Number(request.amount.toFixed(2)),
    currency: request.currency ?? "USD"
  };
}
