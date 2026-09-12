"use client";

import { useId, useState, type FormEvent } from "react";
import { CountryPicker } from "@/components/country-picker";
import { Button } from "@/components/ui";
import { defaultCountry, findCountry } from "@/lib/countries";
import { setPref, usePrefs } from "@/lib/prefs";
import type { Segment } from "@/lib/segments";

type State = { status: "idle" | "sending" | "done" | "error"; message?: string };

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const prefs = usePrefs();
  const segment: Segment = prefs.segment ?? "professional";
  const country = findCountry(prefs.country) ?? defaultCountry;
  const [email, setEmail] = useState("");
  const [arrival, setArrival] = useState("");
  const [firstBill, setFirstBill] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, segment, country: country.a2, arrival: arrival || null, firstBill }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setState({ status: "done" });
      else setState({ status: "error", message: data.error ?? "Something didn’t save. Try again." });
    } catch {
      setState({ status: "error", message: "No connection. Check your network and try again." });
    }
  }

  if (state.status === "done") {
    return (
      <div className="panel p-7" role="status" aria-live="polite">
        <p className="eyebrow">You’re on the list</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-[-0.02em]">Day one starts when you land.</p>
        <p className="mt-3 max-w-[32rem] text-[0.95rem] leading-relaxed text-muted">
          We’ll email {email} when the {segment} card opens for people from {country.name}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`grid gap-5 ${compact ? "" : "panel p-7 md:p-9"}`} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-email`} className="label">
            Email
          </label>
          <input
            id={`${id}-email`}
            type="email"
            required
            autoComplete="email"
            className="field"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <span className="label">I’m a</span>
          <div className="flex h-11 rounded-xl border border-hairline bg-surface-2 p-1" role="group" aria-label="Segment">
            {(["student", "professional"] as Segment[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={segment === s}
                onClick={() => setPref("segment", s)}
                className={`flex-1 rounded-lg text-sm font-medium capitalize transition-colors ${segment === s ? "bg-ink text-ground" : "text-muted hover:text-ink"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CountryPicker
          label="Coming from"
          value={country}
          onChange={(c) => setPref("country", c.a2)}
        />
        <div>
          <label htmlFor={`${id}-arrival`} className="label">
            Arriving or arrived, month
          </label>
          <input id={`${id}-arrival`} type="month" className="field" value={arrival} onChange={(e) => setArrival(e.target.value)} />
        </div>
      </div>

      {!compact ? (
        <div>
          <label htmlFor={`${id}-bill`} className="label">
            Optional: what’s the first bill that hurt most?
          </label>
          <textarea
            id={`${id}-bill`}
            className="field"
            rows={2}
            maxLength={300}
            placeholder="Deposit and first month’s rent before I had a U.S. card…"
            value={firstBill}
            onChange={(e) => setFirstBill(e.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={state.status === "sending"}>
          {state.status === "sending" ? "Saving…" : "Join the waitlist"}
        </Button>
        <p className="text-xs text-faint">No spam. One email when your card opens.</p>
      </div>
      {state.status === "error" ? (
        <p className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
