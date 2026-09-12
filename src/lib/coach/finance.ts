/** Deterministic finance tools. The model explains these numbers; it never computes them. Pure, testable. */

export type Freshness = { as_of: string; source: "user_stated" | "connected_account" | "estimate"; freshness: "current" | "stale" };

const money = (n: number) => Math.round(n * 100) / 100;
const stamp = (source: Freshness["source"] = "user_stated"): Freshness => ({ as_of: new Date().toISOString(), source, freshness: "current" });

export function utilization(balance: number, creditLimit: number) {
  if (!(creditLimit > 0)) throw new Error("Invalid credit limit");
  const ratio = Math.max(0, balance) / creditLimit;
  const band = ratio <= 0.1 ? "excellent" : ratio <= 0.3 ? "good" : ratio <= 0.5 ? "high" : "critical";
  return {
    ratio: Math.round(ratio * 1000) / 1000,
    percent: Math.round(ratio * 100),
    band,
    balance_for_10_percent: money(creditLimit * 0.1),
    paydown_to_10_percent: money(Math.max(0, balance - creditLimit * 0.1)),
    ...stamp(),
  };
}

export function safePayment(input: { availableCash: number; protectedEssentials: number; emergencyReserve: number; requiredMinimumPayment: number }) {
  const safeMaximum = Math.max(0, input.availableCash - input.protectedEssentials - input.emergencyReserve);
  return {
    safe_maximum_payment: money(safeMaximum),
    minimum_payment_affordable: safeMaximum >= input.requiredMinimumPayment,
    shortfall_to_minimum: money(Math.max(0, input.requiredMinimumPayment - safeMaximum)),
    ...stamp(),
  };
}

export function safeRemittance(input: { availableCash: number; protectedEssentials: number; emergencyReserve: number; requiredDebtPayments: number; transferFee: number }) {
  const safe = input.availableCash - input.protectedEssentials - input.emergencyReserve - input.requiredDebtPayments - input.transferFee;
  return {
    safe_to_send: money(Math.max(0, safe)),
    protected_total: money(input.protectedEssentials + input.emergencyReserve + input.requiredDebtPayments),
    blocked_by: safe > 0 ? null : ("essentials_and_reserve" as const),
    ...stamp(),
  };
}

/** Recommend a card payment that protects essentials first, then payment history, then utilization. */
export function paymentRecommendation(input: {
  statementBalance: number;
  currentBalance: number;
  creditLimit: number;
  minimumPayment: number;
  availableCash: number;
  protectedEssentials: number;
  emergencyReserve: number;
}) {
  const room = Math.max(0, input.availableCash - input.protectedEssentials - input.emergencyReserve);
  const tenPct = input.creditLimit > 0 ? input.creditLimit * 0.1 : 0;
  const toTenPct = Math.max(0, input.currentBalance - tenPct);
  let amount: number;
  let strategy: "statement_in_full" | "to_10_percent" | "minimum" | "partial_below_minimum";
  if (room >= input.statementBalance) {
    amount = Math.max(input.statementBalance, Math.min(room, input.currentBalance));
    strategy = "statement_in_full";
  } else if (room >= Math.max(input.minimumPayment, toTenPct)) {
    amount = Math.max(input.minimumPayment, toTenPct);
    strategy = "to_10_percent";
  } else if (room >= input.minimumPayment) {
    amount = input.minimumPayment;
    strategy = "minimum";
  } else {
    amount = room;
    strategy = "partial_below_minimum";
  }
  return {
    recommended_payment: money(amount),
    strategy,
    room_after_essentials: money(room),
    minimum_payment_affordable: room >= input.minimumPayment,
    utilization_after: input.creditLimit > 0 ? Math.round((Math.max(0, input.currentBalance - amount) / input.creditLimit) * 100) : null,
    ...stamp(),
  };
}
