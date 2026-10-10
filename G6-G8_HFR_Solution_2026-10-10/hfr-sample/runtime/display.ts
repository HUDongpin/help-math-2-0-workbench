// HFR runtime · display list, timeline, built-ins and the HELP Math 1.0
// course-shell adapter. Rendering, audio and input are injected (see player.ts).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AVM1, ASObject, ASFunction, ASArray, NOTFOUND, PROPS, type Ctx } from "./avm";
import type { PageData, PageScripts, HostCall } from "./types";

export const DYNAMIC_DEPTH = 16384;
export type Matrix = { a: number; b: number; c: number; d: number; tx: number; ty: number };
const ID = (): Matrix => ({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
const toM = (m?: number[]): Matrix => (m ? { a: m[0], b: m[1], c: m[2], d: m[3], tx: m[4], ty: m[5] } : ID());
export const mul = (m: Matrix, n: Matrix): Matrix => ({ a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b, c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d, tx: m.a * n.tx + m.c * n.ty + m.tx, ty: m.b * n.tx + m.d * n.ty + m.ty });
export const invert = (m: Matrix): Matrix => { const det = m.a * m.d - m.b * m.c || 1e-9; return { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det, tx: (m.c * m.ty - m.d * m.tx) / det, ty: (m.b * m.tx - m.a * m.ty) / det }; };
export const apply = (m: Matrix, x: number, y: number): [number, number] => [m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty];
export type Rect = { xmin: number; xmax: number; ymin: number; ymax: number };
function xformRect(m: Matrix, r: Rect | null): Rect | null {
  if (!r) return null;
  const pts = [apply(m, r.xmin, r.ymin), apply(m, r.xmax, r.ymin), apply(m, r.xmin, r.ymax), apply(m, r.xmax, r.ymax)];
  return { xmin: Math.min(...pts.map((p) => p[0])), xmax: Math.max(...pts.map((p) => p[0])), ymin: Math.min(...pts.map((p) => p[1])), ymax: Math.max(...pts.map((p) => p[1])) };
}
const union = (a: Rect | null, b: Rect | null): Rect | null => (!a ? b : !b ? a : { xmin: Math.min(a.xmin, b.xmin), xmax: Math.max(a.xmax, b.xmax), ymin: Math.min(a.ymin, b.ymin), ymax: Math.max(a.ymax, b.ymax) });
function stripHtml(s: string): string { return String(s).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\n$/, ""); }

const CLIP_EVENTS: Record<string, number> = { load: 0x1, enterFrame: 0x2, unload: 0x4, mouseMove: 0x8, mouseDown: 0x10, mouseUp: 0x20, keyDown: 0x40, keyUp: 0x80, data: 0x100, initialize: 0x200, press: 0x400, release: 0x800, releaseOutside: 0x1000, rollOver: 0x2000, rollOut: 0x4000, dragOver: 0x8000, dragOut: 0x10000, keyPress: 0x20000, construct: 0x40000 };
const HANDLER: Record<string, string> = { load: "onLoad", enterFrame: "onEnterFrame", unload: "onUnload", mouseMove: "onMouseMove", mouseDown: "onMouseDown", mouseUp: "onMouseUp", keyDown: "onKeyDown", keyUp: "onKeyUp", data: "onData", press: "onPress", release: "onRelease", releaseOutside: "onReleaseOutside", rollOver: "onRollOver", rollOut: "onRollOut", dragOver: "onDragOver", dragOut: "onDragOut" };
export const SHELL_FUNCTIONS = ["DoHyperLinks", "enableQuizButton", "disableQuizButton", "showRightFeed", "showWrongFeed", "doPlayFQQuestionAudio", "doPlayFQAnswerAudio", "setBookMark", "getBookMark", "doCloseApp", "doNeedMoreHelp", "doPlaySpanishAudio", "doStopSpanishAudio", "doCheckSpanishAudio", "doPlayNextMovie", "doPlayPreviousMovie", "loadSWFMovie", "doGetSwfFileName", "doMapClickEnableAll"];
const SHELL_CLIPS = ["InternalPreloader", "popup", "replay_mc", "back_mc", "next_mc", "pause_mc", "play_mc", "nextani", "Send_Quiz_Report_Mc", "Send_Click_Report_Mc"];
const SHELL_TEXT = ["dtfFinalQuizAudio", "dtfFinalQuizSpanishAudio", "dtfFinalQuizAnswerAudio", "dtfFinalQuizAnswerSpanishAudio", "dtfClicks"];
const KNOWN_API = new Set("attachaudio attachmovie beginfill begingradientfill clear createemptymovieclip createtextfield curveto duplicatemovieclip endfill getbounds getbytesloaded getbytestotal getdepth getinstanceatdepth getnexthighestdepth getswfversion geturl globaltolocal gotoandplay gotoandstop hittest linestyle lineto loadmovie loadvariables localtoglobal moveto nextframe play prevframe removemovieclip setmask startdrag stop stopdrag swapdepths unloadmovie addlistener getnewtextformat gettextformat removelistener removetextfield replacesel setnewtextformat settextformat concat join pop push reverse shift slice sort sorton splice tostring unshift charat charcodeat fromcharcode indexof lastindexof split substr substring tolowercase touppercase abs acos asin atan atan2 ceil cos exp floor log max min pow random round sin sqrt tan getrgb setrgb settransform gettransform".split(" "));

export interface AudioSink {
  streamFrame(clip: MovieClip, stream: any, frame: number, playing: boolean): number | null; // desired frame when synced to audio
  streamStop(clip: MovieClip): void;
  playEvent(src: string, info: any, owner?: any): void;
  stopAll(): void;
  setVolume?(v: number): void;
}

// ---------------------------------------------------------------- display objects
export class DisplayObject extends ASObject {
  def: any; parentClip: MovieClip | null; depth: number; name: string; charId: number;
  m: Matrix = ID(); cx: number[] = [256, 256, 256, 256, 0, 0, 0, 0]; ratio = 0; clipDepth = 0; visible = true; removed = false; scriptMoved = false; asVisible = false;
  constructor(rt: Runtime, proto: ASObject | null, def: any, parent: MovieClip | null, depth: number, name: string, charId = -1) {
    super(rt, proto); this.isDisplay = true; this.def = def; this.parentClip = parent; this.depth = depth; this.name = name ?? ""; this.charId = charId;
  }
  get rtx(): Runtime { return this.rt as Runtime; }
  targetPath(): string { return this.parentClip ? this.parentClip.targetPath() + "." + this.name : "_level0"; }
  slashPath(): string { if (!this.parentClip) return "/"; const p = this.parentClip.slashPath(); return (p === "/" ? "/" : p + "/") + this.name; }
  localBounds(): Rect | null { return this.def?.bounds ?? null; }
  bounds(): Rect | null { return xformRect(this.m, this.localBounds()); }
  worldMatrix(): Matrix { return this.parentClip ? mul(this.parentClip.worldMatrix(), this.m) : this.m; }
  dispProp(name: string): any {
    switch (this.rt.k(name)) {
      case "_x": return this.m.tx / 20;
      case "_y": return this.m.ty / 20;
      case "_xscale": return Math.hypot(this.m.a, this.m.b) * 100;
      case "_yscale": return Math.hypot(this.m.c, this.m.d) * 100;
      case "_rotation": return (Math.atan2(this.m.b, this.m.a) * 180) / Math.PI;
      case "_alpha": return (this.cx[3] / 256) * 100;
      case "_visible": return this.visible;
      case "_width": { const b = this.bounds(); return b ? (b.xmax - b.xmin) / 20 : 0; }
      case "_height": { const b = this.bounds(); return b ? (b.ymax - b.ymin) / 20 : 0; }
      case "_name": return this.name;
      case "_parent": return this.parentClip ?? undefined;
      case "_root": case "_level0": return this.rtx.shell;
      case "_global": return this.rt.Global;
      case "_target": return this.slashPath();
      case "_currentframe": return this.isClip ? Math.max(1, (this as any).frame) : undefined;
      case "_totalframes": case "_framesloaded": return this.isClip ? (this as any).totalFrames : undefined;
      case "_xmouse": { const [x] = apply(invert(this.worldMatrix()), this.rtx.mouse.x * 20, this.rtx.mouse.y * 20); return Math.round(x / 20); }
      case "_ymouse": { const [, y] = apply(invert(this.worldMatrix()), this.rtx.mouse.x * 20, this.rtx.mouse.y * 20); return Math.round(y / 20); }
      case "_droptarget": return this.rtx.dropTarget;
      case "_url": return "page.swf";
      case "_highquality": return 1; case "_quality": return "HIGH"; case "_focusrect": return true; case "_soundbuftime": return 5;
      default: return NOTFOUND;
    }
  }
  setScale(sx: number | null, sy: number | null): void {
    const rot = Math.atan2(this.m.b, this.m.a), skew = Math.atan2(-this.m.c, this.m.d);
    if (sx !== null) { this.m.a = Math.cos(rot) * sx; this.m.b = Math.sin(rot) * sx; }
    if (sy !== null) { this.m.c = -Math.sin(skew) * sy; this.m.d = Math.cos(skew) * sy; }
  }
  setDispProp(name: string, v: any): boolean {
    const rt = this.rt; const k = rt.k(name); const n = () => rt.toNum(v);
    switch (k) {
      case "_x": { const x = n(); if (Number.isFinite(x)) this.m.tx = x * 20; break; }
      case "_y": { const y = n(); if (Number.isFinite(y)) this.m.ty = y * 20; break; }
      case "_xscale": { const s = n(); if (Number.isFinite(s)) this.setScale(s / 100, null); break; }
      case "_yscale": { const s = n(); if (Number.isFinite(s)) this.setScale(null, s / 100); break; }
      case "_rotation": { const r0 = n(); if (Number.isFinite(r0)) { const sx = Math.hypot(this.m.a, this.m.b), sy = Math.hypot(this.m.c, this.m.d); const r = (r0 * Math.PI) / 180; this.m.a = Math.cos(r) * sx; this.m.b = Math.sin(r) * sx; this.m.c = -Math.sin(r) * sy; this.m.d = Math.cos(r) * sy; } break; }
      case "_alpha": { const a = n(); if (Number.isFinite(a)) this.cx[3] = (a / 100) * 256; break; }
      case "_visible": this.visible = rt.toBool(v); break;
      case "_width": case "_height": {
        const val = n(); const b = this.localBounds(); if (!b || !Number.isFinite(val)) break;
        const w = (k === "_width" ? b.xmax - b.xmin : b.ymax - b.ymin) / 20; if (w <= 0) break;
        if (k === "_width") this.setScale(val / w, null); else this.setScale(null, val / w);
        break;
      }
      case "_name": if (this.parentClip) this.name = rt.toStr(v); break;
      case "_quality": case "_highquality": case "_focusrect": case "_soundbuftime": case "_currentframe": case "_totalframes": case "_framesloaded": case "_target": case "_url": case "_droptarget": case "_xmouse": case "_ymouse": case "_parent": case "_root": case "_level0": case "_global": return true;
      default: return false;
    }
    this.scriptMoved = true; return true;
  }
  getLocal(name: string, thisObj: any): any {
    const own = super.getLocal(name, thisObj);
    if (own !== NOTFOUND) return own;
    if (this.isClip) { const c = (this as any).childByName(name); if (c) return c; }
    return this.dispProp(name);
  }
  setLocalVirtual(name: string, v: any): boolean { return this.dispProp(name) !== NOTFOUND ? this.setDispProp(name, v) : false; }
  typeOf(): string { return this.isClip ? "movieclip" : "object"; }
  toStringDefault(): string { return this.targetPath(); }
  ancestorsVisible(): boolean { let o: DisplayObject | null = this; while (o) { if (!o.visible || o.removed) return false; o = o.parentClip; } return true; }
  getPropIndex(i: number): any { return PROPS[i] ? this.dispProp(PROPS[i]) : undefined; }
  setPropIndex(i: number, v: any): void { if (PROPS[i]) this.setDispProp(PROPS[i], v); }
}

export class MovieClip extends DisplayObject {
  children = new Map<number, DisplayObject>(); frame = 0; playing = true; clipActions: any[] = []; bornTick: number; looped = false;
  graphics: any[] = []; stream: any = null; mask: DisplayObject | null = null;
  constructor(rt: Runtime, proto: ASObject | null, def: any, parent: MovieClip | null, depth: number, name: string, charId = -1) {
    super(rt, proto, def, parent, depth, name, charId); this.isClip = true; this.bornTick = rt.tickCount; this.asVisible = true;
    this.stream = rt.streamsByTimeline.get(charId) ?? null;
  }
  get totalFrames(): number { return Math.max(1, this.def.frameCount || 0, this.def.frames?.length || 0); }
  childByName(name: string): DisplayObject | null {
    const k = this.rt.k(name); let best: DisplayObject | null = null;
    for (const c of this.children.values()) if (!c.removed && c.asVisible && this.rt.k(c.name) === k && (!best || c.depth < best.depth)) best = c;
    return best;
  }
  sortedChildren(): DisplayObject[] { return [...this.children.values()].sort((a, b) => a.depth - b.depth); }
  localBounds(): Rect | null {
    let r: Rect | null = this.graphicsBounds();
    for (const c of this.children.values()) if (!c.removed) r = union(r, c.bounds());
    return r;
  }
  graphicsBounds(): Rect | null {
    let r: Rect | null = null;
    for (const g of this.graphics) for (let i = 1; i + 1 < g.length; i += 2) if (g[0] === "mt" || g[0] === "lt" || g[0] === "ct") { const x = g[i] * 20, y = g[i + 1] * 20; r = union(r, { xmin: x, xmax: x, ymin: y, ymax: y }); }
    return r;
  }
  applyFrameTags(f: number, runActions: boolean): void {
    for (const t of this.def.frames?.[f - 1] || []) {
      if (t.op === "place") this.placeTag(t);
      else if (t.op === "remove") this.removeAtDepth(t.depth);
      else if (t.op === "action" && runActions) this.rtx.queueScript(this, t.script);
      else if (t.op === "init") this.rtx.runInit(this, t);
      else if (t.op === "sound" && runActions) this.rtx.startSound(t.id, t.info, this);
    }
  }
  placeTag(t: any): void {
    const existing = this.children.get(t.depth);
    if (!t.move && t.charId !== undefined) { if (existing) this.removeAtDepth(t.depth); this.instantiate(t.charId, t.depth, t.name, t); }
    else if (t.move && t.charId === undefined) {
      if (!existing) return;
      if (!existing.scriptMoved) { if (t.m) existing.m = toM(t.m); if (t.cx) existing.cx = t.cx.slice(); }
      if (t.ratio !== undefined) existing.ratio = t.ratio;
      if (t.name) existing.name = t.name;
    } else if (t.move && t.charId !== undefined) {
      if (existing && existing.charId === t.charId) { if (t.m && !existing.scriptMoved) existing.m = toM(t.m); if (t.ratio !== undefined) existing.ratio = t.ratio; return; }
      const keep = existing ? { m: existing.m, cx: existing.cx, name: existing.name } : null;
      if (existing) this.removeAtDepth(t.depth);
      const o = this.instantiate(t.charId, t.depth, t.name ?? keep?.name, t);
      if (o && keep && !t.m) o.m = keep.m;
      if (o && keep && !t.cx) o.cx = keep.cx;
    }
  }
  instantiate(charId: number, depth: number, name: string | undefined, t: any, opts: any = {}): DisplayObject | null {
    const rt = this.rtx; const def = rt.page.dictionary[charId];
    if (!def) { rt.note("missingCharacter", String(charId)); return null; }
    let o: DisplayObject;
    if (def.kind === "sprite") { const cls = rt.classForChar(charId); o = new MovieClip(rt, cls ? cls.get("prototype") : rt.MovieClipProto, def, this, depth, name || `instance${++rt.instanceCounter}`, charId); }
    else if (def.kind === "button") { o = new ButtonObj(rt, rt.ButtonProto, def, this, depth, name || `instance${++rt.instanceCounter}`, charId); o.asVisible = true; }
    else if (def.kind === "edittext") { o = new TextFieldObj(rt, rt.TextFieldProto, def, this, depth, name || `instance${++rt.instanceCounter}`, charId); o.asVisible = true; }
    else { o = new DisplayObject(rt, null, def, this, depth, name ?? "", charId); }
    if (t?.m) o.m = toM(t.m);
    if (t?.cx) o.cx = t.cx.slice();
    if (t?.ratio !== undefined) o.ratio = t.ratio;
    if (t?.clipDepth) o.clipDepth = t.clipDepth;
    this.children.set(depth, o);
    if (o instanceof MovieClip) {
      if (t?.clipActions) o.clipActions = t.clipActions;
      if (opts.init instanceof ASObject) for (const k2 of opts.init.enumKeys()) o.set(k2, opts.init.get(k2));
      rt.fireClipActions(o, "initialize");
      const cls = rt.classForChar(charId);
      if (cls) { o.define("__constructor__", cls, { dontEnum: true }); rt.safe(() => rt.callFn(cls, o, [], cls.get("prototype"))); }
      o.frame = 1; o.applyFrameTags(1, true);
      rt.queueEvent(o, "load");
    } else if (o instanceof ButtonObj) { if (t?.clipActions) (o as any).clipActions = t.clipActions; o.setState("up"); }
    return o;
  }
  removeAtDepth(depth: number): void { const o = this.children.get(depth); if (!o) return; this.children.delete(depth); this.rtx.unloadTree(o); }
  advance(): void {
    if (this.removed) return;
    const rt = this.rtx;
    if (this.playing && this.totalFrames > 1 && this.bornTick !== rt.tickCount) {
      let target = this.frame + 1;
      if (this.stream && rt.audio) { const f = rt.audio.streamFrame(this, this.stream, this.frame, true); if (f !== null) target = Math.max(this.frame, Math.min(f, this.totalFrames)); }
      let guard = 0;
      while (this.frame < target && this.playing && !this.removed && guard++ < 24) {
        const next = this.frame + 1;
        if (next > this.totalFrames) { this.gotoFrame(1); this.looped = true; break; }
        this.frame = next; this.applyFrameTags(next, true);
        if (!this.looped) rt.frameAdvances++;
      }
    } else if (this.stream && rt.audio && !this.playing) rt.audio.streamStop(this);
    for (const c of this.sortedChildren()) {
      if (c instanceof MovieClip && !c.removed) c.advance();
      else if (c instanceof ButtonObj && !c.removed) for (const s of c.stateChildren) if (s instanceof MovieClip) s.advance();
    }
  }
  gotoFrame(f: number): void {
    f = Math.max(1, Math.min(this.totalFrames, f | 0));
    if (f === this.frame) return;
    if (this.stream && this.rtx.audio) this.rtx.audio.streamStop(this);
    if (f > this.frame) { for (let i = this.frame + 1; i <= f; i++) this.applyFrameTags(i, i === f); this.frame = f; return; }
    const desired = new Map<number, any>();
    for (let i = 1; i <= f; i++) for (const t of this.def.frames?.[i - 1] || []) {
      if (t.op === "place") {
        if (!t.move && t.charId !== undefined) desired.set(t.depth, { ...t });
        else if (t.move && t.charId === undefined) { const d = desired.get(t.depth); if (d) { if (t.m) d.m = t.m; if (t.cx) d.cx = t.cx; if (t.name) d.name = t.name; if (t.ratio !== undefined) d.ratio = t.ratio; } }
        else if (t.move && t.charId !== undefined) { const d = desired.get(t.depth); desired.set(t.depth, { ...(d || {}), ...t, move: false, clipActions: t.clipActions ?? d?.clipActions }); }
      } else if (t.op === "remove") desired.delete(t.depth);
    }
    for (const [depth, o] of [...this.children]) { if (depth >= DYNAMIC_DEPTH) continue; const d = desired.get(depth); if (!d || d.charId !== o.charId) this.removeAtDepth(depth); }
    for (const [depth, d] of desired) {
      const o = this.children.get(depth);
      if (!o) this.instantiate(d.charId, depth, d.name, d);
      else { if (d.m && !o.scriptMoved) o.m = toM(d.m); if (d.cx && !o.scriptMoved) o.cx = d.cx.slice(); if (d.ratio !== undefined) o.ratio = d.ratio; }
    }
    this.frame = f;
    for (const t of this.def.frames?.[f - 1] || []) if (t.op === "action") this.rtx.queueScript(this, t.script);
  }
  playCmd() { this.playing = true; }
  stopCmd() { this.playing = false; if (this.stream && this.rtx.audio) this.rtx.audio.streamStop(this); }
  gotoCmd(f: number, play: boolean) { this.gotoFrame(f); this.playing = !!play; if (!play && this.stream && this.rtx.audio) this.rtx.audio.streamStop(this); }
  labelFrame(label: string): number | undefined { const L = this.def.labels || {}; const k = String(label).toLowerCase(); for (const n of Object.keys(L)) if (n.toLowerCase() === k) return L[n]; return undefined; }
  gotoLabelCmd(label: string, play: boolean) { const f = this.labelFrame(label); if (f) this.gotoCmd(f, play); else this.rtx.note("missingLabel", String(label)); }
  nextFrameCmd() { this.gotoFrame(this.frame + 1); this.playing = false; }
  prevFrameCmd() { this.gotoFrame(this.frame - 1); this.playing = false; }
  duplicate(newName: string, depth: number, init?: any): any {
    if (!this.parentClip) return undefined;
    const p = this.parentClip, d = depth + DYNAMIC_DEPTH;
    if (p.children.has(d)) p.removeAtDepth(d);
    const o = p.instantiate(this.charId, d, newName, { m: [this.m.a, this.m.b, this.m.c, this.m.d, this.m.tx, this.m.ty], cx: this.cx, clipActions: this.clipActions }, { init });
    return o ?? undefined;
  }
  removeCmd() { if (this.parentClip && this.depth >= 0) this.parentClip.removeAtDepth(this.depth); }
}

export class ButtonObj extends DisplayObject {
  state: "up" | "over" | "down" = "up"; stateChildren: DisplayObject[] = []; clipActions: any[] = [];
  constructor(rt: Runtime, proto: ASObject | null, def: any, parent: MovieClip | null, depth: number, name: string, charId: number) { super(rt, proto, def, parent, depth, name, charId); this.isButton = true; }
  setState(s: "up" | "over" | "down"): void {
    if (s === this.state && this.stateChildren.length) return;
    this.state = s; const bit = s === "up" ? 1 : s === "over" ? 2 : 4;
    for (const c of this.stateChildren) this.rtx.unloadTree(c);
    this.stateChildren = [];
    const holder = this.parentClip!;
    for (const r of [...this.def.records].sort((a: any, b: any) => a.depth - b.depth)) {
      if (!(r.states & bit)) continue;
      const def = this.rtx.page.dictionary[r.charId]; if (!def) continue;
      let o: DisplayObject;
      if (def.kind === "sprite") { o = new MovieClip(this.rtx, this.rtx.MovieClipProto, def, holder, -1, "", r.charId); (o as MovieClip).frame = 1; (o as MovieClip).applyFrameTags(1, true); }
      else if (def.kind === "edittext") o = new TextFieldObj(this.rtx, this.rtx.TextFieldProto, def, holder, -1, "", r.charId);
      else o = new DisplayObject(this.rtx, null, def, holder, -1, "", r.charId);
      o.m = toM(r.m); if (r.cx) o.cx = r.cx.slice(); (o as any).buttonOwner = this;
      this.stateChildren.push(o);
    }
  }
  localBounds(): Rect | null {
    let r: Rect | null = null;
    for (const rec of this.def.records) if (rec.states & 0x08 || rec.states & 0x01) { const d = this.rtx.page.dictionary[rec.charId]; const b = d?.bounds ?? d?.sb ?? null; r = union(r, xformRect(toM(rec.m), b)); }
    return r;
  }
}

export class TextFieldObj extends DisplayObject {
  html: boolean; textValue: string; htmlValue: string | undefined; variable: string; textColor: number[] | null = null; format: any = {}; border: boolean;
  constructor(rt: Runtime, proto: ASObject | null, def: any, parent: MovieClip | null, depth: number, name: string, charId = -1) {
    super(rt, proto, def, parent, depth, name, charId);
    this.isText = true; this.html = !!def.html; this.variable = def.variable || ""; this.border = !!def.border;
    this.textValue = def.initialText ? (def.html ? stripHtml(def.initialText) : def.initialText) : "";
    if (def.html && def.initialText) this.htmlValue = def.initialText;
  }
  getLocal(name: string, thisObj: any): any {
    switch (this.rt.k(name)) {
      case "text": return this.textValue;
      case "htmltext": return this.htmlValue ?? this.textValue;
      case "length": return this.textValue.length;
      case "variable": return this.variable || null;
      case "html": return this.html;
      case "textcolor": { const c = this.textColor ?? this.def.color ?? [0, 0, 0]; return (c[0] << 16) | (c[1] << 8) | c[2]; }
      case "border": return this.border;
      case "maxscroll": case "scroll": case "bottomscroll": return 1;
      case "hscroll": case "maxhscroll": return 0;
      case "textwidth": return this.textValue.length * ((this.def.fontHeight ?? 240) / 20) * 0.55;
      case "textheight": return (this.def.fontHeight ?? 240) / 20 * 1.2;
    }
    return super.getLocal(name, thisObj);
  }
  setLocalVirtual(name: string, v: any): boolean {
    const k = this.rt.k(name);
    if (k === "text") { this.textValue = this.rt.toStr(v); this.htmlValue = undefined; this.pushToVariable(); return true; }
    if (k === "htmltext") { this.htmlValue = this.rt.toStr(v); this.textValue = stripHtml(this.htmlValue); this.pushToVariable(); return true; }
    if (k === "variable") { this.variable = v == null ? "" : this.rt.toStr(v); return true; }
    if (k === "html") { this.html = this.rt.toBool(v); return true; }
    if (k === "textcolor") { const n = this.rt.toInt(v); this.textColor = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]; return true; }
    if (k === "border") { this.border = this.rt.toBool(v); return true; }
    return super.setLocalVirtual(name, v);
  }
  ctx(): Ctx { return { scope: [this.rt.Global, this.parentClip], target: this.parentClip, origTarget: this.parentClip, thisObj: undefined, regs: [], pool: null, fn: null }; }
  pushToVariable(): void { if (this.variable && this.parentClip) this.rtx.safe(() => this.rt.setVariable(this.ctx(), this.variable, this.textValue)); }
  pullFromVariable(): void {
    if (!this.variable || !this.parentClip) return;
    const v = this.rt.getVariable(this.ctx(), this.variable);
    if (v !== undefined) { const s = this.rt.toStr(v); if (this.html) { this.htmlValue = s; this.textValue = stripHtml(s); } else this.textValue = s; }
  }
}

// ---------------------------------------------------------------- runtime
export interface RuntimeOptions { scripts?: PageScripts | null; bytecode?: Record<string, Uint8Array> | null; host?: (call: HostCall) => void; audio?: AudioSink | null; seed?: number; hitTest?: (o: DisplayObject, x: number, y: number) => boolean }

export class Runtime extends AVM1 {
  page: PageData; scripts: PageScripts | null; bytecode: Record<string, Uint8Array> | null; audio: AudioSink | null; hostCb?: (call: HostCall) => void; hitTestFn?: RuntimeOptions["hitTest"];
  tickCount = 0; instanceCounter = 0; queue: any[] = []; initDone = new Set<any>(); intervals = new Map<number, any>(); intervalId = 0; seed: number;
  hostLog: any[] = []; notes = new Map<string, number>(); missing = { shell: new Map<string, number>(), builtin: new Map<string, number>(), content: new Map<string, number>() };
  errors: string[] = []; frameAdvances = 0; registeredClasses = new Map<string, ASFunction>(); mouseListeners: any[] = []; keyListeners: any[] = []; focus: any = null;
  streamsByTimeline = new Map<number, any>(); mouse = { x: 0, y: 0, down: false }; hover: DisplayObject | null = null; pressed: DisplayObject | null = null; drag: any = null; dropTarget = ""; keysDown = new Set<number>(); lastKey = { code: 0, ascii: 0 };
  shell!: MovieClip; page_!: MovieClip; pendingBegin = false; helpers: any = null; volume = 100;
  MovieClipProto!: ASObject; ButtonProto!: ASObject; TextFieldProto!: ASObject; TextFormatProto!: ASObject; MathObj!: ASObject; KeyObj!: ASObject; MouseObj!: ASObject; SelectionObj!: ASObject; StageObj!: ASObject;
  constructor(page: PageData, opts: RuntimeOptions = {}) {
    super();
    this.page = page; this.version = page.source.swfVersion; this.ci = this.version < 7;
    this.scripts = opts.scripts ?? null; this.bytecode = opts.bytecode ?? null; this.audio = opts.audio ?? null; this.hostCb = opts.host; this.seed = opts.seed ?? 12345; this.hitTestFn = opts.hitTest;
    for (const s of page.streams) this.streamsByTimeline.set(s.timeline, s);
    this.installBuiltins(); this.buildShell();
  }
  random(): number { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x80000000; }
  note(kind: string, detail: string): void { const k = kind + ":" + detail; this.notes.set(k, (this.notes.get(k) || 0) + 1); }
  host(kind: string, args: any[]): void {
    const clean = args.map((a) => (a instanceof ASObject ? (a.isDisplay ? a.targetPath() : "[object]") : a));
    if (this.hostLog.length < 5000) this.hostLog.push([this.tickCount, kind, ...clean]);
    this.hostCb?.({ tick: this.tickCount, kind, args: clean });
  }
  safe<T>(fn: () => T): T | undefined { try { return fn(); } catch (e: any) { this.recordError(e); return undefined; } }
  recordError(e: any): void { if (this.errors.length < 50) this.errors.push(String(e?.stack?.split("\n").slice(0, 3).join(" | ") || e?.message || e)); if (/op budget/.test(e?.message)) throw e; }
  defaultTarget(): any { return this.page_ ?? this.shell; }
  levelRoot(): any { return this.shell; }
  noteMissingCall(obj: any, name: string, _ctx?: Ctx | null): void {
    const lname = String(name).toLowerCase();
    if (obj === this.shell) { this.missing.shell.set(name, (this.missing.shell.get(name) || 0) + 1); return; }
    if (obj === undefined || obj === null) return;
    const builtinish = typeof obj !== "object" || obj.isDisplay || obj instanceof ASArray || obj === this.MathObj;
    if (KNOWN_API.has(lname) && builtinish) this.missing.builtin.set(name, (this.missing.builtin.get(name) || 0) + 1);
    else this.missing.content.set(name, (this.missing.content.get(name) || 0) + 1);
  }
  classForChar(charId: number): ASFunction | null {
    for (const [name, id] of Object.entries(this.page.exports)) if (id === charId && this.registeredClasses.has(name.toLowerCase())) return this.registeredClasses.get(name.toLowerCase())!;
    return null;
  }

  // ---- script execution (compiled TypeScript, or the reference interpreter)
  timelineCtx(clip: any): Ctx { return { scope: [this.Global, "TARGET"], target: clip, origTarget: clip, thisObj: undefined, regs: [undefined, undefined, undefined, undefined], pool: null, fn: null }; }
  runScript(clip: any, name: string): void {
    const ctx = this.timelineCtx(clip);
    const compiled = this.scripts?.[name];
    if (compiled) { compiled(this.helpers.scope(ctx), this.helpers.wrap(clip)); return; }
    const bc = this.bytecode?.[name];
    if (bc) { this.exec(bc, ctx, this.version); return; }
    this.note("missingScript", name);
  }
  queueScript(clip: any, name: string): void { this.queue.push({ clip, script: name }); }
  queueEvent(clip: any, ev: string): void { this.queue.push({ clip, ev }); }
  runQueue(): void {
    let guard = 0;
    while (this.queue.length) {
      if (++guard > 20000) { this.recordError(new Error("action queue runaway")); this.queue.length = 0; break; }
      const item = this.queue.shift();
      if (item.clip.removed) continue;
      if (item.script) this.safe(() => this.runScript(item.clip, item.script));
      else this.fireEvent(item.clip, item.ev);
    }
  }
  runInit(clip: any, t: any): void { if (this.initDone.has(t)) return; this.initDone.add(t); this.safe(() => this.runScript(clip, t.script)); }
  fireClipActions(clip: any, ev: string): boolean {
    const flag = CLIP_EVENTS[ev]; let fired = false;
    for (const ca of clip.clipActions || []) if (ca.flags & flag) { fired = true; this.safe(() => this.runScript(clip, ca.script)); }
    return fired;
  }
  fireEvent(obj: any, ev: string): boolean {
    if (obj.removed) return false; let fired = false;
    if (obj.isClip || obj.isButton) fired = this.fireClipActions(obj, ev) || fired;
    const h = HANDLER[ev];
    if (h) { const f = obj.get(h); if (f instanceof ASFunction) { fired = true; this.safe(() => this.callFn(f, obj, [])); } }
    return fired;
  }
  unloadTree(o: DisplayObject): void {
    o.removed = true;
    if (o instanceof MovieClip) { if (o.stream && this.audio) this.audio.streamStop(o); this.fireClipActions(o, "unload"); for (const c of o.children.values()) this.unloadTree(c); }
    if (o instanceof ButtonObj) for (const c of o.stateChildren) this.unloadTree(c);
    if (this.hover === o) this.hover = null;
  }
  allObjects(root: DisplayObject = this.shell, out: DisplayObject[] = []): DisplayObject[] {
    if (root.removed) return out; out.push(root);
    if (root instanceof MovieClip) for (const c of root.sortedChildren()) if (c.isClip || c.isButton || c.isText) this.allObjects(c, out);
    return out;
  }
  startSound(id: number, info: any, owner: any): void { const d = this.page.dictionary[id]; if (d?.src) { this.host("sound.event", [id]); this.audio?.playEvent(d.src, info, owner); } }

  tick(): void {
    this.tickCount++; this.timeMs += 1000 / this.page.stage.fps; this.frameAdvances = 0;
    if (this.pendingBegin && this.page_) { this.pendingBegin = false; if (this.page_.labelFrame("begin")) this.page_.gotoLabelCmd("begin", true); else this.page_.playCmd(); this.frameAdvances++; }
    this.shell.advance();
    this.runQueue();
    for (const c of this.allObjects()) if (c.isClip && !c.removed) this.fireEvent(c, "enterFrame");
    this.runQueue();
    for (const [id, iv] of [...this.intervals]) {
      let n = 0;
      while (this.intervals.has(id) && iv.next <= this.timeMs && n++ < 4) {
        iv.next += Math.max(10, iv.period);
        const f = iv.fn instanceof ASFunction ? iv.fn : iv.obj?.get(iv.method);
        if (f instanceof ASFunction) this.safe(() => this.callFn(f, iv.obj ?? undefined, iv.args)); else this.intervals.delete(id);
      }
    }
    this.runQueue();
    for (const c of this.allObjects()) if (c instanceof TextFieldObj) this.safe(() => c.pullFromVariable());
  }

  // ---- the HELP Math 1.0 course-shell adapter
  buildShell(): void {
    const mk = (parent: MovieClip, name: string, depth: number) => { const c = new MovieClip(this, this.MovieClipProto, { kind: "sprite", frameCount: 1, frames: [[]] }, parent, depth, name); c.frame = 1; c.playing = false; parent.children.set(depth, c); return c; };
    this.shell = new MovieClip(this, this.MovieClipProto, { kind: "sprite", frameCount: 1, frames: [[]] }, null, 0, ""); this.shell.frame = 1; this.shell.playing = false;
    SHELL_CLIPS.forEach((n, i) => mk(this.shell, n, 10 + i).visible = false);
    SHELL_TEXT.forEach((n, i) => { const t = new TextFieldObj(this, this.TextFieldProto, { kind: "edittext", initialText: "ON", variable: "" }, this.shell, 40 + i, n); t.asVisible = true; t.visible = false; this.shell.children.set(40 + i, t); });
    for (const n of ["back_mc", "next_mc", "replay_mc", "pause_mc", "play_mc", "nextani", "popup"]) {
      const c = this.shell.childByName(n)!;
      for (const m of ["gotoAndStop", "gotoAndPlay"]) c.define(m, this.nat((self, args) => this.host("shell.nav." + n, [this.toStr(args[0])])), { dontEnum: true });
    }
    this.Global.set("gSound", this.construct(this.Global.get("Sound"), []));
    this.Global.set("volLevel", 100);
    const pre = this.shell.childByName("InternalPreloader")!;
    pre.define("gotoAndPlay", this.nat((self, args) => { this.host("shell.preloader", [this.toStr(args[0])]); if (this.k(this.toStr(args[0])) === "jump_check") this.pendingBegin = true; }), { dontEnum: true });
    for (const fname of SHELL_FUNCTIONS) this.shell.define(fname, this.nat((self, args) => { this.host("shell." + fname, args); return fname === "getBookMark" ? "" : undefined; }), { dontEnum: true });
  }
  /** The 1.0 shell used animation_mc.loadMovie(page): the page root replaces animation_mc. */
  loadPage(): void {
    this.page_ = new MovieClip(this, this.MovieClipProto, this.page.root, this.shell, 1, "animation_mc", 0);
    this.shell.children.set(1, this.page_);
    this.page_.frame = 1; this.page_.applyFrameTags(1, true);
    this.queueEvent(this.page_, "load");
    this.runQueue();
  }

  // ---- input (stage pixels)
  topClickableAt(x: number, y: number): DisplayObject | null {
    if (!this.hitTestFn) return null;
    const list = this.allObjects().filter((o) => this.isClickable(o));
    for (let i = list.length - 1; i >= 0; i--) if (this.hitTestFn(list[i], x, y)) return list[i];
    return null;
  }
  isClickable(o: DisplayObject): boolean {
    if (o === this.shell || o.removed || !o.ancestorsVisible() || o.get("enabled") === false) return false;
    if (o instanceof ButtonObj) return (o.def.conds || []).length > 0 || ["onRelease", "onPress", "onRollOver"].some((h) => o.get(h) instanceof ASFunction);
    if (o instanceof MovieClip) return (o.clipActions || []).some((ca: any) => ca.flags & (CLIP_EVENTS.press | CLIP_EVENTS.release | CLIP_EVENTS.rollOver)) || ["onRelease", "onPress", "onRollOver"].some((h) => o.get(h) instanceof ASFunction);
    return false;
  }
  buttonConds(o: any, bits: number): void { if (!(o instanceof ButtonObj)) return; for (const c of o.def.conds || []) if (c.b0 & bits) this.safe(() => this.runScript(o.parentClip, c.script)); }
  buttonSound(o: any, idx: number): void { const s = o?.def?.sounds?.[idx]; if (s) this.startSound(s.id, s.info, o); }
  pointerMove(x: number, y: number): void {
    this.mouse.x = x; this.mouse.y = y;
    if (this.drag) this.updateDrag();
    for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "mouseMove");
    this.broadcast(this.mouseListeners, "onMouseMove");
    const top = this.pressed && this.mouse.down ? this.pressed : this.topClickableAt(x, y);
    if (!this.mouse.down) {
      if (top !== this.hover) {
        if (this.hover) { this.buttonConds(this.hover, 0x02); this.fireEvent(this.hover, "rollOut"); if (this.hover instanceof ButtonObj) this.hover.setState("up"); this.buttonSound(this.hover, 0); }
        this.hover = top;
        if (top) { this.buttonConds(top, 0x01); this.fireEvent(top, "rollOver"); if (top instanceof ButtonObj) top.setState("over"); this.buttonSound(top, 1); }
      }
    }
    this.runQueue();
  }
  pointerDown(): void {
    this.mouse.down = true;
    for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "mouseDown");
    this.broadcast(this.mouseListeners, "onMouseDown");
    const o = this.topClickableAt(this.mouse.x, this.mouse.y); this.pressed = o;
    if (o) { this.buttonConds(o, 0x04); this.fireEvent(o, "press"); if (o instanceof ButtonObj) o.setState("down"); this.buttonSound(o, 2); this.focus = o; }
    this.runQueue();
  }
  pointerUp(): void {
    this.mouse.down = false;
    for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "mouseUp");
    this.broadcast(this.mouseListeners, "onMouseUp");
    const o = this.pressed; this.pressed = null;
    if (o && !o.removed) {
      const inside = this.hitTestFn ? this.hitTestFn(o, this.mouse.x, this.mouse.y) : true;
      if (inside) { this.buttonConds(o, 0x08); this.fireEvent(o, "release"); if (o instanceof ButtonObj) o.setState("over"); this.buttonSound(o, 3); }
      else { this.buttonConds(o, 0x40); this.fireEvent(o, "releaseOutside"); if (o instanceof ButtonObj) o.setState("up"); }
    }
    this.runQueue();
  }
  keyDown(code: number, ascii: number): void { this.keysDown.add(code); this.lastKey = { code, ascii }; for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "keyDown"); this.broadcast(this.keyListeners, "onKeyDown"); this.runQueue(); }
  keyUp(code: number): void { this.keysDown.delete(code); for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "keyUp"); this.broadcast(this.keyListeners, "onKeyUp"); this.runQueue(); }
  broadcast(list: any[], method: string): void { for (const l of list) { const f = l?.get?.(method); if (f instanceof ASFunction) this.safe(() => this.callFn(f, l, [])); } }
  startDragTarget(t: any, lock: boolean, rect: number[] | null): void {
    if (!t?.isDisplay) return; this.host("startDrag", [t]);
    const pm = t.parentClip ? t.parentClip.worldMatrix() : { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    const [lx, ly] = apply(invert(pm), this.mouse.x * 20, this.mouse.y * 20);
    this.drag = { clip: t, lock, rect, dx: lock ? 0 : t.m.tx - lx, dy: lock ? 0 : t.m.ty - ly };
  }
  updateDrag(): void {
    const { clip, rect, dx, dy } = this.drag; if (clip.removed) { this.drag = null; return; }
    const pm = clip.parentClip ? clip.parentClip.worldMatrix() : { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    let [lx, ly] = apply(invert(pm), this.mouse.x * 20, this.mouse.y * 20); lx += dx; ly += dy;
    if (rect) { lx = Math.max(rect[0] * 20, Math.min(rect[2] * 20, lx)); ly = Math.max(rect[1] * 20, Math.min(rect[3] * 20, ly)); }
    clip.m.tx = lx; clip.m.ty = ly; clip.scriptMoved = true;
  }
  stopDragAll(): void {
    if (this.drag) { const d = this.drag.clip; this.drag = null; let target = ""; if (this.hitTestFn) { const list = this.allObjects().filter((o) => o.isClip && o !== d && o !== this.shell && !this.isAncestor(d, o)); for (let i = list.length - 1; i >= 0; i--) if (list[i].ancestorsVisible() && this.hitTestFn(list[i], this.mouse.x, this.mouse.y)) { target = list[i].slashPath(); break; } } this.dropTarget = target; }
    this.host("stopDrag", []);
  }
  isAncestor(a: any, b: any): boolean { let o = b; while (o) { if (o === a) return true; o = o.parentClip; } return false; }

  // ---- headless exploration (used by the differential verifier)
  clickables(): DisplayObject[] { return this.allObjects().filter((o) => this.isClickable(o)); }
  click(o: any): void {
    const conds = (bits: number) => this.buttonConds(o, bits);
    conds(0x01); this.fireEvent(o, "rollOver"); this.runQueue();
    for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "mouseDown");
    this.broadcast(this.mouseListeners, "onMouseDown");
    conds(0x04); this.fireEvent(o, "press"); this.runQueue();
    for (const c of this.allObjects()) if (c.isClip) this.fireClipActions(c, "mouseUp");
    this.broadcast(this.mouseListeners, "onMouseUp");
    conds(0x08); this.fireEvent(o, "release"); this.runQueue();
    conds(0x02); this.fireEvent(o, "rollOut"); this.runQueue();
  }

  // ---- built-ins
  nat(fn: (this: AVM1, self: any, args: any[], f: ASFunction) => any, ctor?: (this: AVM1, args: any[], fn: ASFunction) => any): ASFunction { const f = new ASFunction(this, { name: "", params: [], native: fn }); if (ctor) f.ctor = ctor; return f; }
  installBuiltins(): void {
    const rt = this;
    this.ObjectProto = new ASObject(this, null); this.FunctionProto = new ASObject(this, this.ObjectProto);
    const G = this.Global = new ASObject(this, this.ObjectProto);
    const def = (o: ASObject, name: string, fn: (self: any, a: any[]) => any) => o.define(name, this.nat((self, a) => fn(self, a)), { dontEnum: true });
    const cls = (name: string, ctorFn?: (self: any, a: any[]) => any, protoParent: ASObject | null = this.ObjectProto, construct?: (a: any[]) => any): [ASFunction, ASObject] => {
      const f = this.nat((self, a) => (ctorFn ? ctorFn(self, a) : undefined), construct ? (a) => construct(a) : undefined);
      const proto = f.get("prototype"); proto.proto = protoParent; G.define(name, f, { dontEnum: true }); return [f, proto];
    };
    const [ObjectCtor] = cls("Object", (self, a) => (a[0] instanceof ASObject ? a[0] : new ASObject(rt, rt.ObjectProto)), null, (a) => (a[0] instanceof ASObject ? a[0] : new ASObject(rt, rt.ObjectProto)));
    ObjectCtor.define("prototype", this.ObjectProto, { dontEnum: true }); this.ObjectProto.define("constructor", ObjectCtor, { dontEnum: true });
    def(this.ObjectProto, "toString", (self) => (self instanceof ASObject ? self.toStringDefault() : rt.toStr(self)));
    def(this.ObjectProto, "valueOf", (self) => self);
    def(this.ObjectProto, "hasOwnProperty", (self, a) => self instanceof ASObject && self.hasOwn(rt.toStr(a[0])));
    def(this.ObjectProto, "isPropertyEnumerable", (self, a) => { const e = self?.props?.get(rt.k(a[0])); return !!e && !e.dontEnum; });
    def(this.ObjectProto, "isPrototypeOf", (self, a) => { let p = a[0]?.getProto?.(); while (p) { if (p === self) return true; p = p.getProto(); } return false; });
    def(this.ObjectProto, "addProperty", (self, a) => { if (!(self instanceof ASObject) || !(a[1] instanceof ASFunction)) return false; self.props.set(rt.k(a[0]), { n: rt.toStr(a[0]), getter: a[1], setter: a[2] instanceof ASFunction ? a[2] : null }); return true; });
    def(this.ObjectProto, "watch", (self, a) => { if (!(self instanceof ASObject) || !(a[1] instanceof ASFunction)) return false; (self.watchers ??= new Map()).set(rt.k(a[0]), { cb: a[1], data: a[2] }); return true; });
    def(this.ObjectProto, "unwatch", (self, a) => { self?.watchers?.delete(rt.k(a[0])); return true; });
    def(ObjectCtor, "registerClass", (self, a) => { const n = rt.toStr(a[0]).toLowerCase(); if (a[1] instanceof ASFunction) rt.registeredClasses.set(n, a[1]); else rt.registeredClasses.delete(n); return true; });
    const [FunctionCtor] = cls("Function"); FunctionCtor.define("prototype", this.FunctionProto, { dontEnum: true });
    def(this.FunctionProto, "call", (self, a) => rt.callFn(self, a[0] ?? undefined, a.slice(1)));
    def(this.FunctionProto, "apply", (self, a) => rt.callFn(self, a[0] ?? undefined, a[1] instanceof ASArray ? a[1].a.slice() : []));
    // Array
    const mkArray = (a: any[]) => (a.length === 1 && typeof a[0] === "number" ? new ASArray(rt, new Array(Math.max(0, a[0] | 0)).fill(undefined)) : new ASArray(rt, a.slice()));
    const [ArrayCtor, AP] = cls("Array", (self, a) => mkArray(a), this.ObjectProto, (a) => mkArray(a)); this.ArrayProto = AP;
    const arr = (self: any): any[] => (self instanceof ASArray ? self.a : []);
    def(AP, "push", (self, a) => { arr(self).push(...a); return arr(self).length; });
    def(AP, "pop", (self) => arr(self).pop());
    def(AP, "shift", (self) => arr(self).shift());
    def(AP, "unshift", (self, a) => arr(self).unshift(...a));
    def(AP, "splice", (self, a) => { const x = arr(self); let s = rt.toInt(a[0]); if (s < 0) s = Math.max(0, x.length + s); const n = a.length > 1 ? Math.max(0, rt.toInt(a[1])) : x.length - s; return new ASArray(rt, x.splice(s, n, ...a.slice(2))); });
    def(AP, "slice", (self, a) => new ASArray(rt, arr(self).slice(a[0] === undefined ? 0 : rt.toInt(a[0]), a[1] === undefined ? undefined : rt.toInt(a[1]))));
    def(AP, "join", (self, a) => arr(self).map((v) => (v === undefined ? "" : v === null ? "null" : rt.toStr(v))).join(a[0] === undefined ? "," : rt.toStr(a[0])));
    def(AP, "toString", (self) => (self instanceof ASArray ? self.toStringDefault() : ""));
    def(AP, "concat", (self, a) => { const out = arr(self).slice(); for (const v of a) { if (v instanceof ASArray) out.push(...v.a); else out.push(v); } return new ASArray(rt, out); });
    def(AP, "reverse", (self) => { arr(self).reverse(); return self; });
    const sorter = (flags: number, cmp: any) => (x: any, y: any) => { let r: number; if (cmp instanceof ASFunction) r = rt.toNum(rt.callFn(cmp, undefined, [x, y])); else if (flags & 16) r = rt.toNum(x) - rt.toNum(y); else { let sx = rt.toStr(x), sy = rt.toStr(y); if (flags & 1) { sx = sx.toLowerCase(); sy = sy.toLowerCase(); } r = sx < sy ? -1 : sx > sy ? 1 : 0; } return flags & 2 ? -r : r; };
    def(AP, "sort", (self, a) => { const cmp = a[0] instanceof ASFunction ? a[0] : null; const flags = cmp ? rt.toInt(a[1]) : rt.toInt(a[0]); arr(self).sort(sorter(flags, cmp)); return self; });
    def(AP, "sortOn", (self, a) => { const f = rt.toStr(a[0]); const s = sorter(rt.toInt(a[1]), null); arr(self).sort((x, y) => s(rt.getMember(x, f), rt.getMember(y, f))); return self; });
    ArrayCtor.define("CASEINSENSITIVE", 1).define("DESCENDING", 2).define("UNIQUESORT", 4).define("RETURNINDEXEDARRAY", 8).define("NUMERIC", 16);
    // String / Number / Boolean
    const [StringCtor, SP] = cls("String", (self, a) => (a.length ? rt.toStr(a[0]) : "")); this.StringProto = SP;
    const str = (self: any) => (self instanceof ASObject ? rt.toStr(self.get("__value") ?? "") : rt.toStr(self));
    def(StringCtor, "fromCharCode", (self, a) => String.fromCharCode(...a.map((x) => rt.toInt(x))));
    def(SP, "toString", (self) => str(self)); def(SP, "valueOf", (self) => str(self));
    def(SP, "charAt", (self, a) => str(self).charAt(rt.toInt(a[0])));
    def(SP, "charCodeAt", (self, a) => str(self).charCodeAt(rt.toInt(a[0])));
    def(SP, "indexOf", (self, a) => str(self).indexOf(rt.toStr(a[0]), a[1] === undefined ? 0 : rt.toInt(a[1])));
    def(SP, "lastIndexOf", (self, a) => str(self).lastIndexOf(rt.toStr(a[0]), a[1] === undefined ? Infinity : rt.toInt(a[1])));
    def(SP, "substr", (self, a) => { const s = str(self); let st = rt.toInt(a[0]); if (st < 0) st = Math.max(0, s.length + st); return a[1] === undefined ? s.substr(st) : s.substr(st, Math.max(0, rt.toInt(a[1]))); });
    def(SP, "substring", (self, a) => { const s = str(self); let st = Math.max(0, rt.toInt(a[0])), en = a[1] === undefined ? s.length : Math.max(0, rt.toInt(a[1])); if (st > en) [st, en] = [en, st]; return s.substring(st, en); });
    def(SP, "slice", (self, a) => str(self).slice(rt.toInt(a[0]), a[1] === undefined ? undefined : rt.toInt(a[1])));
    def(SP, "split", (self, a) => { const s = str(self); if (a[0] === undefined) return new ASArray(rt, [s]); const parts = s.split(rt.toStr(a[0])); return new ASArray(rt, a[1] === undefined ? parts : parts.slice(0, rt.toInt(a[1]))); });
    def(SP, "toUpperCase", (self) => str(self).toUpperCase());
    def(SP, "toLowerCase", (self) => str(self).toLowerCase());
    def(SP, "concat", (self, a) => str(self) + a.map((x) => rt.toStr(x)).join(""));
    const [NumberCtor, NP] = cls("Number", (self, a) => (a.length ? rt.toNum(a[0]) : 0)); this.NumberProto = NP;
    def(NP, "toString", (self, a) => { const n = rt.toNum(self); const r = a[0] === undefined ? 10 : rt.toInt(a[0]); return r === 10 ? rt.numStr(n) : n.toString(r); });
    def(NP, "valueOf", (self) => rt.toNum(self));
    NumberCtor.define("MAX_VALUE", Number.MAX_VALUE).define("MIN_VALUE", Number.MIN_VALUE).define("NaN", NaN).define("POSITIVE_INFINITY", Infinity).define("NEGATIVE_INFINITY", -Infinity);
    const [, BP] = cls("Boolean", (self, a) => rt.toBool(a[0])); this.BooleanProto = BP;
    def(BP, "toString", (self) => rt.toStr(rt.toBool(self))); def(BP, "valueOf", (self) => rt.toBool(self));
    // Math
    const M = this.MathObj = new ASObject(this, this.ObjectProto); G.define("Math", M, { dontEnum: true });
    for (const n of ["abs", "acos", "asin", "atan", "ceil", "cos", "exp", "floor", "log", "sin", "sqrt", "tan"]) def(M, n, (self, a) => (Math as any)[n](rt.toNum(a[0])));
    def(M, "atan2", (self, a) => Math.atan2(rt.toNum(a[0]), rt.toNum(a[1])));
    def(M, "pow", (self, a) => Math.pow(rt.toNum(a[0]), rt.toNum(a[1])));
    def(M, "max", (self, a) => (a.length ? Math.max(...a.map((x) => rt.toNum(x))) : -Infinity));
    def(M, "min", (self, a) => (a.length ? Math.min(...a.map((x) => rt.toNum(x))) : Infinity));
    def(M, "round", (self, a) => Math.floor(rt.toNum(a[0]) + 0.5));
    def(M, "random", () => rt.random());
    for (const n of ["PI", "E", "LN2", "LN10", "LOG2E", "LOG10E", "SQRT1_2", "SQRT2"]) M.define(n, (Math as any)[n]);
    // Date (deterministic clock)
    const [, DP] = cls("Date", undefined, this.ObjectProto, (a) => { const o: any = new ASObject(rt, DP); o.t = a.length ? new Date(rt.toNum(a[0])) : new Date(Date.UTC(2007, 0, 15, 9, 0, 0) + rt.timeMs); return o; });
    for (const n of ["getTime", "getHours", "getMinutes", "getSeconds", "getMilliseconds", "getDate", "getDay", "getMonth", "getFullYear", "getTimezoneOffset"]) def(DP, n, (self) => (self?.t ? self.t[n]() : NaN));
    def(DP, "getYear", (self) => (self?.t ? self.t.getFullYear() - 1900 : NaN));
    def(DP, "toString", (self) => (self?.t ? self.t.toString() : ""));
    def(DP, "setTime", (self, a) => { if (self) self.t = new Date(rt.toNum(a[0])); });
    // Globals
    def(G, "trace", (self, a) => rt.host("trace", [rt.toStr(a[0])]));
    def(G, "parseInt", (self, a) => { const s = rt.toStr(a[0]).trim(); const r = a[1] === undefined ? (/^0x/i.test(s) ? 16 : 10) : rt.toInt(a[1]); return parseInt(s, r); });
    def(G, "parseFloat", (self, a) => parseFloat(rt.toStr(a[0])));
    def(G, "isNaN", (self, a) => Number.isNaN(rt.toNum(a[0])));
    def(G, "isFinite", (self, a) => Number.isFinite(rt.toNum(a[0])));
    def(G, "escape", (self, a) => escape(rt.toStr(a[0])));
    def(G, "unescape", (self, a) => unescape(rt.toStr(a[0])));
    def(G, "getTimer", () => Math.floor(rt.timeMs));
    def(G, "getVersion", () => "WIN 7,0,19,0");
    def(G, "updateAfterEvent", () => undefined);
    def(G, "targetPath", (self, a) => (a[0]?.isDisplay ? a[0].targetPath() : undefined));
    def(G, "setInterval", (self, a) => {
      const id = ++rt.intervalId;
      if (a[0] instanceof ASFunction) rt.intervals.set(id, { fn: a[0], period: rt.toNum(a[1]), args: a.slice(2), next: rt.timeMs + Math.max(10, rt.toNum(a[1])) });
      else if (a[0] instanceof ASObject) rt.intervals.set(id, { obj: a[0], method: rt.toStr(a[1]), period: rt.toNum(a[2]), args: a.slice(3), next: rt.timeMs + Math.max(10, rt.toNum(a[2])) });
      else return undefined;
      return id;
    });
    def(G, "clearInterval", (self, a) => { rt.intervals.delete(rt.toInt(a[0])); });
    def(G, "ASSetPropFlags", (self, a) => {
      const o = a[0]; if (!(o instanceof ASObject)) return;
      const set = rt.toInt(a[2]), clear = rt.toInt(a[3]);
      let names: string[] | null = null; if (a[1] instanceof ASArray) names = a[1].a.map((x: any) => rt.k(rt.toStr(x))); else if (a[1] !== null && a[1] !== undefined) names = rt.toStr(a[1]).split(",").map((x) => rt.k(x));
      for (const [key, e] of o.props) if (!names || names.includes(key)) { const f = (((e.dontEnum ? 1 : 0) | (e.perm ? 2 : 0) | (e.ro ? 4 : 0)) & ~clear) | set; e.dontEnum = !!(f & 1); e.perm = !!(f & 2); e.ro = !!(f & 4); }
    });
    def(G, "ASnative", () => rt.nat(() => undefined));
    // MovieClip
    const [, MCP] = cls("MovieClip"); this.MovieClipProto = MCP;
    MCP.define("enabled", true).define("useHandCursor", true).define("focusEnabled", false, { dontEnum: true });
    const clip = (self: any): MovieClip | null => (self instanceof MovieClip ? self : null);
    const isLabel = (v: any) => typeof v === "string" && !/^\d+$/.test(v);
    def(MCP, "play", (self) => clip(self)?.playCmd());
    def(MCP, "stop", (self) => clip(self)?.stopCmd());
    def(MCP, "gotoAndPlay", (self, a) => { const c = clip(self); if (!c) return; isLabel(a[0]) ? c.gotoLabelCmd(a[0], true) : c.gotoCmd(rt.toInt(a[0]), true); });
    def(MCP, "gotoAndStop", (self, a) => { const c = clip(self); if (!c) return; isLabel(a[0]) ? c.gotoLabelCmd(a[0], false) : c.gotoCmd(rt.toInt(a[0]), false); });
    def(MCP, "nextFrame", (self) => clip(self)?.nextFrameCmd());
    def(MCP, "prevFrame", (self) => clip(self)?.prevFrameCmd());
    def(MCP, "attachMovie", (self, a) => {
      const c = clip(self); if (!c) return undefined;
      const want = rt.toStr(a[0]).toLowerCase(); const entry = Object.entries(rt.page.exports).find(([n]) => n.toLowerCase() === want);
      if (!entry) { rt.note("attachMovieMissingLinkage", rt.toStr(a[0])); return undefined; }
      const d = rt.toInt(a[2]) + DYNAMIC_DEPTH; if (c.children.has(d)) c.removeAtDepth(d);
      return c.instantiate(entry[1] as number, d, rt.toStr(a[1]), null, { init: a[3] }) ?? undefined;
    });
    def(MCP, "createEmptyMovieClip", (self, a) => { const c = clip(self); if (!c) return undefined; const d = rt.toInt(a[1]) + DYNAMIC_DEPTH; if (c.children.has(d)) c.removeAtDepth(d); const o = new MovieClip(rt, rt.MovieClipProto, { kind: "sprite", frameCount: 1, frames: [[]] }, c, d, rt.toStr(a[0])); o.frame = 1; c.children.set(d, o); return o; });
    def(MCP, "createTextField", (self, a) => {
      const c = clip(self); if (!c) return undefined; const d = rt.toInt(a[1]) + DYNAMIC_DEPTH; if (c.children.has(d)) c.removeAtDepth(d);
      const w = rt.toNum(a[4]) * 20, h = rt.toNum(a[5]) * 20;
      const o = new TextFieldObj(rt, rt.TextFieldProto, { kind: "edittext", bounds: { xmin: 0, ymin: 0, xmax: w, ymax: h }, variable: "", fontHeight: 240 }, c, d, rt.toStr(a[0]));
      o.asVisible = true; o.m.tx = rt.toNum(a[2]) * 20; o.m.ty = rt.toNum(a[3]) * 20; c.children.set(d, o); return o;
    });
    def(MCP, "duplicateMovieClip", (self, a) => clip(self)?.duplicate(rt.toStr(a[0]), rt.toInt(a[1]), a[2]));
    def(MCP, "removeMovieClip", (self) => { const c = clip(self); if (c && c.parentClip && c.depth >= DYNAMIC_DEPTH) c.parentClip.removeAtDepth(c.depth); });
    def(MCP, "swapDepths", (self, a) => {
      const c = self?.isDisplay ? self : null; if (!c || !c.parentClip) return; const p = c.parentClip;
      let d: number; if (a[0]?.isDisplay) { if (a[0].parentClip !== p) return; d = a[0].depth; } else d = rt.toInt(a[0]) + DYNAMIC_DEPTH;
      const other = p.children.get(d); p.children.delete(c.depth); if (other) { other.depth = c.depth; p.children.set(c.depth, other); }
      c.depth = d; p.children.set(d, c);
    });
    def(MCP, "getDepth", (self) => (self?.isDisplay ? self.depth - DYNAMIC_DEPTH : undefined));
    def(MCP, "getNextHighestDepth", (self) => { const c = clip(self); if (!c) return 0; let m = -1; for (const d of c.children.keys()) m = Math.max(m, d - DYNAMIC_DEPTH); return Math.max(0, m + 1); });
    def(MCP, "getInstanceAtDepth", (self, a) => clip(self)?.children.get(rt.toInt(a[0]) + DYNAMIC_DEPTH));
    def(MCP, "getBytesLoaded", () => 1000); def(MCP, "getBytesTotal", () => 1000);
    def(MCP, "getSWFVersion", () => rt.version);
    def(MCP, "hitTest", (self, a) => {
      if (!self?.isDisplay) return false;
      if (a.length >= 2 && typeof a[0] !== "object") {
        const x = rt.toNum(a[0]), y = rt.toNum(a[1]);
        if (rt.toBool(a[2]) && rt.hitTestFn) return rt.hitTestFn(self, x, y);
        const b = xformRect(self.parentClip ? self.parentClip.worldMatrix() : ID(), self.bounds()); return !!b && x * 20 >= b.xmin && x * 20 <= b.xmax && y * 20 >= b.ymin && y * 20 <= b.ymax;
      }
      const o = a[0]; if (!o?.isDisplay) return false;
      const b1 = xformRect(self.parentClip ? self.parentClip.worldMatrix() : ID(), self.bounds()), b2 = xformRect(o.parentClip ? o.parentClip.worldMatrix() : ID(), o.bounds());
      return !!b1 && !!b2 && b1.xmin <= b2.xmax && b2.xmin <= b1.xmax && b1.ymin <= b2.ymax && b2.ymin <= b1.ymax;
    });
    def(MCP, "getBounds", (self, a) => {
      const o = new ASObject(rt, rt.ObjectProto); if (!self?.isDisplay) return o;
      let b = xformRect(self.worldMatrix(), self.localBounds());
      if (a[0]?.isDisplay) b = xformRect(invert(a[0].worldMatrix()), b);
      o.set("xMin", b ? b.xmin / 20 : 0); o.set("xMax", b ? b.xmax / 20 : 0); o.set("yMin", b ? b.ymin / 20 : 0); o.set("yMax", b ? b.ymax / 20 : 0); return o;
    });
    def(MCP, "localToGlobal", (self, a) => { const p = a[0]; if (!(p instanceof ASObject) || !self?.isDisplay) return; const [x, y] = apply(self.worldMatrix(), rt.toNum(p.get("x")) * 20, rt.toNum(p.get("y")) * 20); p.set("x", x / 20); p.set("y", y / 20); });
    def(MCP, "globalToLocal", (self, a) => { const p = a[0]; if (!(p instanceof ASObject) || !self?.isDisplay) return; const [x, y] = apply(invert(self.worldMatrix()), rt.toNum(p.get("x")) * 20, rt.toNum(p.get("y")) * 20); p.set("x", x / 20); p.set("y", y / 20); });
    def(MCP, "startDrag", (self, a) => rt.startDragTarget(self, rt.toBool(a[0]), a.length >= 5 ? a.slice(1, 5).map((v) => rt.toNum(v)) : null));
    def(MCP, "stopDrag", () => rt.stopDragAll());
    def(MCP, "setMask", (self, a) => { if (self instanceof MovieClip) self.mask = a[0]?.isDisplay ? a[0] : null; });
    const g = (name: string, cmd: string) => def(MCP, name, (self, a) => { const c = clip(self); if (!c) return; if (cmd === "clear") c.graphics = []; else c.graphics.push([cmd, ...a.map((v) => (v instanceof ASObject ? v : rt.toNum(v)))]); });
    g("lineStyle", "ls"); g("moveTo", "mt"); g("lineTo", "lt"); g("curveTo", "ct"); g("beginFill", "bf"); g("endFill", "ef"); g("clear", "clear");
    def(MCP, "beginGradientFill", (self) => { const c = clip(self); if (c) c.graphics.push(["bf", 0x999999, 100]); });
    def(MCP, "loadMovie", (self, a) => rt.host("loadMovie", [rt.toStr(a[0])]));
    def(MCP, "unloadMovie", (self) => rt.host("unloadMovie", [self]));
    def(MCP, "loadVariables", (self, a) => rt.host("loadVariables", [rt.toStr(a[0])]));
    def(MCP, "getURL", (self, a) => rt.host("getURL", [rt.toStr(a[0])]));
    def(MCP, "attachAudio", () => undefined);
    const [, BTP] = cls("Button"); this.ButtonProto = BTP;
    BTP.define("enabled", true).define("useHandCursor", true);
    def(BTP, "getDepth", (self) => (self?.isDisplay ? self.depth - DYNAMIC_DEPTH : undefined));
    // TextField / TextFormat
    const [, TFP] = cls("TextField"); this.TextFieldProto = TFP;
    def(TFP, "setTextFormat", (self, a) => { const f = a.find((x) => x instanceof ASObject); if (self instanceof TextFieldObj && f) { const col = f.get("color"); if (col !== undefined && col !== null) self.setLocalVirtual("textColor", col); for (const k of ["size", "bold", "italic", "align", "font"]) { const v = f.get(k); if (v !== undefined && v !== null) self.format[k] = v; } } });
    def(TFP, "setNewTextFormat", (self, a) => (TFP.get("setTextFormat") as ASFunction).native!.call(rt, self, a, null as any));
    for (const n of ["replaceSel", "addListener", "removeListener", "replaceText"]) def(TFP, n, () => undefined);
    def(TFP, "getTextFormat", () => new ASObject(rt, rt.TextFormatProto));
    def(TFP, "getNewTextFormat", () => new ASObject(rt, rt.TextFormatProto));
    def(TFP, "getDepth", (self) => (self?.isDisplay ? self.depth - DYNAMIC_DEPTH : undefined));
    def(TFP, "removeTextField", (self) => { if (self?.parentClip) self.parentClip.removeAtDepth(self.depth); });
    const [, TFMT] = cls("TextFormat", (self, a) => { if (self instanceof ASObject) ["font", "size", "color", "bold", "italic", "underline", "url", "target", "align", "leftMargin", "rightMargin", "indent", "leading"].forEach((n, i) => self.set(n, a[i] === undefined ? null : a[i])); });
    this.TextFormatProto = TFMT;
    def(TFMT, "getTextExtent", (self, a) => { const o = new ASObject(rt, rt.ObjectProto); const s = rt.toStr(a[0]); o.set("width", s.length * 7); o.set("height", 14); o.set("textFieldWidth", s.length * 7 + 4); o.set("textFieldHeight", 18); return o; });
    // Color (drives the colour transform)
    const [, CP] = cls("Color", (self, a) => { if (self instanceof ASObject) self.define("__target", a[0], { dontEnum: true }); });
    def(CP, "setRGB", (self, a) => { const t = self?.get?.("__target"); if (t?.isDisplay) { const n = rt.toInt(a[0]); t.cx = [0, 0, 0, t.cx[3], (n >> 16) & 255, (n >> 8) & 255, n & 255, t.cx[7]]; } });
    def(CP, "getRGB", (self) => { const t = self?.get?.("__target"); return t?.isDisplay ? (t.cx[4] << 16) | (t.cx[5] << 8) | t.cx[6] : 0; });
    def(CP, "setTransform", (self, a) => { const t = self?.get?.("__target"); const o = a[0]; if (!t?.isDisplay || !(o instanceof ASObject)) return; const gv = (k: string, d: number) => { const v = o.get(k); return v === undefined ? d : rt.toNum(v); }; t.cx = [gv("ra", (t.cx[0] / 256) * 100) * 2.56, gv("ga", (t.cx[1] / 256) * 100) * 2.56, gv("ba", (t.cx[2] / 256) * 100) * 2.56, gv("aa", (t.cx[3] / 256) * 100) * 2.56, gv("rb", t.cx[4]), gv("gb", t.cx[5]), gv("bb", t.cx[6]), gv("ab", t.cx[7])]; });
    def(CP, "getTransform", (self) => { const t = self?.get?.("__target"); const o = new ASObject(rt, rt.ObjectProto); const c = t?.isDisplay ? t.cx : [256, 256, 256, 256, 0, 0, 0, 0]; ["ra", "ga", "ba", "aa"].forEach((k, i) => o.set(k, (c[i] / 256) * 100)); ["rb", "gb", "bb", "ab"].forEach((k, i) => o.set(k, c[i + 4])); return o; });
    // Key / Mouse / Selection / Stage / System
    const K = this.KeyObj = new ASObject(this, this.ObjectProto); G.define("Key", K, { dontEnum: true });
    Object.entries({ BACKSPACE: 8, TAB: 9, ENTER: 13, SHIFT: 16, CONTROL: 17, CAPSLOCK: 20, ESCAPE: 27, SPACE: 32, PGUP: 33, PGDN: 34, END: 35, HOME: 36, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETEKEY: 46 }).forEach(([n, v]) => K.define(n, v));
    def(K, "isDown", (self, a) => rt.keysDown.has(rt.toInt(a[0]))); def(K, "isToggled", () => false); def(K, "getCode", () => rt.lastKey.code); def(K, "getAscii", () => rt.lastKey.ascii);
    def(K, "addListener", (self, a) => { if (!rt.keyListeners.includes(a[0])) rt.keyListeners.push(a[0]); return true; });
    def(K, "removeListener", (self, a) => { rt.keyListeners = rt.keyListeners.filter((x) => x !== a[0]); return true; });
    const Mo = this.MouseObj = new ASObject(this, this.ObjectProto); G.define("Mouse", Mo, { dontEnum: true });
    def(Mo, "show", () => 1); def(Mo, "hide", () => 1);
    def(Mo, "addListener", (self, a) => { if (!rt.mouseListeners.includes(a[0])) rt.mouseListeners.push(a[0]); return true; });
    def(Mo, "removeListener", (self, a) => { rt.mouseListeners = rt.mouseListeners.filter((x) => x !== a[0]); return true; });
    const S = this.SelectionObj = new ASObject(this, this.ObjectProto); G.define("Selection", S, { dontEnum: true });
    def(S, "setFocus", (self, a) => { rt.focus = a[0] instanceof ASObject ? a[0] : typeof a[0] === "string" ? rt.resolvePath(rt.timelineCtx(rt.page_ ?? rt.shell), a[0]) : null; return true; });
    def(S, "getFocus", () => (rt.focus?.isDisplay ? rt.focus.targetPath() : null));
    for (const n of ["addListener", "removeListener", "setSelection"]) def(S, n, () => true);
    for (const n of ["getBeginIndex", "getEndIndex", "getCaretIndex"]) def(S, n, () => -1);
    const St = this.StageObj = new ASObject(this, this.ObjectProto); G.define("Stage", St, { dontEnum: true });
    St.define("width", 800).define("height", 600).define("scaleMode", "showAll").define("align", "").define("showMenu", false);
    for (const n of ["addListener", "removeListener"]) def(St, n, () => true);
    const Sys = new ASObject(this, this.ObjectProto); G.define("System", Sys, { dontEnum: true });
    const caps = new ASObject(this, this.ObjectProto); caps.define("language", "en").define("os", "Windows XP").define("version", "WIN 7,0,19,0").define("screenResolutionX", 1024).define("screenResolutionY", 768);
    Sys.define("capabilities", caps); Sys.define("useCodepage", false);
    const sec = new ASObject(this, this.ObjectProto); def(sec, "allowDomain", () => true); Sys.define("security", sec);
    // Sound (routed to the audio sink; network loading is sandboxed)
    const [, SoundP] = cls("Sound", (self, a) => { if (self instanceof ASObject) self.define("__target", a[0], { dontEnum: true }); });
    def(SoundP, "attachSound", (self, a) => { const want = rt.toStr(a[0]).toLowerCase(); const e = Object.entries(rt.page.exports).find(([n]) => n.toLowerCase() === want); if (self instanceof ASObject && e) self.define("__sound", e[1], { dontEnum: true }); rt.host("sound.attachSound", [rt.toStr(a[0])]); });
    def(SoundP, "start", (self) => { const id = self?.get?.("__sound"); if (id !== undefined) rt.startSound(id, {}, self); });
    def(SoundP, "stop", () => rt.audio?.stopAll());
    def(SoundP, "setVolume", (self, a) => { rt.volume = rt.toNum(a[0]); rt.audio?.setVolume?.(rt.volume); rt.host("sound.setVolume", [rt.volume]); });
    def(SoundP, "getVolume", () => rt.volume); def(SoundP, "getPan", () => 0); def(SoundP, "getBytesLoaded", () => 1); def(SoundP, "getBytesTotal", () => 1);
    for (const n of ["setPan", "setTransform"]) def(SoundP, n, () => undefined);
    def(SoundP, "loadSound", (self, a) => rt.host("sandboxed.loadSound", [rt.toStr(a[0])]));
    for (const n of ["XML", "LoadVars"]) { const [, P] = cls(n); for (const m of ["load", "send", "sendAndLoad"]) def(P, m, (self, a) => { rt.host(`sandboxed.${n}.${m}`, [rt.toStr(a[0])]); return false; }); def(P, "parseXML", () => undefined); }
  }
}
