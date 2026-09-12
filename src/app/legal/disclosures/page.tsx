import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { disclosures } from "@/lib/site";

export const metadata: Metadata = { title: "Disclosures" };

export default function DisclosuresPage() {
  return (
    <LegalPage eyebrow="Legal" title="Disclosures" updated="September 2026">
      <p>{disclosures.long}</p>
      <h2>Card names</h2>
      <p>
        American Express, Platinum, Chase, Sapphire Preferred, and Sapphire Reserve are trademarks of their respective owners.
        They appear here only to describe a goal many newcomers have. Resident Alien has no relationship with those issuers,
        and no page on this site should be read as predicting an approval from them.
      </p>
      <h2>Safety center</h2>
      <p>{disclosures.safety}</p>
    </LegalPage>
  );
}
