// HFR runtime · HfrPlayer: runs one compiled page (data + generated TypeScript
// module) at the SWF frame rate, renders it, plays its audio and forwards input.
// The host owns everything outside the stage: it starts, pauses and destroys
// the player and reads progress back.
/* eslint-disable @typescript-eslint/no-explicit-any */
import {bindTechnicalOwner,bindTechnicalLifecycle,technicalObjectId,publishTechnicalCommit,publishTechnicalState,retireTechnicalObservation,type TechnicalOwner} from '../technical-observation-v1';
import {activatePageSession, isPageSessionCurrent, resolvePageSessionData, type PageSessionLease} from "./session";
import type {LessonRuntime, RuntimeLease} from "./lesson-runtime";
import { ButtonObj, MovieClip, Runtime, type DisplayObject } from "./display";
import { Renderer } from "./render";
import { AudioEngine } from "./audio";
import type { HostCall, PageData, PageFactory } from "./types";
import {initializeHfrReducedMotion, type HfrReducedMotionState} from "./reduced-motion";
import {HFR_SOURCE_POINTER_LIMIT,sourceObservationRequested,snapshotHfrSource,ownSourcePointer,sourceObjectFacts,sourceActionTrace,sourcePointerOutcome,type OwnedSourcePointer,type SourcePointerOutcome} from "./source-observation";

export interface HfrPlayerOptions {
  /** A configured page may redraw static source input mutations without ticking. */
  onSourcePointerMutation?: (runtime:Runtime) => void;
  onHost?: (call: HostCall) => void;
  /** Install a source-bound page adapter on each new/replayed lease before static initialization. */
  onRuntimeActivated?: (runtime:Runtime,dataSha256:string)=>void;
  /** Optional native adapter for exact source buttons; other inputs keep their existing path. */
  sourceButtonInput?: (runtime: Runtime, button: DisplayObject, point: readonly [number, number] | null) => "allowed" | "blocked" | "unhandled";
  onSourceButtonRelease?: (runtime: Runtime, button: DisplayObject, point: readonly [number, number], release: () => void) => void;
  /** Fatal error after source activation; the player/media are stopped first. */
  onError?: (error: unknown) => void;
  onBeforeRender?: () => void;
  shouldSuppressText?: (runtime: Runtime, object: DisplayObject) => boolean;
  /** Read-only observation after each completed natural source tick, before the next catch-up tick. Not a paint callback. */
  onSourceTick?: () => void;
  /** Called after every rendered tick. */
  onTick?: () => void;
  /** Media/control changes are reported without advancing source scripts. */
  onMediaStateChange?: () => void;
}

export interface HfrLoadOptions {
  readonly replay?: number;
  /** False keeps every sound silent (server audio gate closed). */
  audio: boolean;
  reducedMotionState?: HfrReducedMotionState;
  session: PageSessionLease;
  dataSha256: string;
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
// Diagnostics must not retain an unbounded history of language toggles. An
// overflow is reported as incomplete evidence; playback remains unchanged.
const HTML_MEDIA_OBSERVATION_LIMIT = 64;

export class HfrPlayer {
  private session: PageSessionLease | null = null;
  private owner: LessonRuntime | null = null;
  private runtimeLease: RuntimeLease | null = null;
  private loadGeneration = 0;
  private playbackGeneration = 0;
  private observedReplay = 0;
  private sourcePointerRows:OwnedSourcePointer[]=[];
  private sourcePointerOverflow=0;
  private mediaIntent = 0;
  lastError: unknown = null;
  get rt(): Runtime | null {
    return this.session && this.runtimeLease && isPageSessionCurrent(this.session) ? this.owner?.active(this.runtimeLease) ?? null : null;
  }
  renderer: Renderer;
  audio: AudioEngine | null = null;
  data: PageData | null = null;
  baseUrl = "";
  running = false;
  private raf = 0;
  private frameRequest: {ownerId: string|null}|null = null;
  private htmlMediaAudit = {rows: new Map<HTMLAudioElement, {mediaId: string; ownerId: string|null; pendingPlays: number}>(), overflow: 0};
  private lifecycleRead: {identity: TechnicalOwner; read: () => Record<string, unknown>}|null = null;
  private last = 0;
  private acc = 0;
  private destroyed = false;
  private handlers: [EventTarget, string, any][] = [];
  private audioAllowed = false;
  private staticSourceState = false;
  private sourceReleaseButton: DisplayObject | null = null;
  private spanish: HTMLAudioElement | null = null;
  private spanishWanted = false;
  private narrationStopped = false;
  private spanishBlocked = false;
  private spanishListeners: (() => void)[] = [];
  private volume = 1;
  private progressTimeline = 0;
  private progressClip: MovieClip | null = null;
  private settledTicks = 0;
  private reachedEnd = false;

  constructor(public canvas: HTMLCanvasElement, public opts: HfrPlayerOptions = {}) {
    this.renderer = new Renderer(canvas, "");
    this.renderer.shouldSuppressText = opts.shouldSuppressText;
  }

  async load(data: PageData, page: PageFactory, baseUrl: string, options: HfrLoadOptions): Promise<boolean> {
    this.teardown();
    const generation = ++this.loadGeneration;
    this.htmlMediaAudit = {rows: new Map(), overflow: 0};
    this.sourcePointerRows=[];this.sourcePointerOverflow=0;
    this.destroyed = false;
    this.lastError = null;
    this.session = options.session; this.observedReplay = options.replay ?? 0;
    data = resolvePageSessionData(options.session, data, page, options.dataSha256);
    this.data = data;
    this.baseUrl = baseUrl;
    this.audioAllowed = options.audio;
    this.narrationStopped = false;
    this.spanishBlocked = false;
    this.staticSourceState = Boolean(options.reducedMotionState);
    this.progressTimeline = options.progressTimeline ?? 0;
    this.settledTicks = 0;
    this.reachedEnd = false;
    this.progressClip = null;
    const renderer = this.renderer = new Renderer(this.canvas, baseUrl);
    renderer.shouldSuppressText = this.opts.shouldSuppressText;
    const audio = this.audio = new AudioEngine(baseUrl, data.stage.fps);
    audio.onStateChange = () => {
      if (generation !== this.loadGeneration || this.audio !== audio) return;
      if (this.runtimeLease && !this.rt && audio.ctx.state === "running") void audio.suspend().catch(() => undefined);
      this.reportMediaState();
    };
    audio.setEnabled(this.audioAllowed && !this.staticSourceState);
    audio.setMuted(!this.audioAllowed || this.staticSourceState);
    const audioSrcs = [...data.streams.map((s) => s.src), ...Object.values<any>(data.dictionary).filter((d) => d.kind === "sound").map((d) => d.src)];
    try {
      await Promise.all([renderer.preload(data), audio.suspend(), this.audioAllowed ? audio.preload(audioSrcs) : Promise.resolve()]);
      if (this.destroyed || generation !== this.loadGeneration || !isPageSessionCurrent(options.session)) {audio.close(); return false;}
      const active = activatePageSession(options.session, data, page, options.dataSha256, {
        audio: this.staticSourceState ? null : audio,
        host: (c) => {
          if (!this.destroyed && isPageSessionCurrent(options.session) &&
              (!this.staticSourceState || (this.sourceReleaseButton && c.kind === "shell.DoHyperLinks"))) this.opts.onHost?.(c);
        },
        hitTest: (o, x, y) => renderer.hitTest(o, x, y),
      });
      this.owner = active.owner; this.runtimeLease = active.lease;
      const rt = this.rt;
      if (!rt) throw new Error("HFR_PLAYER_ACTIVATION_STALE");
      this.opts.onRuntimeActivated?.(rt,options.dataSha256);
      this.bindInput();
      if (options.reducedMotionState) initializeHfrReducedMotion(rt, options.reducedMotionState, options.dataSha256);
      this.applyVolume();
      this.redraw();
      return true;
    } catch (error) {
      if (generation === this.loadGeneration) this.teardown(); else audio.close();
      throw error;
    }
  }

  /** Exact live lease; no source actions and no generated substitute token. */
  private observationOwner():TechnicalOwner|null {
    if(!this.rt||!this.runtimeLease||!this.data)return null;const lease=this.runtimeLease;
    return {animationId:lease.binding.pageKey,sourceSha256:lease.binding.sourceSha256,playerId:`${technicalObjectId(this,'hfr-player')}:lease:${lease.token}`,ownerKind:'source-vm',leaseToken:lease.token,replay:this.observedReplay};
  }

  private observeLifecycle(identity: TechnicalOwner): void {
    if (this.lifecycleRead?.identity.playerId === identity.playerId) return;
    const lesson=this.owner, lease=this.runtimeLease, session=this.session, audio=this.audio, generation=this.loadGeneration;
    if(!lesson||!lease||!session)return;
    const mediaAudit=this.htmlMediaAudit, capturedIdentity=Object.freeze({...identity});
    const contextId=audio?technicalObjectId(audio.ctx,'audio-context'):null;
    const read=()=>({
      kind:'hfr-player-lifecycle-v1', identity:{...capturedIdentity}, observedAtMs:performance.now(),
      pageLeaseCurrent:lesson.active(lease)!==null, pageSessionCurrent:isPageSessionCurrent(session),
      ownsActiveLoad:this.loadGeneration===generation, playerDestroyed:this.destroyed, currentPlayerRunning:this.running,
      animationFramePending:this.frameRequest?.ownerId===capturedIdentity.playerId,
      unattributedAnimationFrames:Number(Boolean(this.frameRequest&&this.frameRequest.ownerId===null)),
      audioContext:audio?{contextId,state:audio.ctx.state, trackedStreams:audio.active.size, trackedEvents:[...audio.events.values()].reduce((n,rows)=>n+rows.length,0)}:null,
      htmlMedia:[...mediaAudit.rows].filter(([,row])=>row.ownerId===capturedIdentity.playerId).map(([media,row])=>({
        mediaId:row.mediaId,src:media.src,currentSrc:media.currentSrc,paused:media.paused,ended:media.ended,
        pendingPlays:row.pendingPlays,
      })),
      htmlMediaObservationOverflow:mediaAudit.overflow,
      unattributedHtmlMedia:[...mediaAudit.rows.values()].filter(row=>row.ownerId!==capturedIdentity.playerId).length +
        Number(Boolean(this.loadGeneration===generation&&this.spanish&&!mediaAudit.rows.has(this.spanish))),
    });
    this.lifecycleRead={identity:capturedIdentity,read};
    bindTechnicalLifecycle(this.canvas,capturedIdentity,read);
  }

  /** Actual retained resources for this player's last observed lease. It does
   * not infer cleanup from DOM attachment or from whether the lesson VM exists. */
  get technicalLifecycle(): Readonly<Record<string, unknown>>|null {return this.lifecycleRead?.read()??null;}

  private scheduleFrame(step: FrameRequestCallback): void {
    const identity=this.observationOwner(), request={ownerId:identity?.playerId??null};
    const callback=bindTechnicalOwner((at:number)=>{if(this.frameRequest===request)this.frameRequest=null;step(at);},identity);
    this.raf=requestAnimationFrame(callback);this.frameRequest=request;
  }

  /** Draw current state; this never advances AVM clocks or replays source scripts. */
  redraw(): void {
    if (!this.rt) return;
    this.opts.onBeforeRender?.();
    const drawnRuntime=this.rt!,drawnOwner=this.observationOwner();this.renderer.render(drawnRuntime);
    const owner=this.observationOwner(),rt=this.rt;if(owner&&rt&&rt===drawnRuntime&&drawnOwner&&drawnOwner.playerId===owner.playerId&&drawnOwner.leaseToken===owner.leaseToken&&drawnOwner.replay===owner.replay){this.observeLifecycle(owner);if(this.audio)bindTechnicalOwner(this.audio.ctx,owner);const progress=this.progress();publishTechnicalCommit(this.canvas,owner,'generated-typescript-hfr-v1',{frame:progress.frame,frameDomain:progress.domain,rootFrame:rt.page_.frame,tick:rt.tickCount,errors:[...rt.errors],missing:Object.entries(rt.missing).flatMap(([kind,items])=>[...items.keys()].map(key=>({kind,key}))),...(sourceObservationRequested(owner)?{sourceObservation:snapshotHfrSource(rt,owner,this.sourcePointerRows,this.sourcePointerOverflow)}:{})},{paused:!this.running});}else if(drawnOwner){retireTechnicalObservation(this.canvas,drawnOwner);}
    this.opts.onTick?.();
  }

  private observeSourcePointer(event:PointerEvent,runtime:Runtime,owner:TechnicalOwner|null,outcome:SourcePointerOutcome|undefined):void {
    const current=this.observationOwner();if(!outcome||!owner||!current||!sourceObservationRequested(owner)||this.rt!==runtime||current.playerId!==owner.playerId||current.leaseToken!==owner.leaseToken)return;
    const row=ownSourcePointer(owner,event,outcome);if(!row)return;
    if(this.sourcePointerRows.length===HFR_SOURCE_POINTER_LIMIT){this.sourcePointerRows.shift();this.sourcePointerOverflow++;}this.sourcePointerRows.push(row);
  }

  /** Native/canvas adapters share this exact current-button transaction. Static
   * reading allows its audited glossary host call, while audio and clocks stay off. */
  runSourceButtonRelease(runtime: Runtime, button: DisplayObject, point: readonly [number, number] | null, release: () => void): boolean {
    if (this.destroyed || this.rt !== runtime || this.sourceReleaseButton || !(button instanceof ButtonObj) ||
        button.rt !== runtime || !runtime.allObjects().includes(button) || !runtime.isClickable(button) ||
        this.opts.sourceButtonInput?.(runtime, button, point) !== "allowed") return false;
    this.sourceReleaseButton = button;
    try {release(); return true;} finally {this.sourceReleaseButton = null;}
  }

  start(): void {
    if (this.staticSourceState || this.running || !this.rt || !this.data || document.hidden) return;
    ++this.mediaIntent;
    const generation = ++this.playbackGeneration;
    const loadGeneration = this.loadGeneration, lease = this.runtimeLease, session = this.session;
    const sameLoad = () => loadGeneration === this.loadGeneration && lease === this.runtimeLease && session === this.session;
    this.running = true;
    {const owner=this.observationOwner();if(owner)publishTechnicalState(this.canvas,owner,{}, {paused:false});}
    const mediaCurrent = this.currentMediaOperation();
    if (this.audioAllowed && !this.narrationStopped) {
      void this.audio?.resume().catch(() => undefined).then(() => {if (mediaCurrent()) this.reportMediaState();});
      if (this.spanish) void this.playSpanish(this.spanish);
    }
    this.reportMediaState();
    this.last = performance.now();
    this.acc = 0;
    const fps = this.data.stage.fps;
    const step = (t: number) => {
      if (generation !== this.playbackGeneration || !sameLoad() || !this.running) return;
      if (!this.rt) {this.pause(); return;} // only this retired player's resources
      try {
        this.acc += Math.min(250, t - this.last);
        this.last = t;
        const dt = 1000 / fps;
        let n = 0;
        while (this.running && generation === this.playbackGeneration && sameLoad() && this.acc >= dt && n++ < 4) {
          if (!lease || !this.owner?.tick(lease)) break;
          this.trackProgress();
          this.opts.onSourceTick?.();
          this.acc -= dt;
          // Keep remaining timer debt, but let this real source state reach the
          // canvas/native projection and a browser paint before another tick.
          if (this.rt?.presentationBoundary) break;
        }
        this.redraw();
        if (generation === this.playbackGeneration && sameLoad() && this.running && this.rt)
          this.scheduleFrame(step);
      } catch (error) {
        // A failed Runtime has already invalidated its lease, so rt is null here.
        // Compare the captured owner/load, never renew or re-activate that lease.
        if (!sameLoad()) return;
        if (session && isPageSessionCurrent(session)) {
          this.lastError = error;
          this.destroy();
          this.opts.onError?.(error);
        } else this.destroy(); // only this obsolete player's media; no successor UI failure
      }
    };
    this.scheduleFrame(step);
  }

  pause(): void {
    ++this.mediaIntent;
    ++this.playbackGeneration;
    this.running = false;
    {const owner=this.observationOwner();if(owner)publishTechnicalState(this.canvas,owner,{}, {paused:true});}
    cancelAnimationFrame(this.raf); this.frameRequest=null;
    if (this.rt) {this.rt.keysDown.clear(); this.rt.mouse.down = false; this.rt.pressed = null; this.rt.drag = null;}
    const mediaCurrent = this.currentMediaOperation();
    void this.audio?.suspend().catch(() => undefined).then(() => {if (mediaCurrent()) this.reportMediaState();});
    this.spanish?.pause();
    this.reportMediaState();
  }

  /** Canvas backing size follows its CSS box and the device pixel ratio. */
  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w && h && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.redraw();
    }
  }

  setVolume(v: number): void { this.volume = Math.max(0, Math.min(1, v)); this.applyVolume(); }

  /** ES routes the lesson's Spanish narration and mutes the English streams. */
  setSpanish(on: boolean): void {
    if (on && !this.rt) return;
    if (this.spanishWanted !== on) ++this.mediaIntent;
    this.spanishWanted = on;
    const src = this.data?.spanishAudio;
    if (on && src && this.audioAllowed && !this.staticSourceState) {
      if (!this.spanish) {
        this.spanish = new Audio(this.baseUrl + src);
        const owner=this.observationOwner();bindTechnicalOwner(this.spanish,owner);
        if(this.htmlMediaAudit.rows.size<HTML_MEDIA_OBSERVATION_LIMIT)
          this.htmlMediaAudit.rows.set(this.spanish,{mediaId:technicalObjectId(this.spanish,'html-media'),ownerId:owner?.playerId??null,pendingPlays:0});
        else this.htmlMediaAudit.overflow++;
        this.spanish.volume = this.volume;
        this.spanishBlocked = false;
        const media = this.spanish, generation = this.loadGeneration;
        const changed = (event: Event) => {
          if (generation !== this.loadGeneration || this.spanish !== media) return;
          if (!this.rt || !this.running || this.narrationStopped) {
            if (!media.paused) media.pause();
          } else if (event.type === "error") this.spanishBlocked = true;
          else if (!media.paused) this.spanishBlocked = false;
          this.reportMediaState();
        };
        for (const event of ["playing", "pause", "ended", "error"]) {
          media.addEventListener(event, changed);
          this.spanishListeners.push(() => media.removeEventListener(event, changed));
        }
        if (this.running && !this.narrationStopped) void this.playSpanish(media);
      }
    } else if (this.spanish) {
      this.clearSpanish();
    }
    this.applyVolume();
    this.reportMediaState();
  }

  /** Start sound after a learner gesture (the shell's narration button). */
  async resumeAudio(): Promise<void> {
    if (this.staticSourceState || !this.audioAllowed || !this.running || !this.rt || document.hidden) return;
    ++this.mediaIntent;
    this.narrationStopped = false;
    this.audio?.setEnabled(true);
    const mediaCurrent = this.currentMediaOperation(), spanish = this.spanish;
    await this.audio?.resume().catch(() => undefined);
    if (!mediaCurrent()) return;
    if (spanish && this.spanish === spanish) await this.playSpanish(spanish);
    if (mediaCurrent()) this.reportMediaState();
  }

  stopNarration(): void {
    ++this.mediaIntent;
    this.narrationStopped = true;
    this.audio?.setEnabled(false);
    this.spanish?.pause();
    this.reportMediaState();
  }

  narrationState(): HfrNarrationState {
    if (this.staticSourceState || !this.audioAllowed || !this.data || !this.rt) return "unavailable";
    const hasEnglish = this.data.streams.length > 0;
    const hasSpanish = Boolean(this.data.spanishAudio);
    if (!hasEnglish && !(this.spanishWanted && hasSpanish)) return "unavailable";
    if (!this.running || this.narrationStopped) return "idle";
    if (this.spanish) return this.spanish.paused ? this.spanishBlocked ? "blocked" : "idle" : "playing";
    if (this.audio?.ctx.state !== "running") return this.running ? "blocked" : "idle";
    return this.audio.active.size > 0 || [...this.audio.events.values()].some(events => events.length > 0) ? "playing" : "idle";
  }

  progress(): HfrProgress {
    const clip = this.findProgressClip();
    const frame = clip?.frame ?? 1;
    const frameCount = clip?.totalFrames ?? 1;
    return {
      frame: Math.max(1, frame),
      frameCount: Math.max(1, frameCount),
      domain: !clip || clip === this.rt?.page_ ? "root" : `sprite-${clip.charId}`,
      settled: this.settledTicks >= SETTLE_TICKS,
      reachedEnd: this.reachedEnd,
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    ++this.loadGeneration;
    this.teardown();
  }

  // ---- internals
  private teardown(): void {
    retireTechnicalObservation(this.canvas,this.lifecycleRead?.identity??this.observationOwner());
    this.sourceReleaseButton = null;
    this.pause();
    for (const [t, ev, fn] of this.handlers) t.removeEventListener(ev, fn);
    this.handlers = [];
    this.clearSpanish();
    try {if (this.runtimeLease) this.owner?.release(this.runtimeLease);}
    finally {
      this.audio?.close(); this.audio = null;
      this.runtimeLease = null; this.owner = null; this.session = null;
    }
  }

  private reportMediaState(): void { if (!this.destroyed && this.rt) this.opts.onMediaStateChange?.(); }

  private currentMediaOperation(): () => boolean {
    const generation = this.loadGeneration, intent = this.mediaIntent;
    const audio = this.audio, session = this.session, lease = this.runtimeLease;
    return () => !this.destroyed && generation === this.loadGeneration && intent === this.mediaIntent &&
      audio === this.audio && session === this.session && lease === this.runtimeLease && Boolean(this.rt);
  }

  private async playSpanish(media: HTMLAudioElement): Promise<void> {
    const current = this.currentMediaOperation();
    this.spanishBlocked = false;
    const audit=this.htmlMediaAudit.rows.get(media);if(audit)audit.pendingPlays++;
    try {
      await media.play();
      if (!current()) {
        // Stop only this old element; never cancel a newer valid play on it.
        if (this.destroyed || !this.rt || this.spanish !== media || !this.running || this.narrationStopped) media.pause();
        return;
      }
    } catch {
      if (!current()) return;
      this.spanishBlocked = true;
    } finally {if(audit)audit.pendingPlays--;}
    this.reportMediaState();
  }

  private clearSpanish(): void {
    for (const remove of this.spanishListeners) remove();
    this.spanishListeners = [];
    this.spanish?.pause();
    this.spanish = null;
    this.spanishBlocked = false;
  }

  private applyVolume(): void {
    const v = this.volume;
    if (this.audio) {
      this.audio.volume = v;
      this.audio.setMuted(this.staticSourceState || !this.audioAllowed || Boolean(this.spanish));
    }
    if (this.spanish) this.spanish.volume = v;
    if (this.rt) this.rt.Global.set("volLevel", Math.round(v * 100));
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
    if (clip && clip.frame >= clip.totalFrames) this.reachedEnd = true;
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
    const disposition = (rt: Runtime, button: DisplayObject | null, point: readonly [number, number]) =>
      button ? this.opts.sourceButtonInput?.(rt, button, point) ?? "unhandled" : "unhandled";
    type Gesture = {pointerId:number;runtime:Runtime;lease:RuntimeLease|null;revision:number;drag:{clip:DisplayObject;tx:number;ty:number;scriptMoved:boolean}|null};
    let gesture:Gesture|null=null, revision=0, cancelledPointerId:number|null=null;
    const rememberGesture = (rt:Runtime,pointerId:number) => {
      const clip=rt.drag?.clip as DisplayObject|undefined;
      gesture={pointerId,runtime:rt,lease:this.runtimeLease,revision:++revision,drag:clip?{clip,tx:clip.m.tx,ty:clip.m.ty,scriptMoved:clip.scriptMoved}:null};
      cancelledPointerId=null;
    };
    const currentGesture = (rt:Runtime,pointerId:number) => gesture?.pointerId===pointerId && gesture.runtime===rt &&
      gesture.lease===this.runtimeLease && gesture.revision===revision ? gesture : null;
    const clearPress = (rt: Runtime) => {
      if (rt.pressed instanceof ButtonObj) rt.pressed.setState("up");
      rt.pressed = null; rt.mouse.down = false; rt.drag = null;
    };
    // DOM cancellation retires only this input gesture. It does not execute the
    // authored release/releaseOutside grading action or retire the page lease.
    const cancelGesture = (rt:Runtime,held:Gesture,event:PointerEvent) => {
      if(gesture!==held || held.revision!==revision || held.runtime!==rt || held.lease!==this.runtimeLease || this.rt!==rt)return;
      if(held.drag && rt.drag?.clip===held.drag.clip && !held.drag.clip.removed){
        held.drag.clip.m.tx=held.drag.tx;held.drag.clip.m.ty=held.drag.ty;held.drag.clip.scriptMoved=held.drag.scriptMoved;
      }
      const pointerOwner=this.observationOwner();if(sourceObservationRequested(pointerOwner)){
        const cancelled=sourcePointerOutcome(rt,'cancel',sourceObjectFacts(rt.pressed),rt.tickCount,rt.errors.length,null,sourceActionTrace(),false);
        this.observeSourcePointer(event,rt,pointerOwner,cancelled);
      }
      clearPress(rt);gesture=null;cancelledPointerId=held.pointerId;++revision;
      this.canvas.style.cursor="default";
      this.opts.onSourcePointerMutation?.(rt);
    };
    const finishGesture = (held:Gesture) => {if(gesture===held){gesture=null;++revision;}};
    const cancelledMove = (rt:Runtime,e:PointerEvent) => cancelledPointerId===e.pointerId ||
      Boolean(gesture && !currentGesture(rt,e.pointerId));
    on(this.canvas, "pointermove", (e: PointerEvent) => {
      const rt = this.rt;
      if(rt && cancelledMove(rt,e))return;
      // Preserve the original event order and getter count on ordinary pages.
      if (!this.opts.sourceButtonInput) {
        if (!this.running || !rt) return;
        const [x, y] = this.stagePoint(e); rt.pointerMove(x, y); this.canvas.style.cursor = rt.hover && rt.hover.get("useHandCursor") !== false ? "pointer" : "default";
        return;
      }
      if (!rt) return;
      const point = this.stagePoint(e), button = rt.pressed ?? rt.topClickableAt(...point);
      const decision = disposition(rt, button, point);
      if (decision === "blocked" || (!this.running && decision !== "allowed")) {this.canvas.style.cursor = "default"; return;}
      rt.pointerMove(...point);
      this.opts.onSourcePointerMutation?.(rt);
      this.canvas.style.cursor = rt.hover && rt.hover.get("useHandCursor") !== false ? "pointer" : "default";
    });
    on(this.canvas, "pointerdown", (e: PointerEvent) => {
      const rt = this.rt;
      if(gesture && (gesture.runtime!==rt || gesture.lease!==this.runtimeLease || (!rt?.pressed && !rt?.drag))){gesture=null;++revision;}
      if(gesture)return;
      // Preserve the original event order and getter count on ordinary pages.
      if (!this.opts.sourceButtonInput) {
        if (!this.running || !rt) return;
        const [x, y] = this.stagePoint(e); rt.pointerMove(x, y); const owner=this.observationOwner();this.observeSourcePointer(e,rt,owner,rt.pointerDown(sourceObservationRequested(owner)));rememberGesture(rt,e.pointerId);this.canvas.setPointerCapture(e.pointerId);
        return;
      }
      if (!rt) return;
      const point = this.stagePoint(e), decision = disposition(rt, rt.topClickableAt(...point), point);
      if (decision === "blocked" || (!this.running && decision !== "allowed")) return;
      rt.pointerMove(...point); const owner=this.observationOwner();this.observeSourcePointer(e,rt,owner,rt.pointerDown(sourceObservationRequested(owner)));rememberGesture(rt,e.pointerId);this.canvas.setPointerCapture(e.pointerId);
      this.opts.onSourcePointerMutation?.(rt);
    });
    on(this.canvas, "pointerup", (e: PointerEvent) => {
      const rt = this.rt;
      if(!rt)return;const held=currentGesture(rt,e.pointerId);if(!held)return;
      // Preserve the original event order and getter count on ordinary pages.
      if (!this.opts.sourceButtonInput) {
        if (!this.running) {cancelGesture(rt,held,e);return;}
        const [x, y] = this.stagePoint(e); rt.pointerMove(x, y); const owner=this.observationOwner();this.observeSourcePointer(e,rt,owner,rt.pointerUp(sourceObservationRequested(owner)));finishGesture(held);
        return;
      }
      const point = this.stagePoint(e), button = rt.pressed, decision = disposition(rt, button, point);
      if (decision === "blocked" || (!this.running && decision !== "allowed")) {cancelGesture(rt,held,e);return;}
      rt.pointerMove(...point);
      if (button && decision === "allowed" && this.opts.onSourceButtonRelease) {
        let released = false;
        this.opts.onSourceButtonRelease(rt, button, point, () => {
          if (released || gesture!==held || held.revision!==revision || held.lease!==this.runtimeLease || this.rt !== rt || rt.pressed !== button || disposition(rt, button, point) !== "allowed") return;
          released = true; const owner=this.observationOwner();this.observeSourcePointer(e,rt,owner,rt.pointerUp(sourceObservationRequested(owner)));
        });
        if (!released) cancelGesture(rt,held,e);else finishGesture(held);
      } else {const owner=this.observationOwner();this.observeSourcePointer(e,rt,owner,rt.pointerUp(sourceObservationRequested(owner)));finishGesture(held);}
    });
    const cancel = (e:PointerEvent) => {const rt=this.rt;if(!rt)return;const held=currentGesture(rt,e.pointerId);if(held)cancelGesture(rt,held,e);};
    on(this.canvas,"pointercancel",cancel);
    on(this.canvas,"lostpointercapture",cancel);
    on(this.canvas, "keydown", (e: KeyboardEvent) => {if (this.running) this.rt?.keyDown(e.keyCode, e.key.length === 1 ? e.key.charCodeAt(0) : 0);});
    on(this.canvas, "keyup", (e: KeyboardEvent) => {if (this.running) this.rt?.keyUp(e.keyCode);});
  }
}
