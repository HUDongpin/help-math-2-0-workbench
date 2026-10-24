// HFR runtime · HfrPlayer: runs one compiled page (data + generated TypeScript
// module) at the SWF frame rate, renders it, plays its audio and forwards input.
// The host owns everything outside the stage: it starts, pauses and destroys
// the player and reads progress back.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ASArray, ASObject } from "./avm";
import { MovieClip, Runtime } from "./display";
import { makeHelpers } from "./helpers";
import { Renderer } from "./render";
import { AudioEngine } from "./audio";
import type { HostCall, PageData, PageFactory } from "./types";

/** Plain values carried between pages of one lesson, as the 1.0 shell kept `_global`. */
export type SessionGlobals = Readonly<Record<string, unknown>>;

export interface HfrPlayerOptions {
  onHost?: (call: HostCall) => void;
  /** Called after every rendered tick. */
  onTick?: () => void;
}

export interface HfrLoadOptions {
  /** False keeps every sound silent (server audio gate closed). */
  audio: boolean;
  globals?: SessionGlobals;
  seed?: number;
  /** Timeline used for progress: the clip owning the longest narration stream (0 = page root). */
  progressTimeline?: number;
}

export interface HfrProgress {
  readonly frame: number;
  readonly frameCount: number;
  readonly domain: string;
  /** No non-looping timeline is advancing (held for `SETTLE_TICKS`). */
  readonly settled: boolean;
  /** The progress timeline has reached its last frame at least once. */
  readonly reachedEnd: boolean;
}

export type HfrNarrationState = "unavailable" | "idle" | "playing" | "blocked";

const SETTLE_TICKS = 24; // 2 s at 12 fps
const SNAPSHOT_DEPTH = 4;

export class HfrPlayer {
  rt: Runtime | null = null;
  renderer: Renderer;
  audio: AudioEngine | null = null;
  data: PageData | null = null;
  baseUrl = "";
  running = false;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private destroyed = false;
  private handlers: [EventTarget, string, any][] = [];
  private audioAllowed = false;
  private spanish: HTMLAudioElement | null = null;
  private spanishWanted = false;
  private volume = 1;
  private progressTimeline = 0;
  private progressClip: MovieClip | null = null;
  private settledTicks = 0;
  private reachedEnd = false;
  private baselineGlobals = new Set<string>();

  constructor(public canvas: HTMLCanvasElement, public opts: HfrPlayerOptions = {}) {
    this.renderer = new Renderer(canvas, "");
  }

  async load(data: PageData, page: PageFactory, baseUrl: string, options: HfrLoadOptions): Promise<void> {
    this.teardown();
    this.destroyed = false;
    this.data = data;
    this.baseUrl = baseUrl;
    this.audioAllowed = options.audio;
    this.progressTimeline = options.progressTimeline ?? 0;
    this.settledTicks = 0;
    this.reachedEnd = false;
    this.progressClip = null;
    this.renderer = new Renderer(this.canvas, baseUrl);
    this.audio = new AudioEngine(baseUrl, data.stage.fps);
    this.audio.setMuted(!this.audioAllowed);
    const audioSrcs = [...data.streams.map((s) => s.src), ...Object.values<any>(data.dictionary).filter((d) => d.kind === "sound").map((d) => d.src)];
    await Promise.all([this.renderer.preload(data), this.audioAllowed ? this.audio.preload(audioSrcs) : Promise.resolve()]);
    if (this.destroyed) return;
    const rt = new Runtime(data, {
      audio: this.audio,
      host: (c) => this.opts.onHost?.(c),
      hitTest: (o, x, y) => this.renderer.hitTest(o, x, y),
      seed: options.seed,
    });
    rt.helpers = makeHelpers(rt);
    rt.scripts = page(rt.helpers);
    for (const e of rt.Global.props.values()) this.baselineGlobals.add(e.n);
    // The 1.0 report endpoint is never configured: pages take their no-report branch.
    rt.shell.set("Report_URL", "");
    if (options.globals) this.importGlobals(rt, options.globals);
    this.rt = rt;
    this.bindInput();
    rt.loadPage();
    this.applyVolume();
    this.renderer.render(rt);
  }

  start(): void {
    if (this.running || !this.rt || !this.data) return;
    this.running = true;
    void this.audio?.resume().catch(() => undefined);
    if (this.spanish) void this.spanish.play().catch(() => undefined);
    this.last = performance.now();
    this.acc = 0;
    const fps = this.data.stage.fps;
    const step = (t: number) => {
      if (!this.running || !this.rt) return;
      this.acc += Math.min(250, t - this.last);
      this.last = t;
      const dt = 1000 / fps;
      let n = 0;
      while (this.acc >= dt && n++ < 4) {
        this.rt.tick();
        this.trackProgress();
        this.acc -= dt;
      }
      this.renderer.render(this.rt);
      this.opts.onTick?.();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    void this.audio?.suspend().catch(() => undefined);
    this.spanish?.pause();
  }

  /** Canvas backing size follows its CSS box and the device pixel ratio. */
  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w && h && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (this.rt) this.renderer.render(this.rt);
    }
  }

  setVolume(v: number): void { this.volume = Math.max(0, Math.min(1, v)); this.applyVolume(); }

  /** ES routes the lesson's Spanish narration and mutes the English streams. */
  setSpanish(on: boolean): void {
    this.spanishWanted = on;
    const src = this.data?.spanishAudio;
    if (on && src && this.audioAllowed) {
      if (!this.spanish) {
        this.spanish = new Audio(this.baseUrl + src);
        this.spanish.volume = this.volume;
        if (this.running) void this.spanish.play().catch(() => undefined);
      }
    } else if (this.spanish) {
      this.spanish.pause();
      this.spanish = null;
    }
    this.applyVolume();
  }

  /** Start sound after a learner gesture (the shell's narration button). */
  async resumeAudio(): Promise<void> {
    await this.audio?.resume().catch(() => undefined);
    if (this.spanish && this.running) await this.spanish.play().catch(() => undefined);
  }

  stopNarration(): void {
    this.audio?.stopAll();
    this.spanish?.pause();
  }

  narrationState(): HfrNarrationState {
    if (!this.audioAllowed || !this.data) return "unavailable";
    const hasEnglish = this.data.streams.length > 0;
    const hasSpanish = Boolean(this.data.spanishAudio);
    if (!hasEnglish && !(this.spanishWanted && hasSpanish)) return "unavailable";
    if (this.audio?.ctx.state !== "running") return this.running ? "blocked" : "idle";
    if (this.spanish && !this.spanish.paused) return "playing";
    return this.audio.active.size > 0 ? "playing" : "idle";
  }

  progress(): HfrProgress {
    const clip = this.findProgressClip();
    const frame = clip?.frame ?? 1;
    const frameCount = clip?.totalFrames ?? 1;
    return {
      frame: Math.max(1, frame),
      frameCount: Math.max(1, frameCount),
      domain: this.progressTimeline === 0 ? "root" : `stream:${this.progressTimeline}`,
      settled: this.settledTicks >= SETTLE_TICKS,
      reachedEnd: this.reachedEnd,
    };
  }

  /** Plain `_global` values set by page code, for the next page of the lesson. */
  exportGlobals(): SessionGlobals {
    const rt = this.rt;
    if (!rt) return {};
    const out: Record<string, unknown> = {};
    for (const e of rt.Global.props.values()) {
      if (e.dontEnum || e.getter || this.baselineGlobals.has(e.n)) continue;
      const v = toPlain(e.v, SNAPSHOT_DEPTH);
      if (v !== SKIP) out[e.n] = v;
    }
    return out;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.teardown();
  }

  // ---- internals
  private teardown(): void {
    this.pause();
    for (const [t, ev, fn] of this.handlers) t.removeEventListener(ev, fn);
    this.handlers = [];
    this.spanish?.pause();
    this.spanish = null;
    this.audio?.close();
    this.audio = null;
    this.rt = null;
    this.baselineGlobals = new Set();
  }

  private applyVolume(): void {
    const v = this.volume;
    if (this.audio) {
      this.audio.volume = v;
      this.audio.setMuted(!this.audioAllowed || Boolean(this.spanish));
    }
    if (this.spanish) this.spanish.volume = v;
    if (this.rt) this.rt.Global.set("volLevel", Math.round(v * 100));
  }

  private importGlobals(rt: Runtime, globals: SessionGlobals): void {
    for (const [k, v] of Object.entries(globals)) {
      if (this.baselineGlobals.has(k)) continue;
      rt.Global.set(k, fromPlain(rt, v, SNAPSHOT_DEPTH));
    }
  }

  private findProgressClip(): MovieClip | null {
    const rt = this.rt;
    if (!rt) return null;
    if (this.progressClip && !this.progressClip.removed) return this.progressClip;
    if (this.progressTimeline === 0) return (this.progressClip = rt.page_ ?? null);
    for (const o of rt.allObjects()) if (o instanceof MovieClip && o.charId === this.progressTimeline) return (this.progressClip = o);
    return rt.page_ ?? null;
  }

  private trackProgress(): void {
    const rt = this.rt;
    if (!rt) return;
    const clip = this.findProgressClip();
    if (clip && clip.frame >= clip.totalFrames - 1) this.reachedEnd = true;
    let advancing = false;
    for (const o of rt.allObjects()) if (o instanceof MovieClip && o.playing && !o.looped && o.totalFrames > 1) { advancing = true; break; }
    this.settledTicks = advancing ? 0 : this.settledTicks + 1;
  }

  private stagePoint(ev: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    const sx = (ev.clientX - r.left) * (this.canvas.width / r.width), sy = (ev.clientY - r.top) * (this.canvas.height / r.height);
    const b = this.renderer.base;
    return [(sx - b.tx) / b.a / 20, (sy - b.ty) / b.d / 20];
  }

  private bindInput(): void {
    const on = (t: EventTarget, ev: string, fn: any) => { t.addEventListener(ev, fn); this.handlers.push([t, ev, fn]); };
    on(this.canvas, "pointermove", (e: PointerEvent) => { const rt = this.rt; if (!rt) return; const [x, y] = this.stagePoint(e); rt.pointerMove(x, y); this.canvas.style.cursor = rt.hover && rt.hover.get("useHandCursor") !== false ? "pointer" : "default"; });
    on(this.canvas, "pointerdown", (e: PointerEvent) => { const rt = this.rt; if (!rt) return; const [x, y] = this.stagePoint(e); rt.pointerMove(x, y); rt.pointerDown(); this.canvas.setPointerCapture(e.pointerId); });
    on(this.canvas, "pointerup", (e: PointerEvent) => { const rt = this.rt; if (!rt) return; const [x, y] = this.stagePoint(e); rt.pointerMove(x, y); rt.pointerUp(); });
    on(this.canvas, "keydown", (e: KeyboardEvent) => this.rt?.keyDown(e.keyCode, e.key.length === 1 ? e.key.charCodeAt(0) : 0));
    on(this.canvas, "keyup", (e: KeyboardEvent) => this.rt?.keyUp(e.keyCode));
  }
}

const SKIP = Symbol("skip");

function toPlain(v: unknown, depth: number): unknown {
  if (v === null || v === undefined || typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (depth <= 0 || !(v instanceof ASObject) || v.isDisplay) return SKIP;
  if (v instanceof ASArray) return v.a.map((x) => { const p = toPlain(x, depth - 1); return p === SKIP ? undefined : p; });
  if (v.constructor !== ASObject) return SKIP; // functions and other built-in objects stay on their page
  const out: Record<string, unknown> = {};
  for (const e of v.props.values()) {
    if (e.dontEnum || e.getter) continue;
    const p = toPlain(e.v, depth - 1);
    if (p !== SKIP) out[e.n] = p;
  }
  return out;
}

function fromPlain(rt: Runtime, v: unknown, depth: number): unknown {
  if (v === null || typeof v !== "object" || depth <= 0) return v;
  if (Array.isArray(v)) return new ASArray(rt, v.map((x) => fromPlain(rt, x, depth - 1)));
  const o = new ASObject(rt, rt.ObjectProto);
  for (const [k, x] of Object.entries(v)) o.set(k, fromPlain(rt, x, depth - 1));
  return o;
}
