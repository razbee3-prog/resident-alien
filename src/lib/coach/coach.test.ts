import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paymentRecommendation, safePayment, safeRemittance, utilization } from "./finance";
import { contextComplete, isAffirmative, missingContext, parseButtonPrefill, situationKnown } from "./onboarding";
import { isImmigrationStatusQuestion, isOptIn, isOptOut, outboundProblems, redactPii } from "./policy";
import { normalizePhone, splitBubbles, stripMarkdown } from "./text";

describe("finance", () => {
  it("utilization bands and paydown", () => {
    const u = utilization(140, 1000);
    assert.equal(u.percent, 14);
    assert.equal(u.band, "good");
    assert.equal(u.paydown_to_10_percent, 40);
    assert.equal(utilization(50, 1000).band, "excellent");
    assert.equal(utilization(600, 1000).band, "critical");
    assert.throws(() => utilization(10, 0));
  });
  it("safe payment protects essentials and reserve", () => {
    const r = safePayment({ availableCash: 2100, protectedEssentials: 1650, emergencyReserve: 200, requiredMinimumPayment: 35 });
    assert.equal(r.safe_maximum_payment, 250);
    assert.equal(r.minimum_payment_affordable, true);
    const tight = safePayment({ availableCash: 1700, protectedEssentials: 1650, emergencyReserve: 200, requiredMinimumPayment: 35 });
    assert.equal(tight.safe_maximum_payment, 0);
    assert.equal(tight.minimum_payment_affordable, false);
    assert.equal(tight.shortfall_to_minimum, 35);
  });
  it("safe remittance never goes negative", () => {
    assert.equal(safeRemittance({ availableCash: 2100, protectedEssentials: 1650, emergencyReserve: 200, requiredDebtPayments: 35, transferFee: 5 }).safe_to_send, 210);
    const blocked = safeRemittance({ availableCash: 1000, protectedEssentials: 1650, emergencyReserve: 200, requiredDebtPayments: 35, transferFee: 5 });
    assert.equal(blocked.safe_to_send, 0);
    assert.equal(blocked.blocked_by, "essentials_and_reserve");
  });
  it("payment recommendation picks the safest affordable strategy", () => {
    const base = { statementBalance: 212, currentBalance: 260, creditLimit: 1500, minimumPayment: 35, protectedEssentials: 1650, emergencyReserve: 200 };
    assert.equal(paymentRecommendation({ ...base, availableCash: 2500 }).strategy, "statement_in_full");
    assert.equal(paymentRecommendation({ ...base, availableCash: 1990 }).strategy, "to_10_percent");
    assert.equal(paymentRecommendation({ ...base, availableCash: 1900 }).strategy, "minimum");
    assert.equal(paymentRecommendation({ ...base, availableCash: 1860 }).strategy, "partial_below_minimum");
  });
});

describe("policy", () => {
  it("redacts SSNs, Luhn-valid cards, passports, secrets; leaves phone numbers and prices", () => {
    const r = redactPii("my ssn is 123-45-6789 and card 4111 1111 1111 1111, passport is X1234567, password: hunter2. rent is $2,400, call 415-555-0123");
    assert.equal(r.hits.map((h) => h.kind).sort().join(","), "card_number,passport,secret,ssn_or_itin");
    assert.match(r.text, /\[ssn_or_itin removed\]/);
    assert.match(r.text, /\[card_number removed\]/);
    assert.doesNotMatch(r.text, /4111/);
    assert.match(r.text, /\$2,400/);
    assert.match(r.text, /415-555-0123/);
    assert.equal(redactPii("balance 1234567890123 is not a card").hits.length, 0);
  });
  it("opt-out and opt-in keywords", () => {
    assert.equal(isOptOut("STOP"), true);
    assert.equal(isOptOut("please stop texting"), false);
    assert.equal(isOptOut("unsubscribe"), true);
    assert.equal(isOptIn("start"), true);
  });
  it("immigration status questions route away; visa cards don't", () => {
    assert.equal(isImmigrationStatusQuestion("Will ICE deport me if I miss a payment?"), true);
    assert.equal(isImmigrationStatusQuestion("am i out of status if my job ends"), true);
    assert.equal(isImmigrationStatusQuestion("should I pay my visa card in full?"), false);
    assert.equal(isImmigrationStatusQuestion("what does utilization mean?"), false);
  });
  it("outbound guard catches promises", () => {
    assert.equal(outboundProblems("I guarantee your score will go up by 50 points.").length >= 2, true);
    assert.equal(outboundProblems("You'll be approved for the Platinum.").length, 1);
    assert.equal(outboundProblems("Paying on time usually helps; nothing is guaranteed by anyone.").length, 1);
    assert.equal(outboundProblems("Keep utilization under 10% and pay the statement in full.").length, 0);
  });
});

describe("onboarding", () => {
  it("parses the button prefill", () => {
    assert.deepEqual(parseButtonPrefill("Hi Credit Alien 👽 I'm a student from IND. Help me build U.S. credit."), { segment: "student", country: "IND" });
    assert.deepEqual(parseButtonPrefill("Hey Credit Alien 👽 Help me build my credit."), {});
    assert.deepEqual(parseButtonPrefill("hey"), {});
  });
  it("affirmatives", () => {
    for (const t of ["yes", "YES!", "yeah sure", "ok", "👍", "let's go"]) assert.equal(isAffirmative(t), true, t);
    for (const t of ["no", "what is this", "maybe later"]) assert.equal(isAffirmative(t), false, t);
  });
  it("situation known once SSN and existing-credit status are booleans", () => {
    assert.equal(situationKnown({}), false);
    assert.equal(situationKnown({ has_ssn: true }), false);
    assert.equal(situationKnown({ has_ssn: true, has_credit_account: false }), true);
  });
  it("context completeness", () => {
    assert.equal(contextComplete({}), false);
    assert.equal(missingContext({}).length, 5);
    assert.equal(contextComplete({ income_started: true, savings: 9000, rent: 2400, remittance_monthly: 0, has_credit_account: false }), true);
    assert.equal(contextComplete({ income_started: true, rent: 2400, remittance_monthly: 0, has_credit_account: false }), false);
  });
});

describe("text", () => {
  it("splits long replies into at most two bubbles at a paragraph break", () => {
    const short = "one paragraph";
    assert.deepEqual(splitBubbles(short), [short]);
    const a = "A".repeat(300);
    const b = "B".repeat(300);
    const c = "C".repeat(100);
    const out = splitBubbles(`${a}\n\n${b}\n\n${c}`);
    assert.equal(out.length, 2);
    assert.equal(out[0], a);
    assert.equal(out[1], `${b}\n\n${c}`);
    assert.equal(splitBubbles("X".repeat(900)).length, 1);
  });
  it("strips markdown", () => {
    assert.equal(stripMarkdown("**Pay** the `statement` balance.\n- item"), "Pay the statement balance.\n• item");
  });
  it("normalizes phones", () => {
    assert.equal(normalizePhone("(415) 555-0123"), "+14155550123");
    assert.equal(normalizePhone("+44 20 7946 0958"), "+442079460958");
    assert.equal(normalizePhone("hello"), null);
  });
});

describe("score page", () => {
  it("detects login pages and score pages", async () => {
    const { looksLikeLoginPage, scoreDelta, isHandoffPage, connectedNote, scoreLine } = await import("./score-page");
    // Intuit's post-login hand-off: not a login page, not readable either.
    assert.equal(isHandoffPage("https://www.creditkarma.com/update?code=abc_us-central1_auth-v2-id-token&redirectUrl=http%3A%2F%2Fwww.creditkarma.com%2F"), true);
    assert.equal(isHandoffPage("https://www.creditkarma.com/update?redirectUrl=x&code=abc"), true);
    assert.equal(isHandoffPage("https://www.creditkarma.com/credit-health/transunion/main"), false);
    assert.equal(isHandoffPage("https://www.creditkarma.com/update"), false);
    assert.equal(looksLikeLoginPage("https://www.creditkarma.com/update?code=x", "Today Credit Cards Loans Money"), false);
    // The Credit Health page at phone width.
    assert.equal(looksLikeLoginPage("https://www.creditkarma.com/credit-health/transunion/main", "Credit Health TransUnion Equifax 814out of 850 ▲ 16 Points • Checked Daily Scores checked daily with VantageScore 3.0"), false);
    const facts = { score: 814, score_model: "VantageScore 3.0", bureau: "TransUnion", as_of: "2026-09-13", confidence: "high", utilization_percent: 4, on_time_percent: 100, total_accounts: 6, derogatory_marks: 0, observations: "Six accounts, all current." };
    assert.equal(scoreLine(facts), "814 VantageScore 3.0, TransUnion, as of 2026-09-13");
    assert.equal(scoreLine({ ...facts, score: null }), "no score legible");
    assert.match(connectedNote(facts), /score 814 VantageScore 3.0, TransUnion, as of 2026-09-13 \(confidence high\)\. Utilization 4%, on-time 100%, accounts 6, derogatory 0\./);
    assert.equal(looksLikeLoginPage("https://www.creditkarma.com/auth/logon", ""), true);
    assert.equal(looksLikeLoginPage("https://www.creditkarma.com/", "Log in to Credit Karma. Forgot password? Create an account"), true);
    assert.equal(looksLikeLoginPage("https://www.creditkarma.com/", "Welcome back, Raz. Your score 612 VantageScore 3.0 · TransUnion · Updated today. Credit factors"), false);
    assert.deepEqual(scoreDelta(612, null), { delta: null, material: true });
    assert.deepEqual(scoreDelta(620, 612), { delta: 8, material: false });
    assert.deepEqual(scoreDelta(640, 612), { delta: 28, material: true });
    assert.deepEqual(scoreDelta(null, 612), { delta: null, material: false });
  });
});
