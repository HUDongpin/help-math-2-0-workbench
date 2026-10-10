// HFR runtime · HfrPlayer: loads one compiled page (data + generated TypeScript
// module), runs it at the SWF frame rate, renders, plays audio and forwards input.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Runtime } from "./display";
import { makeHelpers } from "./helpers";
import { Renderer } from "./render";
import { AudioEngine } from "./audio";
import type { PageData, HostCall, PageModule } from "./types";

export interface PlayerOptions { onHost?: (c: HostCall) => void; onFrame?: (rt: Runtime) => void }

export class HfrPlayer {
  rt!: Runtime; renderer: Renderer; audio!: AudioEngine; data!: PageData; running = false; raf = 0; last = 0; acc = 0; baseUrl = "";
  private handlers: [EventTarget, string, any][] = [];
  constructor(public canvas: HTMLCanvasElement, public opts: PlayerOptions = {}) { this.renderer = new Renderer(canvas, ""); }
  async load(pageUrl: string, data?: PageData): Promise<void> {
    this.destroy();
    this.baseUrl = pageUrl.replace(/[^/]*$/, "");
    this.data = data ?? (await (await fetch(pageUrl)).json());
    const mod: PageModule = await import(/* @vite-ignore */ new URL(this.data.module, new URL(this.baseUrl, location.href)).href);
    this.renderer = new Renderer(this.canvas, this.baseUrl);
    this.audio = new AudioEngine(this.baseUrl, this.data.stage.fps);
    const audioSrcs = [...this.data.streams.map((s) => s.src), ...Object.values<any>(this.data.dictionary).filter((d) => d.kind === "sound").map((d) => d.src)];
    await Promise.all([this.renderer.preload(this.data), this.audio.preload(audioSrcs)]);
    const rt = new Runtime(this.data, { audio: this.audio, host: (c) => this.opts.onHost?.(c), hitTest: (o, x, y) => this.renderer.hitTest(o, x, y) });
    rt.helpers = makeHelpers(rt); rt.scripts = mod.default(rt.helpers);
    this.rt = rt; this.bindInput();
    rt.loadPage(); this.renderer.render(rt);
  }
  start(): void { if (this.running || !this.rt) return; this.running = true; this.audio.resume(); this.last = performance.now(); this.acc = 0; const step = (t: number) => { if (!this.running) return; this.acc += Math.min(250, t - this.last); this.last = t; const dt = 1000 / this.data.stage.fps; let n = 0; while (this.acc >= dt && n++ < 4) { this.rt.tick(); this.acc -= dt; } this.renderer.render(this.rt); this.opts.onFrame?.(this.rt); this.raf = requestAnimationFrame(step); }; this.raf = requestAnimationFrame(step); }
  pause(): void { this.running = false; cancelAnimationFrame(this.raf); this.audio?.suspend(); }
  stagePoint(ev: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect(); const sx = (ev.clientX - r.left) * (this.canvas.width / r.width), sy = (ev.clientY - r.top) * (this.canvas.height / r.height);
    const b = this.renderer.base; return [(sx - b.tx) / b.a / 20, (sy - b.ty) / b.d / 20];
  }
  bindInput(): void {
    const on = (t: EventTarget, ev: string, fn: any) => { t.addEventListener(ev, fn); this.handlers.push([t, ev, fn]); };
    on(this.canvas, "pointermove", (e: PointerEvent) => { const [x, y] = this.stagePoint(e); this.rt.pointerMove(x, y); this.canvas.style.cursor = this.rt.hover && this.rt.hover.get("useHandCursor") !== false ? "pointer" : "default"; });
    on(this.canvas, "pointerdown", (e: PointerEvent) => { const [x, y] = this.stagePoint(e); this.rt.pointerMove(x, y); this.rt.pointerDown(); this.canvas.setPointerCapture(e.pointerId); });
    on(this.canvas, "pointerup", (e: PointerEvent) => { const [x, y] = this.stagePoint(e); this.rt.pointerMove(x, y); this.rt.pointerUp(); });
    on(this.canvas, "keydown", (e: KeyboardEvent) => this.rt.keyDown(e.keyCode, e.key.length === 1 ? e.key.charCodeAt(0) : 0));
    on(this.canvas, "keyup", (e: KeyboardEvent) => this.rt.keyUp(e.keyCode));
  }
  destroy(): void { this.pause(); for (const [t, ev, fn] of this.handlers) t.removeEventListener(ev, fn); this.handlers = []; this.audio?.close(); }
}
