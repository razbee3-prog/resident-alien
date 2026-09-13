/**
 * Curated, approved knowledge the coach may teach from. Kept in the cached system prompt until it outgrows
 * ~50k tokens; then move to retrieval. Every claim here is either CFPB-level general guidance or an explicitly
 * hedged product statement. Nothing here is a source for a user's balances, dates, or scores.
 */
export const KNOWLEDGE = `
# credit_canon (CFPB and bureau education)
- A U.S. credit score summarizes the credit report; the biggest inputs are payment history and how much of available credit is in use (utilization). Length of history, mix of accounts, and recent applications (hard inquiries) matter less.
- Payment history: one payment 30+ days late can stay on a report for up to seven years. Autopay for at least the minimum is the single most protective habit.
- Utilization: it is computed from the balance the card reports (usually the statement balance), not from spend. Keeping reported utilization under 10% is a strong target; under 30% is the common ceiling. Paying before the statement closes lowers the reported balance.
- Nobody needs to carry a balance or pay interest to build credit. Paying the statement balance in full every month builds history and costs nothing.
- Statement balance vs current balance vs minimum payment: the statement balance is what was owed on the closing date; the current balance includes new charges; the minimum is the smallest amount that avoids a late mark. Pay at least the statement balance to avoid interest.
- Hard inquiries: each application can cost a few points for up to a year and stays visible for two. Apply only for credit you need; two rejections in a row is a sign to stop and build first.
- Thin file / no score: a score typically appears once at least one account has reported for about six months. A first reporting account (a starter or secured card, or a credit-builder loan) is the unlock.
- Credit reports: free weekly reports from all three bureaus at annualcreditreport.com. Check that name, addresses, and every account are yours; dispute errors with the bureau in writing. Formal disputes go through a secure process, not text.
- Chase "5/24": Chase generally declines new card applications from people who opened five or more cards in the last 24 months. Newcomers running random applications burn this count without knowing.
- Premium cards (Amex Platinum, Chase Sapphire Reserve class): commonly cited approval profiles are 720 to 740+ with a 12 to 24 month clean file and income that supports the fees. No score or history guarantees approval; issuers decide.

# newcomer_finance
- SSN: employers sponsor the SSN application after arrival; many students get one only with on-campus work authorization. An ITIN is a tax number and is accepted by some issuers instead of an SSN. Without either, options narrow to a few issuers that accept passport + visa + U.S. address; say "some issuers" and never name one as guaranteed.
- Foreign credit history does not transfer. A few partners (Nova Credit is the best known) can translate some countries' files for participating issuers; it helps a decision, it does not create a U.S. score.
- First 90 days priority order: U.S. checking account and direct deposit → one reporting credit account → autopay → small recurring charge → pay in full → wait for the score to appear (about six months) → then a mainstream card.
- Students (F-1): a credit card is not employment. Keep authorized-work rules with the DSO. Funding letters and sponsor funds count as capacity for the starter decision, not as income.
- Professionals (H-1B / OPT): one sponsor means a layoff hits money and status together. Keep an emergency reserve before optimizing anything about credit.

# product_terms (Resident Alien; illustrative until the issuing partner is announced)
- Resident Alien is a financial technology company, not a bank. Card and banking services would be provided by a partner bank, Member FDIC, to be announced. Nothing the coach says is a credit decision, an offer of credit, a credit score, or legal or immigration advice.
- The planned starter line is sized from evidence (offer letter or I-20, payroll or funding, savings, obligations) and is illustrative: $500 to $1,500 for students, $1,000 to $2,500 for professionals. Secured is the fallback when evidence does not support a starter line yet.
- Credit-builder accounts commonly report to the bureaus monthly. Do not assume weekly furnishing. Do not assert that an account is reporting until it is verified.
- Not affiliated with, endorsed by, or sponsored by American Express or JPMorgan Chase. Card names are their owners' trademarks.

# remittance
- Compare transfers by what the recipient receives after fees and the exchange-rate margin, for the same delivery method and speed. "No fee" often hides the cost in the rate.
- Send from cash you have after rent, essentials, an emergency reserve, and required debt payments. Never fund a transfer with a credit card or cash advance; the interest and fees outrun any savings.
- Fees, rates, and tax treatment differ by corridor and change; when live numbers are not available, say so and give the method for comparing rather than a figure.

# operations_playbooks
- Formal dispute intent (an account they do not recognize, a wrong late mark): explain the free report check, then route to the secure dispute flow or a human; do not draft the dispute over text.
- Hardship (job loss, funding cut, medical): switch to protect-the-file mode: minimum payments on autopay from savings, no new applications, pause score optimization, keep the reserve. Offer the human handoff.
- Fraud suspected: freeze advice (each bureau offers a free freeze), then human handoff.
- Individual immigration or ICE questions: do not answer; refer to the DSO, employer counsel, or a licensed immigration attorney, and the site's Safety page hotlines.
`.trim();
