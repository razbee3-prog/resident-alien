/**
 * Phone keyboard for a Browserbase live view. The live view streams the remote screen and takes taps, but the phone
 * keyboard has nothing to attach to. This talks to the session's Chrome DevTools Protocol endpoint directly from the
 * phone's browser (the same endpoint the live view itself uses), so typed text goes phone → Browserbase and never
 * through our server.
 */
export class RemoteKeyboard {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private sessionId: string | null = null;

  constructor(private readonly connectUrl: string) {}

  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.connectUrl);
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("Couldn’t reach the remote browser."));
      ws.onclose = () => {
        for (const p of this.pending.values()) p.reject(new Error("Remote browser disconnected."));
        this.pending.clear();
        this.ws = null;
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as { id?: number; result?: unknown; error?: { message: string } };
          if (typeof msg.id !== "number") return;
          const p = this.pending.get(msg.id);
          if (!p) return;
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result);
        } catch {}
      };
    });
    const targets = (await this.send("Target.getTargets")) as { targetInfos: { targetId: string; type: string; url: string }[] };
    const page = targets.targetInfos.find((t) => t.type === "page" && !t.url.startsWith("devtools://")) ?? targets.targetInfos.find((t) => t.type === "page");
    if (!page) throw new Error("No page open in the remote browser.");
    const attached = (await this.send("Target.attachToTarget", { targetId: page.targetId, flatten: true })) as { sessionId: string };
    this.sessionId = attached.sessionId;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.sessionId !== null;
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
  }

  /** Types into whatever field the user last tapped in the live view. */
  async type(text: string): Promise<void> {
    if (!text) return;
    await this.page("Input.insertText", { text });
  }

  async pressEnter(): Promise<void> {
    await this.page("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: "\r", unmodifiedText: "\r" });
    await this.page("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  }

  /** Select-all then delete, for fixing a typo in the focused field. */
  async clearField(): Promise<void> {
    await this.page("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2, windowsVirtualKeyCode: 65, commands: ["selectAll"] });
    await this.page("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2, windowsVirtualKeyCode: 65 });
    await this.page("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
    await this.page("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
  }

  private page(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.sessionId) throw new Error("Not attached to the remote page.");
    return this.send(method, params, this.sessionId);
  }

  private send(method: string, params?: Record<string, unknown>, sessionId?: string): Promise<unknown> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error("Remote browser disconnected."));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params ?? {}, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error("Remote browser didn’t answer."));
      }, 15_000);
    });
  }
}
