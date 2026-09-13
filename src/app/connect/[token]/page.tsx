import type { Metadata } from "next";
import { ConnectClient } from "@/components/connect-client";
import { Container } from "@/components/ui";
import { browserEnabled } from "@/lib/coach/browser-flag";
import { coachAvailable } from "@/lib/coach/db";
import * as store from "@/lib/coach/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect Credit Karma · Credit Alien", robots: { index: false, follow: false } };

export default async function ConnectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const state = store.linkState(coachAvailable ? await store.getLinkToken(token) : null);
  const done = state === "completed";
  const expired = state === "missing" || state === "expired";

  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-[56rem]">
        <p className="eyebrow">Credit Alien · Demo</p>
        {!browserEnabled ? (
          <Notice title="Not enabled right now." body="The score check is switched off on this deployment. Text Credit Alien and it will keep coaching from what you tell it." />
        ) : done ? (
          <Notice title="Already connected." body="This link was used. Check your texts for the score, or text “check my score” for a fresh read." />
        ) : expired ? (
          <Notice title="This link expired." body="Links last 15 minutes. Text Credit Alien “check my score” and it will send a new one." />
        ) : (
          <ConnectClient token={token} />
        )}
      </div>
    </Container>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel mt-4 p-6">
      <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
    </div>
  );
}
