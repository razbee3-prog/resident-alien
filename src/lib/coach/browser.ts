import "server-only";
import Browserbase from "@browserbasehq/sdk";
import { chromium, type Page } from "playwright-core";
import { extractScore, looksLikeLoginPage, type ScoreExtraction } from "./score-vision";

/**
 * Hosted browser (Browserbase) the user logs into themselves via a live view. We hold a per-user context id (an
 * encrypted cookie profile stored at Browserbase), never credentials. Demo feature; off unless CREDIT_BROWSER_ENABLED=1.
 */
export { browserEnabled } from "./browser-flag";
export const PROVIDER_HOME = "https://www.creditkarma.com/";
export const PROVIDER_LOGIN = "https://www.creditkarma.com/auth/logon";
export type Device = "laptop" | "phone";

let client: Browserbase | null = null;
function bb(): Browserbase {
  if (!client) client = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
  return client;
}
const projectId = () => process.env.BROWSERBASE_PROJECT_ID;

export async function createContext(): Promise<string> {
  const c = await bb().contexts.create({ projectId: projectId() });
  return c.id;
}

export async function deleteContext(id: string): Promise<void> {
  try {
    await bb().contexts.delete(id);
  } catch (e) {
    console.warn("browserbase context delete failed", e);
  }
}

/** keepAlive keeps the session up while nobody is connected over CDP (the user is in the live view). Release it explicitly. */
export async function createSession(contextId: string, opts: { device: Device; timeoutSec: number; keepAlive?: boolean }): Promise<{ id: string; connectUrl: string }> {
  const s = await bb().sessions.create({
    projectId: projectId(),
    keepAlive: opts.keepAlive ?? false,
    api_timeout: Math.min(21_600, Math.max(60, opts.timeoutSec)),
    browserSettings: {
      context: { id: contextId, persist: true },
      // A phone-sized viewport is enough for the site's responsive layout; Browserbase's mobile OS emulation is Enterprise-only.
      viewport: opts.device === "phone" ? { width: 390, height: 844 } : { width: 1280, height: 800 },
    },
  });
  return { id: s.id, connectUrl: s.connectUrl };
}

export async function liveViewUrl(sessionId: string): Promise<string> {
  const d = await bb().sessions.debug(sessionId);
  const url = d.debuggerFullscreenUrl;
  return `${url}${url.includes("?") ? "&" : "?"}navbar=false`;
}

export async function releaseSession(sessionId: string): Promise<void> {
  try {
    await bb().sessions.update(sessionId, { status: "REQUEST_RELEASE", projectId: projectId() });
  } catch (e) {
    console.warn("browserbase session release failed", e);
  }
}

export async function withPage<T>(connectUrl: string, fn: (page: Page) => Promise<T>): Promise<T> {
  const browser = await chromium.connectOverCDP(connectUrl, { timeout: 30_000 });
  try {
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());
    return await fn(page);
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Point a fresh login session at the provider's sign-in page so the live view isn't blank. Best effort. */
export async function openLoginPage(connectUrl: string): Promise<string | null> {
  try {
    return await withPage(connectUrl, async (page) => {
      await page.goto(PROVIDER_LOGIN, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => {});
      return page.url();
    });
  } catch (e) {
    console.warn("openLoginPage failed", e);
    return null;
  }
}

export type ReadResult = { loggedIn: boolean; url: string; extraction: ScoreExtraction | null };

/** Go to the provider home and read the score page: cheap login-page detection first, then vision. */
export async function captureAndRead(connectUrl: string): Promise<ReadResult> {
  return withPage(connectUrl, async (page) => {
    await page.goto(PROVIDER_HOME, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    const url = page.url();
    const text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    if (looksLikeLoginPage(url, text)) return { loggedIn: false, url, extraction: null };
    const png = await page.screenshot({ type: "png", fullPage: false });
    const extraction = await extractScore({ pngBase64: png.toString("base64"), pageText: text, provider: "Credit Karma" });
    return { loggedIn: extraction.logged_in, url, extraction };
  });
}

/** Weekly refresh: short session on the stored context, read, release. */
export async function refreshConnection(contextId: string): Promise<ReadResult> {
  const session = await createSession(contextId, { device: "laptop", timeoutSec: 120, keepAlive: false });
  try {
    return await captureAndRead(session.connectUrl);
  } finally {
    await releaseSession(session.id);
  }
}
