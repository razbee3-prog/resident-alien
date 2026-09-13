"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "starting" | "phone" | "login" | "reading" | "done" | "error" | "ended";

/**
 * Hosted-browser login (demo). The user logs into Credit Karma inside a Browserbase live view on a laptop; nothing they
 * type passes through our servers. "I'm logged in" asks the server to read the score page. Phone keyboards don't reach
 * the remote browser, so on phones we ask for a laptop instead of starting a session.
 */
export function ConnectClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Opening a private browser…");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setPhase("phone");
        setMessage("Open this link on a laptop to connect Credit Karma once. On your phone, the fastest way is to text Credit Alien a screenshot of your score card.");
        return;
      }
      try {
        const res = await fetch(`/api/connect/${token}/start`, { method: "POST" });
        const json = (await res.json()) as { ok: boolean; liveViewUrl?: string; error?: string };
        if (!res.ok || !json.ok || !json.liveViewUrl) {
          setPhase("error");
          setMessage(json.error ?? "Couldn’t open the browser.");
          return;
        }
        setLiveUrl(json.liveViewUrl);
        setPhase("login");
        setMessage("Log in to Credit Karma below, including any code they text you. Then tap the button.");
      } catch {
        setPhase("error");
        setMessage("Couldn’t reach the server. Reload to try again.");
      }
    })();
  }, [token]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data === "browserbase-disconnected") {
        setPhase((p) => (p === "done" ? p : "ended"));
        setMessage("The browser session ended. Text Credit Alien “check my score” for a new link.");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  async function complete() {
    setBusy(true);
    setPhase("reading");
    setMessage("Reading your score page… this takes about 20 seconds.");
    try {
      const res = await fetch(`/api/connect/${token}/complete`, { method: "POST" });
      const json = (await res.json()) as { ok: boolean; score?: number | null; reason?: string; notes?: string; error?: string };
      if (json.ok) {
        setPhase("done");
        setMessage(json.score !== null && json.score !== undefined ? `Done. Your score is ${json.score}. Check your texts.` : "Connected, but no score was visible on the page yet. Check your texts for what to do next.");
      } else if (json.reason === "not_logged_in") {
        setPhase("login");
        setMessage(`Not logged in yet${json.notes ? ` (${json.notes})` : ""}. Finish the login below, then tap the button again.`);
      } else {
        setPhase("error");
        setMessage(json.error ?? "Couldn’t read the page.");
      }
    } catch {
      setPhase("error");
      setMessage("Couldn’t reach the server. Reload to try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">Connect your Credit Karma.</h1>
      <p className="mt-2 text-muted">{message}</p>

      {phase === "phone" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={copyLink}>
            {copied ? "Copied" : "Copy this link"}
          </button>
        </div>
      ) : null}

      {liveUrl && (phase === "login" || phase === "reading") ? (
        <div className="panel mt-5 overflow-hidden">
          <iframe src={liveUrl} title="Credit Karma login" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" allow="clipboard-read; clipboard-write" className="aspect-[16/10] w-full border-0 bg-black" />
        </div>
      ) : null}

      {phase === "login" || phase === "reading" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" disabled={busy || phase === "reading"} onClick={complete}>
            {phase === "reading" ? "Reading…" : "I’m logged in, read my score"}
          </button>
        </div>
      ) : null}

      <p className="mt-8 font-mono text-[0.68rem] uppercase leading-relaxed tracking-[0.08em] text-faint">
        Demo. You are logging into Credit Karma yourself, inside a private browser session hosted by Browserbase. Resident Alien never sees your password. With your permission we read the score shown and keep the session to re-check weekly. Text DISCONNECT to Credit Alien to end it anytime. Not a credit decision. Not affiliated with Credit Karma or Intuit.
      </p>
    </div>
  );
}
