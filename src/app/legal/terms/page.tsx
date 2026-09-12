import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of use" updated="September 2026">
      <p>By using this website you agree to the following. These terms cover the website only; a card agreement, when one exists, will be a separate document from the issuing bank.</p>
      <h2>Nothing here is advice</h2>
      <p>Content on this site is general information. It is not financial, legal, tax, or immigration advice, and it is not a substitute for a licensed professional who knows your situation.</p>
      <h2>Safety center</h2>
      <ul>
        <li>Report activity, never people. Don’t submit names, faces, license plates, or anything that identifies an individual.</li>
        <li>Never approach, follow, obstruct, or interfere with enforcement activity. This tool exists for awareness, not intervention.</li>
        <li>Community reports are unverified. Use them alongside official sources and your own judgment.</li>
        <li>We remove reports that break these rules and may block connections that abuse the tool.</li>
      </ul>
      <h2>Availability</h2>
      <p>The site is provided as is. We may change or remove features at any time while the product is pre-launch.</p>
    </LegalPage>
  );
}
