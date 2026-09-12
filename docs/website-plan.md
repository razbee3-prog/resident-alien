# Resident Alien — Website Plan (v0.1, Sep 2026)

Domain: resident-alien.com. Source of truth for positioning: `docs/perplexity-brief.md`.
This plan covers what the site says, how it looks, how students and professionals are separated, the card visual, the premium-card messaging, the safety/ICE surface, and the build order. Open questions are at the end.

---

## 1. What the site has to do

One job: turn a newcomer (international student or newly arrived professional) into a waitlist signup, tagged by segment and country of origin, in under 60 seconds.

Second job: prove the thesis on the page. The visitor should *feel* the product — the card reacts to where they're from, the readiness engine runs live, the copy changes when they pick their segment. "AI-native" is shown by the page doing something, not by sparkle icons or a chat bubble.

Guardrails from the brief that the site must respect:

- Never promise Amex Platinum or Chase Sapphire Reserve approval. Promise a faster, cleaner path to the file those cards underwrite.
- Don't claim "first credit card for immigrants." Zolve, Firstcard, Nova Credit exist.
- Not a bank. Not affiliated with Amex or Chase. No score, limit, or approval is guaranteed. Not legal or immigration advice.
- Remittances and ICE stay off the hero.

---

## 2. Visual direction

### What we take from Rho and Mercury (principles, not the look)

| Reference | What we borrow | What we don't |
|---|---|---|
| Rho | Full-width product mockup directly under the hero copy; bento grid of product tiles; one plain-English fee/promise table; "fintech, not a bank" disclosure pattern | Blue SaaS accent; founder-testimonial walls (we have no customers yet) |
| Mercury | Big stat callouts in display type; alternating image/text feature blocks; "$0/month" style plain numbers; business vs personal split at the bottom (we do students vs professionals) | Light theme; press logos |

### Palette (dark-first, near-black, not pure black)

| Token | Hex | Role |
|---|---|---|
| ground | `#0A0A0D` | page background |
| surface | `#141419` | cards, panels (elevation = lighter, not shadows) |
| surface-2 | `#1B1B22` | hover, inputs |
| text | `#ECECF1` | primary type (off-white, never pure white) |
| muted | `#8C8C99` | secondary type, labels |
| border | `rgba(255,255,255,.10)` | 1px hairlines everywhere instead of shadows |
| accent | `#8785FF` | one accent: "stamp ink" violet-blue. Used for the primary CTA, active states, the readiness score. Nowhere else. |
| card-student | graphite matte `#26262E → #0B0B0E` | student card finish |
| card-pro | obsidian brushed `#33333B → #0A0A0D` with a metallic edge highlight | professional card finish |

Why this accent: it's neither the acid-green nor the vermilion every dark fintech site uses, it reads as ink on a passport stamp, and it's calm enough to sit next to a metal card. Alternative on the table: a warm brass (`#D9B45B`) that evokes metal premium cards. Decision needed (Q4).

### Typography

| Role | Face | Notes |
|---|---|---|
| Display | Bricolage Grotesque (700, tight tracking −0.03em, optical size 96) | Characterful, slightly compressed, reads "new" without being a Vercel clone |
| Body | Instrument Sans (400/500) | Neutral, warm, high x-height, 16–18px, 65ch measure |
| Data / labels | Geist Mono (400/500) | Card number, month markers, uppercase eyebrows with +0.08em tracking, dashboard numbers with `tabular-nums` |

Type scale ratio 1.25: 13 / 16 / 20 / 25 / 31 / 39 / 49 / 61.

### Layout and motion

- 12-column grid, 1200px max container, 24px gutters, 96–128px between sections.
- Radius: 16px on panels, 12px on buttons/inputs, 20px on the card visual. Nested elements always smaller radius than the parent.
- Product UI is the imagery. No stock photos, no 3D blobs. Dashboard mockups sit in a thin-bordered dark frame.
- Motion budget: card 3D tilt on pointer, flag swap with a flip, count-up on the timeline months, staggered fade on section entry. Everything respects `prefers-reduced-motion`. Nothing loops forever.
- A barely-visible film grain on the ground so the black doesn't look like flat CSS.

### The card

- Portrait orientation (vertical), 54 × 85.6 ratio, like the current generation of fintech cards.
- Top-left: `RESIDENT ALIEN` wordmark in mono, letter-spaced. Top-right: a small pill reading `STUDENT` or `PROFESSIONAL`.
- **The flag chip.** Where the EMV chip normally sits, a chip-shaped tile carries the flag of the country you moved from, with `FROM · IND` (ISO-3 code) under it. This is the "this is where I'm from" moment. Flags are SVG (the `country-flag-icons` package), never emoji, because emoji flags render as letters on Windows.
- Bottom: `ARRIVED 09 · 26` (the day-one framing; deliberately not Amex's "Member since"), masked number, contactless mark.
- **Interactive on the landing page.** Next to the card: "Where are you from?" with a searchable country picker. Picking a country swaps the flag with a flip. The pick is saved and pre-fills the waitlist form, so the hero doubles as market research.
- Two finishes: Student = graphite matte. Professional = obsidian with a brushed-metal edge highlight. Same shape, same layout, so they read as one family.
- Subtle tilt toward the pointer, a diagonal sheen that moves with the tilt, grain overlay.

---

## 3. Site map

| Route | Purpose | Phase |
|---|---|---|
| `/` | Landing. Segment switch in the hero drives copy, card finish, evidence list, illustrative limit, timeline. | 1 |
| `/students` | Student-only version: I-20/enrollment/sponsor funds evidence, semester-based timeline, OPT/H-1B hand-off, campus FAQ. | 2 |
| `/professionals` | Professional-only version: offer letter/payroll evidence, first-payroll unlock, layoff resilience, 5/24 coaching. | 2 |
| `/how-it-works` | Connect evidence → starter line → AI plan → readiness checkpoint. Could fold into `/` for v1. | 2 |
| `/demo` | Explainable Financial Readiness Engine. Sliders, live score, plain-English reasons. Labeled demo-only. | 2 |
| `/safety` | Immigration awareness center (working name: "Aware"). See section 7. | 3 |
| `/about` | Mission, "why the name," team. | 2 |
| `/legal/terms`, `/legal/privacy`, `/legal/disclosures` | Required once a bank partner is named. | 1 (stub) |
| `/waitlist` | Also available as a modal from every CTA. | 1 |

Nav: Students · Professionals · How it works · Safety · [Join the waitlist]

---

## 4. Landing page — section by section, with draft copy

All copy below is v1 and meant to be argued with.

### 4.1 Hero

Segment control (top of hero, remembered across pages):
`[ I'm a student ]  [ I'm a professional ]`

Eyebrow: `CREDIT FOR PEOPLE WHO JUST GOT HERE`

H1 options (pick one):

1. **You moved countries. Your credit didn't.**  ← recommended. Restates the thesis from the brief in six words, works for both segments.
2. Arrive with a career, not a credit score. We fix the second part.
3. From zero U.S. credit to Platinum-ready. Faster.

Subline, professional:
> Resident Alien turns your offer letter, payroll, and savings into a starter credit line on day one, then coaches your file toward Amex Platinum or Chase Sapphire Reserve eligibility in 12–24 months, not the years most newcomers waste.

Subline, student:
> Resident Alien turns your enrollment, funding, and savings into a starter credit line before your first semester ends, then coaches your file toward premium-card eligibility before you graduate.

CTAs: `Join the waitlist` (primary, accent) · `Run the readiness demo` (secondary, ghost)

Trust line under CTAs, muted, mono:
`Not a bank. Not affiliated with American Express or Chase. No approval is guaranteed.`

Right side: the card, with the country picker.

### 4.2 Stat strip

One number in display type, sourced from the brief:
> **~350,000** international students and newly arrived professionals start a U.S. financial life every year with no credit file.

Small print: new international students 2024/25 + H-1B initial approvals processed abroad. Don't add raw visa issuances.

### 4.3 The problem — "Invisible on day one."

Three tiles, hairline borders, no icons needed:

- **A six-figure offer looks like nothing to a bureau.** Salary, savings, and a decade of repayment history at home don't exist in a U.S. file.
- **The biggest bills land before the first paycheck.** Deposit, rent, phone, laptop, flights. All before you have a U.S. card.
- **The wrong first card costs you the premium one.** Random applications mean inquiries, a stalled score, and a Chase 5/24 count you didn't know you were running.

### 4.4 The path — "The straight line to Platinum and Reserve."

Sub: Most newcomers zigzag: a secured card, a store card, two rejections, a stalled score. We map the shortest clean path and tell you the week you're ready.

Horizontal ladder with month markers:

| Month | Step |
|---|---|
| 0 | Resident Alien starter line. Reports to the bureaus from the first statement. |
| ~6 | First FICO score appears. |
| ~9–12 | Mainstream 1.5–2% cash-back card (the card most Americans actually carry). |
| ~12–18 | Mid-tier travel card (Sapphire Preferred class). |
| ~12–24 | Platinum / Reserve consideration: 720–740+ **and** a clean 12–24 month file. |

Footnote: "Faster" means fewer wasted months, not skipping on-time payments. Timelines are typical, not promised. Card names are trademarks of their issuers; Resident Alien is not affiliated with them.

### 4.5 Two paths — "Same destination. Different evidence."

| | Students | Professionals |
|---|---|---|
| What we read | I-20, enrollment, scholarship or sponsor funds, savings, any authorized income | Offer letter, start date, salary, payroll once it lands, savings, optional foreign credit |
| Starter line (illustrative) | $500–$1,500 | $1,000–$2,500 |
| First unlock | On-time payments + confirmed enrollment each term | First payroll deposit |
| Coach focus | A real file before graduation, so OPT and H-1B life start with a score | Fast, clean growth toward Platinum/Reserve while staying under 5/24 |
| Risk we plan for | Funding that's real but not W-2 income | One sponsor: a layoff hits money and status together |

Each column ends with `See the student path →` / `See the professional path →`.

### 4.6 The AI coach — "A coach, not a chatbot."

Dashboard mockup (score trend, utilization gauge, on-time streak, readiness row: Mainstream ✓ · Mid-tier ◐ · Premium ✗ est. May 2028).

Copy:
- Weekly actions: what to charge, when to pay, where to cap utilization (we say 10%, not 30%).
- Alerts before damage: missed autopay, utilization creeping up, an application you shouldn't submit, your 5/24 count.
- Reporting check: we confirm the bureaus received the right file, under the right identifiers.
- The readiness call: we tell you the month you look ready for mid-tier, and the month for premium. Not before.

Line from the brief: *We don't hand you Platinum. We make you the borrower Platinum and Reserve approve.*

### 4.7 Evidence translation — "We read what you actually have."

Chips: Offer letter · Payroll · I-20 · Sponsor funds · Savings · Foreign credit (optional) · Rent and remittance obligations.
Sub: A conventional lender sees no U.S. file and stops. We see a verified job or enrollment, real savings, and real obligations, then show you a path. We don't invent a credit score. We translate evidence.

### 4.8 Live demo teaser

Embedded slice of the readiness engine: the demo applicant from the brief (H-1B engineer, $110k, 21 days to start, $9k savings, $2,400 rent) with two sliders (rent, remittance) updating readiness live. `DEMO ONLY · NOT A CREDIT DECISION` badge always visible. Link to `/demo`.

### 4.9 Safety teaser (quiet, near the bottom)

One low-key panel: **Know what's happening around you.** Verified immigration-enforcement activity, policy changes that affect your status, and your rights, in one place. `Open the safety center →`

### 4.10 FAQ

- Why "Resident Alien"? It's what the IRS calls you on day one. We think you deserve a better card than a tax status.
- Do I need an SSN? (answer depends on the issuing partner; write once known)
- Is this a secured card? Not by default. Secured is the fallback path when the evidence doesn't support a starter line yet, and we say so plainly.
- Will you share my data with the government? (write with counsel; reference the Right to Financial Privacy Act, no fear framing)
- Are you Amex or Chase? No. We're the on-ramp to the file they underwrite.
- What does "faster" actually mean? Fewer wasted months, no skipped payments.

### 4.11 Final CTA + waitlist — "Day one starts now."

Form fields (the form is also our research instrument):
email · I'm a [student / professional] · country of origin (pre-filled from the card picker) · arriving / arrived (month) · optional: "What's the first bill that hurt most?" (free text, answers open question #6 in the brief)

### 4.12 Footer

Links per site map. Disclosures block:
> Resident Alien is a financial technology company, not a bank. Card and banking services will be provided by a partner bank, Member FDIC (to be announced). Resident Alien is not affiliated with, endorsed by, or sponsored by American Express or JPMorgan Chase. "Platinum," "Sapphire Reserve," and other card names are trademarks of their owners. Nothing on this site is a credit decision, an offer of credit, a credit score, or legal or immigration advice.

---

## 5. Student vs professional: how the split actually works

1. **One switch, remembered.** The hero segment control sets a `segment` value (URL param + localStorage). Every segment-aware block on the site reads it: hero copy, card finish and pill, evidence chips, illustrative limit, timeline labels, FAQ order, waitlist default.
2. **Two dedicated pages** (`/students`, `/professionals`) for people who arrive from search or a shared link. Same components, different content files.
3. **Same accent, different finish.** We don't give each segment its own color (two accents dilute the brand). The difference is the card finish, the label, and the words. Ask: is that enough differentiation for you, or do you want each segment to own a color?
4. **Default segment on `/`:** the brief says professionals are the wedge and the demo persona. Recommendation: default to Professional, with the Student tab visibly one click away. Decision needed (Q3).

---

## 6. Premium-card messaging: where it lives and how it's guarded

- Hero subline names both cards (professional variant). Student variant says "premium-card eligibility" and names the cards in the path section instead.
- Section 4.4 is the dedicated moment: the ladder, the months, the 720–740+ target, the "and a clean file" caveat.
- No card art, no issuer logos, no "Platinum" in a display-size headline by itself. Nominative reference in body copy only.
- Every mention carries the not-affiliated / not-guaranteed footnote within view.

---

## 7. Safety / ICE awareness

The brief says keep ICE off the hero. You want an ICE tracker. Both can be true: it's a separate surface, not a hero feature.

Three models, in rising order of risk:

| Model | What it is | Risk |
|---|---|---|
| **A. Rights + alerts** | Know-your-rights content, what to do if approached, printable rights card, verified policy changes affecting F-1/H-1B/OPT (revocations, travel restrictions), rapid-response and legal-aid hotlines by city, a plain statement of what Resident Alien shares and doesn't. | Low. |
| **B. Verified activity map** | A map by metro/state showing enforcement activity in the last 30 days, built only from verifiable sources: local news, official ICE/ERO releases, court filings, TRAC data, published alerts from established rapid-response networks. Each pin cites its source. | Medium. Needs an editorial process and a sourcing policy. |
| **C. Crowdsourced sightings** | Anonymous user reports of agent locations, ICEBlock-style. | High. Apple removed ICEBlock from the App Store in October 2025 under DOJ pressure and Google pulled similar apps; the developer is suing. A web app avoids the app store but not the pressure, and a future card-issuing bank partner's compliance team will almost certainly refuse to co-brand with it. False reports create liability. |

Recommendation: ship **A + B** as v1 under a working name ("Aware" or "Safety Center") at `/safety`, linked from the nav, teased quietly near the bottom of the landing page. Revisit C with counsel, and possibly as a separate brand, once there is a bank partner in the room. Decision needed (Q7).

Framing rule from the brief: transparent, not fear-based; not legal advice. The audience is legally present; their realistic concerns are status disruption and data sharing, plus awareness of enforcement near campus or work.

---

## 8. Build plan

### Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4, deployed on Vercel, `resident-alien.com` via Vercel DNS.
- Motion: `motion` (Framer Motion). Primitives: shadcn/ui. Flags: `country-flag-icons` (SVG).
- Waitlist: a Postgres table (Supabase or Neon) behind a route handler, confirmation email via Resend. Keep it ours; the country and "first bill" answers are the research data.
- Readiness engine: deterministic TypeScript on the client (no model call needed for the numbers). Optional "explain my plan" endpoint backed by an LLM for the plain-English reasons, server-side, rate-limited.
- Safety map: MapLibre GL with OpenStreetMap tiles; activity data as a curated JSON file plus an RSS ingester, reviewed before publish.
- Analytics: Vercel Analytics or Plausible. OG images generated per segment.

### Phases

| Phase | Ships | Rough effort |
|---|---|---|
| 1 | Scaffold, design tokens, nav/footer, hero with card + country picker + segment switch, problem, path, two paths, coach mockup, FAQ, waitlist form + DB, legal stubs, OG image | 2–3 days |
| 2 | `/students`, `/professionals`, `/demo` readiness engine with sliders, `/about` | 2 days |
| 3 | `/safety` v1 (rights + verified map), sourcing policy | 2 days |
| 4 | Polish: motion pass, Lighthouse, a11y (focus rings, 44px targets, contrast), SEO, domain | 1 day |

### Explicitly not built

Real KYC, real card issuing, real bureau pulls, real remittances, crowdsourced ICE reporting, a generic chatbot, testimonials (we have none, and fake ones are out).

---

## 9. Open questions

Blocking questions are marked **[blocks build]**. Each has the default I'll use if you don't answer.

1. **[blocks build] Which "Ro"?** You said "RAW and Mercury" then "like how Ro does it." Rho (rho.co) is a Mercury competitor with a light theme; Ramp (ramp.com) is the spend platform with a black-and-yellow brand. Which did you mean, and what specifically do you like about it: the hero mockup, the bento grid, the type, the density? *Default: I take the structural principles listed in section 2 from both and build our own dark system.*
2. **[blocks build] What's the CTA today?** Waitlist only, or is there a bank/issuing partner and an "Apply" flow? If a partner exists, who, so the disclosures can be written. *Default: waitlist.*
3. **Default segment on the landing page:** Professional (the wedge) or Student (the larger annual flow)? *Default: Professional.*
4. **Accent:** violet-blue "stamp ink" or warm brass? Or something else you have in mind? Any existing logo, wordmark, or brand file? *Default: stamp ink.*
5. **The card:** portrait or landscape? Name on the card, or leave it nameless in the mock? Show a masked number? Are the two finishes (graphite vs obsidian) the right amount of student/pro difference, or do you want each segment to own a color? *Default: portrait, no name, masked number, two finishes.*
6. **Premium-card copy:** are you comfortable naming Amex Platinum and Chase Sapphire Reserve in the hero subline (professional variant) with the footnote, or would you rather keep the names to the path section? *Default: hero subline + path section, footnote on both.*
7. **[blocks phase 3] Safety center model:** A, A+B, or C? Same brand at `/safety`, or a separate name/subdomain? Do you have or want counsel involved? *Default: A+B at /safety.*
8. **Demo engine:** embedded slice on the landing page plus a full `/demo`, or `/demo` only? Keep the remittance "safe to send" slider, given the brief moved remittances off the lead? *Default: both, keep the slider but label it secondary.*
9. **Deadline:** when is the hackathon, and is this site for the hackathon demo, the real launch, or both? That changes how much of phases 2–3 exist by demo day. *Default: phase 1 first, everything else after.*
10. **Tech:** Next.js on Vercel OK? Where is the domain registered, and do you control DNS? Any preference for the waitlist backend? *Default: Next.js, Vercel, Supabase.*
11. **Numbers on the page:** show the ~350,000 figure? Any other stat you want up top? *Default: show it with the small-print source.*
12. **Name and tone:** the domain settles "Resident Alien." How much of a wink do you want: a dry line in the FAQ, or a visible sci-fi undercurrent in the design? *Default: dry wink in copy, none in the visuals.*
13. **Product naming:** "Resident Alien for Students" / "for Professionals," or product names for the two cards? *Default: "for Students" / "for Professionals."*
14. **Team page:** who's on it, and is there a photo policy? *Default: skip until asked.*
