import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy" updated="September 2026">
      <p>This page describes what this website collects today. It will be rewritten, with counsel, before any card is issued.</p>
      <h2>Waitlist</h2>
      <p>
        When you join the waitlist we store your email, whether you’re a student or a professional, the country you selected,
        the month you gave, and the optional note about your first bill. We use it to open access in order and to decide
        what to build. We don’t sell it or share it with advertisers.
      </p>
      <h2>Preferences</h2>
      <p>
        The country and segment you pick are saved in your browser’s local storage so the site remembers them. Nothing is
        sent to us until you submit a form.
      </p>
      <h2>Safety center</h2>
      <ul>
        <li>Reports carry a category, a short note, and a location rounded to roughly a city block. We never store precise coordinates.</li>
        <li>There are no accounts. We store a one-way hash of your connection address, salted and rotated daily, only to limit repeat submissions. It cannot be reversed to identify you.</li>
        <li>Reports expire and are deleted a few hours after they are posted.</li>
        <li>We reject notes that appear to name people or identify vehicles.</li>
      </ul>
      <h2>Government requests</h2>
      <p>
        We don’t volunteer data to any agency. If we receive legal process, we will publish what was requested and what, if
        anything, we were compelled to provide, to the extent the law allows.
      </p>
      <h2>Analytics</h2>
      <p>No third-party tracking pixels. If we add privacy-preserving page analytics, this page will say so first.</p>
    </LegalPage>
  );
}
