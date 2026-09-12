import type { Segment } from "./segments";

export type ReadinessInput = {
  segment: Segment;
  annualIncome: number; // salary, or annual funding for students
  savings: number;
  rent: number;
  essentials: number;
  remittance: number;
  daysToStart: number; // 0 when already started
  incomeStarted: boolean; // payroll landed, or funding disbursed
  foreignCredit: boolean;
};

export type Tone = "good" | "warn" | "bad" | "muted";
export type Path = "starter" | "starter-low" | "secured" | "not-yet";

export type ReadinessResult = {
  score: number;
  path: Path;
  pathLabel: string;
  limit: number;
  safeToSend: number;
  runwayMonths: number;
  capacityRatio: number;
  monthlyIncome: number;
  obligations: number;
  reasons: { text: string; tone: Tone }[];
  nextUnlock: string;
  premiumEta: string;
  readiness: { mainstream: "ready" | "soon" | "not-yet"; midTier: "ready" | "soon" | "not-yet"; premium: "ready" | "soon" | "not-yet" };
};

export const demoApplicant: ReadinessInput = {
  segment: "professional",
  annualIncome: 110_000,
  savings: 9_000,
  rent: 2_400,
  essentials: 1_100,
  remittance: 500,
  daysToStart: 21,
  incomeStarted: false,
  foreignCredit: false,
};

export const demoStudent: ReadinessInput = {
  segment: "student",
  annualIncome: 42_000,
  savings: 6_000,
  rent: 1_300,
  essentials: 700,
  remittance: 0,
  daysToStart: 10,
  incomeStarted: true,
  foreignCredit: false,
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const floorTo = (n: number, step: number) => Math.floor(n / step) * step;

export function assess(i: ReadinessInput): ReadinessResult {
  const monthly = Math.max(0, i.annualIncome) / 12;
  const obligations = Math.max(0, i.rent) + Math.max(0, i.essentials) + Math.max(0, i.remittance);
  const disposable = monthly - obligations;
  const capacityRatio = monthly > 0 ? disposable / monthly : 0;
  const runway = obligations > 0 ? i.savings / obligations : 6;
  const rentRatio = monthly > 0 ? i.rent / monthly : 1;
  const remitRatio = monthly > 0 ? i.remittance / monthly : 0;

  let score = 12;
  const reasons: ReadinessResult["reasons"] = [];

  // Evidence of income or funding
  if (i.segment === "professional") {
    score += 25 + (i.incomeStarted ? 10 : 0);
    reasons.push(
      i.incomeStarted
        ? { text: "Payroll is landing. That’s verified income, not a promise.", tone: "good" }
        : {
            text: `Signed offer, ${i.daysToStart} day${i.daysToStart === 1 ? "" : "s"} to start. Income is verifiable but not yet flowing.`,
            tone: "good",
          },
    );
  } else {
    score += 22 + (i.incomeStarted ? 8 : 0);
    reasons.push(
      i.incomeStarted
        ? { text: "Enrollment confirmed and funding disbursed to a U.S. account.", tone: "good" }
        : { text: "I-20 and funding letter on file. Disbursement not yet visible.", tone: "warn" },
    );
  }

  // Capacity after obligations
  const capPts = clamp(capacityRatio / 0.35, 0, 1) * 25;
  score += capPts;
  const capPct = Math.round(capacityRatio * 100);
  if (capacityRatio >= 0.35) reasons.push({ text: `After rent, essentials, and transfers, ${capPct}% of income is free. Strong capacity.`, tone: "good" });
  else if (capacityRatio >= 0.15) reasons.push({ text: `${capPct}% of income is free after obligations. Enough for a small line.`, tone: "warn" });
  else reasons.push({ text: `Obligations take ${100 - Math.max(0, capPct)}% of income. Very little room.`, tone: "bad" });

  // Runway before first pay
  const runPts = clamp(runway / 2, 0, 1) * 20;
  score += runPts;
  const runwayText = runway >= 6 ? "6+" : runway.toFixed(1);
  if (runway >= 2) reasons.push({ text: `Savings cover ${runwayText} months of obligations before the first paycheck.`, tone: "good" });
  else if (runway >= 1) reasons.push({ text: `Savings cover ${runwayText} months of obligations. Thin, but workable.`, tone: "warn" });
  else reasons.push({ text: `Savings cover under a month of obligations. The gap to first pay is the risk.`, tone: "bad" });

  // Obligation ratios
  if (rentRatio > 0.4) {
    const pen = Math.min(10, (rentRatio - 0.4) * 50);
    score -= pen;
    reasons.push({ text: `Rent is ${Math.round(rentRatio * 100)}% of income. That’s the number a lender worries about.`, tone: "warn" });
  }
  if (remitRatio > 0.15) {
    const pen = Math.min(5, (remitRatio - 0.15) * 33);
    score -= pen;
    reasons.push({ text: `Transfers home are ${Math.round(remitRatio * 100)}% of income. Counted as a fixed obligation.`, tone: "warn" });
  }

  // Foreign credit
  if (i.foreignCredit) {
    score += 8;
    reasons.push({ text: "Foreign credit history read through a partner bureau. Helps the starter decision.", tone: "good" });
  } else {
    reasons.push({ text: "No foreign credit on file. Optional, doesn’t block.", tone: "muted" });
  }

  // Distance to start
  if (i.daysToStart > 60) score -= 10;
  else if (i.daysToStart > 30) score -= 5;

  score = Math.round(clamp(score, 0, 100));

  const isStudent = i.segment === "student";
  let path: Path;
  let limit = 0;
  if (score >= 75) {
    path = "starter";
    limit = floorTo(clamp(disposable * 0.3, 500, isStudent ? 1500 : 2500), 500);
  } else if (score >= 60) {
    path = "starter-low";
    limit = floorTo(clamp(disposable * 0.2, 300, isStudent ? 800 : 1000), 100);
  } else if (score >= 45) {
    path = "secured";
    limit = floorTo(clamp(i.savings * 0.1, 200, 500), 50);
  } else {
    path = "not-yet";
  }

  const pathLabel =
    path === "starter"
      ? "Controlled starter line"
      : path === "starter-low"
        ? "Lower-limit starter line"
        : path === "secured"
          ? "Secured fallback"
          : "Readiness path";

  const buffer = i.savings - obligations;
  const safeToSend = i.remittance > 0 ? floorTo(clamp(buffer * 0.07, 0, i.remittance), 10) : 0;

  let nextUnlock: string;
  if (path === "not-yet") {
    nextUnlock = isStudent
      ? "Funding disbursed to a U.S. account, then reassess."
      : "First payroll deposit, then reassess. Until then: open checking, set up direct deposit.";
  } else if (i.segment === "professional" && !i.incomeStarted) {
    const next = floorTo(clamp(disposable * 0.45, limit, 5000), 500);
    nextUnlock = `First payroll deposit. Line reassessed toward $${next.toLocaleString()}.`;
  } else if (isStudent) {
    nextUnlock = "Confirmed enrollment next term plus three on-time statements.";
  } else {
    nextUnlock = "Three on-time statements at under 10% utilization. Then a higher line.";
  }

  const premiumEta = score >= 75 ? "12–18 months of clean history" : score >= 60 ? "18–24 months of clean history" : "24+ months, after the file exists";

  const readiness: ReadinessResult["readiness"] =
    path === "not-yet"
      ? { mainstream: "not-yet", midTier: "not-yet", premium: "not-yet" }
      : path === "secured"
        ? { mainstream: "soon", midTier: "not-yet", premium: "not-yet" }
        : { mainstream: "soon", midTier: "not-yet", premium: "not-yet" };

  return {
    score,
    path,
    pathLabel,
    limit,
    safeToSend,
    runwayMonths: runway,
    capacityRatio,
    monthlyIncome: monthly,
    obligations,
    reasons,
    nextUnlock,
    premiumEta,
    readiness,
  };
}
