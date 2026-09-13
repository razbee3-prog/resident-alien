"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { USMap, type LatLng } from "@/components/safety/us-map";
import { Button, Pill } from "@/components/ui";
import { relativeTime } from "@/lib/format";
import { hotspotsContext } from "@/lib/hotspots";
import { categories, categoryColor, categoryLabel, EXPIRY_HOURS, NOTE_MAX, noteProblem, placeLabel, roundCoord, type Category, type Report } from "@/lib/safety";

type Mode = "live" | "local" | "demo";

export function SafetyApp() {
  const id = useId();
  const [reports, setReports] = useState<Report[]>([]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<LatLng | null>(null);
  const [category, setCategory] = useState<Category>("presence");
  const [note, setNote] = useState("");
  const [attest, setAttest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [posted, setPosted] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(() => new Set());
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; mode?: Mode; reports?: Report[]; error?: string };
      if (!data.ok) throw new Error(data.error ?? "load failed");
      setReports(data.reports ?? []);
      setMode(data.mode ?? null);
      setLoadError(null);
    } catch {
      setLoadError("Couldn’t load reports. Retrying in a minute.");
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const every = window.setInterval(() => {
      void load();
      setTick((t) => t + 1);
    }, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [load]);

  const onPick = useCallback((p: LatLng) => {
    setPending({ lat: roundCoord(p.lat), lng: roundCoord(p.lng) });
    setPosted(null);
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setFormError("Your browser doesn’t share location. Tap the map instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPending({ lat: roundCoord(pos.coords.latitude), lng: roundCoord(pos.coords.longitude) });
        setFormError(null);
      },
      () => setFormError("Location was blocked. Tap the map where it happened instead."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!pending) return setFormError("Tap the map where it happened, or use your location.");
    if (note.trim().length < 8) return setFormError("Add a sentence about what you saw.");
    const problem = noteProblem(note);
    if (problem) return setFormError(problem);
    if (!attest) return setFormError("Confirm the note describes activity, not a person.");
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...pending, category, note: note.trim(), attest }),
      });
      const data = (await res.json()) as { ok: boolean; report?: Report; error?: string };
      if (!data.ok || !data.report) throw new Error(data.error ?? "failed");
      setReports((r) => [data.report as Report, ...r]);
      setNote("");
      setAttest(false);
      setPending(null);
      setPosted(`Posted. It shows for ${EXPIRY_HOURS} hours, then deletes itself.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn’t post. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(r: Report) {
    if (confirmed.has(r.id)) return;
    setConfirmed((s) => new Set(s).add(r.id));
    try {
      const res = await fetch(`/api/reports/${r.id}/confirm`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; confirmations?: number };
      if (data.ok && typeof data.confirmations === "number") {
        setReports((list) => list.map((x) => (x.id === r.id ? { ...x, confirmations: data.confirmations as number } : x)));
      }
    } catch {}
  }

  void tick;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="panel overflow-hidden">
        <USMap reports={reports} pending={pending} onPick={onPick} />
        <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-5 py-3">
          <p className="text-xs text-muted">{hotspotsContext}</p>
          {mode === "demo" ? <Pill tone="warn">Demo data</Pill> : null}
          {loadError ? <Pill tone="bad">{loadError}</Pill> : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">
        <form onSubmit={submit} className="panel flex flex-col gap-4 p-5" noValidate>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Report activity</p>
            <button type="button" onClick={useMyLocation} className="text-xs text-accent hover:underline">
              Use my location
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-hairline-strong px-3.5 py-2.5 text-sm">
            {pending ? (
              <span className="text-ink">{placeLabel(pending.lat, pending.lng)}</span>
            ) : (
              <span className="text-muted">No location yet. Tap the map where it happened.</span>
            )}
          </div>

          <div>
            <label htmlFor={`${id}-cat`} className="label">
              What you saw
            </label>
            <select id={`${id}-cat`} className="field appearance-none" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`${id}-note`} className="label">
                Activity, not people
              </label>
              <span className="num text-xs text-faint">
                {note.length}/{NOTE_MAX}
              </span>
            </div>
            <textarea
              id={`${id}-note`}
              className="field"
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Two marked vehicles outside the courthouse side entrance, agents inside the lobby."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-faint">No names, faces, plates, or phone numbers.</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#8785ff]" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
            This describes activity I saw myself. I won’t approach or interfere.
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Posting…" : "Post report"}
            </Button>
            {posted ? (
              <p className="text-sm text-good" role="status">
                {posted}
              </p>
            ) : null}
          </div>
          {formError ? (
            <p className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad" role="alert">
              {formError}
            </p>
          ) : null}
        </form>

        <div className="panel flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <p className="text-sm font-medium text-ink">Community reports, last {EXPIRY_HOURS} hours</p>
            <span className="num text-xs text-muted">{reports.length}</span>
          </div>
          <ul className="flex flex-col divide-y divide-hairline overflow-auto lg:max-h-[360px]">
            {reports.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted">{mode ? "Nothing reported in the last few hours." : "Loading reports…"}</li>
            ) : (
              reports.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: categoryColor[r.category] }} aria-hidden="true" />
                    <span className="text-sm font-medium text-ink">{categoryLabel(r.category)}</span>
                    <span className="ml-auto num text-xs text-faint">{relativeTime(r.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted">{placeLabel(r.lat, r.lng)}</p>
                  <p className="text-sm leading-relaxed text-ink/90">{r.note}</p>
                  <button
                    type="button"
                    className={`self-start rounded-md border px-2.5 py-1 text-xs transition-colors ${confirmed.has(r.id) ? "border-good/40 text-good" : "border-hairline-strong text-muted hover:text-ink"}`}
                    onClick={() => confirm(r)}
                    disabled={confirmed.has(r.id)}
                  >
                    {confirmed.has(r.id) ? "Confirmed" : "I saw this too"} · {r.confirmations}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
