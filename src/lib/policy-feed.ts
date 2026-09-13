export type FeedTag = "F-1" | "H-1B" | "All visas";
export type FeedItem = {
  date: string; // ISO date, used for ordering
  label: string; // how the date reads on the page
  tags: FeedTag[];
  title: string;
  body: string;
  status?: string;
  source: { name: string; url: string };
};

/** Newest first. Bite-sized, sourced, and not legal advice. */
export const policyFeed: FeedItem[] = [
  {
    date: "2026-09-09",
    label: "Sep 9, 2026",
    tags: ["F-1"],
    title: "CPT narrowed to required coursework.",
    body: "SEVP guidance now limits Curricular Practical Training to work that is a required part of your curriculum. Optional internships for credit are a harder case. Check with your DSO before accepting.",
    status: "In effect",
    source: { name: "Georgetown ISSS", url: "https://internationalservices.georgetown.edu/immigration-updates/" },
  },
  {
    date: "2026-09-15",
    label: "Sep 15, 2026",
    tags: ["F-1"],
    title: "Duration of status ends.",
    body: "New F-1 entries get a fixed “admit until” date: your I-20 end date, capped at four years, plus 30 days. Enrolled before Sept 15? You keep the 60-day grace until you travel or extend.",
    status: "Takes effect Sep 15",
    source: { name: "DHS", url: "https://www.dhs.gov/news/2026/07/16/trump-administration-issues-final-rule-end-foreign-student-visa-abuse" },
  },
  {
    date: "2026-09-14",
    label: "Sep 15, 2026",
    tags: ["F-1"],
    title: "OPT survives. The clock tightens.",
    body: "12-month OPT and the 24-month STEM extension stay. File within 30 days of your DSO’s recommendation, and use all post-completion OPT within 14 months of your program end.",
    status: "Takes effect Sep 15",
    source: { name: "Study in the States", url: "https://studyinthestates.dhs.gov/final-rule-establishing-a-fixed-time-period-of-admission-and-an-extension-of-stay-procedure-faq" },
  },
  {
    date: "2026-09-03",
    label: "Sep 2026",
    tags: ["All visas"],
    title: "Record arrests, quieter tactics.",
    body: "About 50,000 ICE arrests in August 2026, matching July’s record, with fewer visible city surges and more dispersed operations nationwide.",
    source: { name: "NBC News", url: "https://www.nbcnews.com/news/us-news/ice-arrests-50-thousand-people-august-continuing-record-rcna595510" },
  },
  {
    date: "2026-07-24",
    label: "Jul 24, 2026",
    tags: ["H-1B"],
    title: "The $100,000 H-1B fee is blocked, for now.",
    body: "A Massachusetts federal court vacated the fee on June 8. On July 24 the First Circuit refused to pause that ruling. A D.C. court had upheld the fee in December, so appeals continue.",
    status: "Blocked in court",
    source: { name: "CNBC", url: "https://www.cnbc.com/2026/06/08/trump-h1b-visa-fee-blocks.html" },
  },
  {
    date: "2026-07-22",
    label: "Aug 1, 2026",
    tags: ["All visas"],
    title: "African visa services moved to regional hubs.",
    body: "Applicants in many African countries now interview at designated hub posts rather than their home embassy. Plan travel and appointment timing early.",
    status: "In effect",
    source: { name: "Georgetown ISSS", url: "https://internationalservices.georgetown.edu/immigration-updates/" },
  },
  {
    date: "2026-07-17",
    label: "Jul 17, 2026",
    tags: ["All visas"],
    title: "USCIS resumes cases for travel-ban nationals.",
    body: "Benefit requests from nationals of the 39 travel-ban countries, paused since late 2025, are being processed again. Entry restrictions themselves remain.",
    status: "In effect",
    source: { name: "Georgetown ISSS", url: "https://internationalservices.georgetown.edu/immigration-updates/" },
  },
  {
    date: "2026-02-26",
    label: "Feb 26, 2026",
    tags: ["H-1B"],
    title: "The lottery now favors higher pay.",
    body: "Cap registrations are weighted by wage level: a Level IV offer gets four entries, Level I gets one. In force from the FY2027 season.",
    status: "In effect",
    source: { name: "USCIS", url: "https://www.uscis.gov/newsroom/news-releases/dhs-changes-process-for-awarding-h-1b-work-visas-to-better-protect-american-workers" },
  },
  {
    date: "2026-01-01",
    label: "Jan 1, 2026",
    tags: ["F-1", "All visas"],
    title: "Travel ban expanded to 39 countries.",
    body: "Full entry restrictions for 19 countries and partial ones for 20 more, covering F, M, and J visas in most partial-ban countries. Visas issued before January 1 generally still work, with extra vetting.",
    status: "In effect",
    source: { name: "MIT ISO", url: "https://iso.mit.edu/news/travel-ban-expansion-effective-january-1-2026/" },
  },
  {
    date: "2025-12-01",
    label: "Rolling out",
    tags: ["All visas"],
    title: "A $250 visa integrity fee.",
    body: "Signed into law in July 2025 and charged at visa issuance on top of the $185 application fee. Rollout expected by Sept 30, 2026; some posts already collect it.",
    status: "Rolling out",
    source: { name: "BU ISSO", url: "https://www.bu.edu/isso/2026/05/19/visa-integrity-fee/" },
  },
  {
    date: "2025-06-18",
    label: "Jun 2025",
    tags: ["F-1"],
    title: "Social media must be public.",
    body: "F, M, and J applicants list every handle from the past five years on the DS-160 and set profiles to public. Keeping accounts private can be read as evasion.",
    status: "In effect",
    source: { name: "Yale OISS", url: "https://oiss.yale.edu/news/department-of-state-announces-enhanced-social-media-vetting-and-resumption-of-visa-interview-scheduling" },
  },
];
