"use client";

import { useEffect, useRef, useState } from "react";
import { RemoteKeyboard } from "./remote-keyboard";

type Phase = "starting" | "login" | "reading" | "done" | "error" | "ended";

/**
 * Hosted-browser login (demo). The user logs into Credit Karma inside a Browserbase live view; "I'm logged in" asks the
 * server to read the score page. On phones the live view takes taps but not the keyboard, so a text box sends what they
 * type to the remote page over the session's own control channel (phone → Browserbase, never through our server).
 */
export function ConnectClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [device, setDevice] = useState<"laptop" | "phone">("laptop");
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Opening a private browser…");
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [hide, setHide] = useState(true);
  const [kbState, setKbState] = useState<"off" | "connecting" | "ready" | "lost">("off");
  const started = useRef(false);
  const keyboard = useRef<RemoteKeyboard | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      // Safari can present a desktop user agent on iPhone/iPad ("Request Desktop Website"), so also look for a touch screen.
      const ua = navigator.userAgent;
      const touch = navigator.maxTouchPoints > 1 || (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);
      const dev: "laptop" | "phone" = /iPhone|iPad|iPod|Android/i.test(ua) || (touch && /Macintosh|Mobile/i.test(ua)) || (touch && window.innerWidth < 900) ? "phone" : "laptop";
      setDevice(dev);
      try {
        const res = await fetch(`/api/connect/${token}/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: dev }) });
        const json = (await res.json()) as { ok: boolean; liveViewUrl?: string; connectUrl?: string; error?: string };
        if (!res.ok || !json.ok || !json.liveViewUrl) {
          setPhase("error");
          setMessage(json.error ?? "Couldn’t open the browser.");
          return;
        }
        setLiveUrl(json.liveViewUrl);
        setPhase("login");
        if (dev === "phone" && json.connectUrl) {
          setMessage("Tap a field in the screen, type in the box under it, then Send. Do that for email, password, and any code they text you. Then tap the green button.");
          setKbState("connecting");
          try {
            const kb = new RemoteKeyboard(json.connectUrl);
            await kb.connect();
            keyboard.current = kb;
            setKbState("ready");
          } catch {
            setKbState("lost");
          }
        } else {
          setMessage("Log in to Credit Karma below, including any code they text you. Then tap the button.");
        }
      } catch {
        setPhase("error");
        setMessage("Couldn’t reach the server. Reload to try again.");
      }
    })();
    return () => keyboard.current?.close();
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

  async function withKeyboard(fn: (kb: RemoteKeyboard) => Promise<void>) {
    let kb = keyboard.current;
    if (!kb || !kb.connected) {
      setKbState("connecting");
      try {
        const res = await fetch(`/api/connect/${token}/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: "phone" }) });
        const json = (await res.json()) as { ok: boolean; connectUrl?: string };
        if (!json.ok || !json.connectUrl) throw new Error("no session");
        kb = new RemoteKeyboard(json.connectUrl);
        await kb.connect();
        keyboard.current = kb;
        setKbState("ready");
      } catch {
        setKbState("lost");
        return;
      }
    }
    setBusy(true);
    try {
      await fn(kb);
      setKbState("ready");
    } catch {
      setKbState("lost");
    } finally {
      setBusy(false);
    }
  }

  async function complete(attempt = 0) {
    setBusy(true);
    setPhase("reading");
    setMessage(attempt === 0 ? "Reading your score page… about 30 seconds." : "Trying once more… about 30 seconds.");
    try {
      const res = await fetch(`/api/connect/${token}/complete`, { method: "POST" });
      const json = (await res.json()) as { ok: boolean; score?: number | null; reason?: string; notes?: string; error?: string; followup?: "sent" | "pending" };
      if (json.ok) {
        keyboard.current?.close();
        setPhase("done");
        const scored = json.score !== null && json.score !== undefined;
        const next = json.followup === "pending" ? "Text Credit Alien anything and it will reply with your summary and plan." : "Credit Alien is texting your summary and plan now. Go back to Messages.";
        setMessage(scored ? `Done. Your score is ${json.score}. ${next}` : `Connected, but no score was visible on the page yet. ${next}`);
      } else if (json.reason === "not_logged_in") {
        // Credit Karma can still be on its post-login hand-off when the first read happens; one more try usually lands.
        if (attempt === 0 && !/login|log in|sign in|password/i.test(json.notes ?? "")) {
          setMessage("Credit Karma was still loading. Trying once more in a few seconds…");
          await new Promise((r) => setTimeout(r, 6000));
          return complete(1);
        }
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

  const phoneKeys = device === "phone" && phase === "login";

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">Connect your Credit Karma.</h1>
      <p className="mt-2 text-muted">{message}</p>

      {liveUrl && (phase === "login" || phase === "reading") ? (
        <div className="panel mt-5 overflow-hidden">
          <iframe
            src={liveUrl}
            title="Credit Karma login"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            allow="clipboard-read; clipboard-write"
            className={`w-full border-0 bg-black ${device === "phone" ? "h-[56vh]" : "aspect-[16/10]"}`}
          />
        </div>
      ) : null}

      {phoneKeys ? (
        <div className="panel mt-3 p-3">
          <div className="flex items-center justify-between gap-3">
            <label className="label" htmlFor="remote-type">
              Type here, then Send
            </label>
            <span className={`font-mono text-[0.62rem] uppercase tracking-[0.12em] ${kbState === "ready" ? "text-good" : kbState === "lost" ? "text-bad" : "text-muted"}`}>
              {kbState === "ready" ? "keyboard linked" : kbState === "lost" ? "keyboard lost, tap Send to retry" : kbState === "connecting" ? "linking keyboard…" : ""}
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              id="remote-type"
              className="field"
              type={hide ? "password" : "text"}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="email, password, or code"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = typed;
                  setTyped("");
                  void withKeyboard(async (kb) => {
                    await kb.type(t);
                    await kb.pressEnter();
                  });
                }
              }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => {
                const t = typed;
                setTyped("");
                void withKeyboard((kb) => kb.type(t));
              }}
            >
              Send
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void withKeyboard((kb) => kb.pressEnter())}>
              Enter
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void withKeyboard((kb) => kb.clearField())}>
              Clear field
            </button>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> Hide what I type
            </label>
          </div>
          <p className="mt-2 text-xs text-faint">Typed text goes straight from your phone to the private browser. It never passes through Resident Alien.</p>
        </div>
      ) : null}

      {phase === "login" || phase === "reading" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" disabled={busy || phase === "reading"} onClick={() => void complete()}>
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
