// HFR feasibility spike: headless display list, timeline, built-ins and the
// HELP Math 1.0 course-shell shim. No rendering, no audio, no network.
import { AVM1, ASObject, ASFunction, ASArray, NOTFOUND } from "./avm1.mjs";

const TIMELINE_DEPTH_LIMIT = 16384;
const ID = () => ({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });

const KNOWN_API = new Set(`attachaudio attachmovie beginfill begingradientfill clear createemptymovieclip createtextfield curveto duplicatemovieclip endfill getbounds getbytesloaded getbytestotal getdepth getinstanceatdepth getnexthighestdepth getswfversion gettextsnapshot geturl globaltolocal gotoandplay gotoandstop hittest linestyle lineto loadmovie loadvariables localtoglobal moveto nextframe play prevframe removemovieclip setmask startdrag stop stopdrag swapdepths unloadmovie addlistener getfontlist getnewtextformat gettextformat removelistener removetextfield replacesel setnewtextformat settextformat replacetext concat join pop push reverse shift slice sort sorton splice tostring unshift charat charcodeat fromcharcode indexof lastindexof split substr substring tolowercase touppercase abs acos asin atan atan2 ceil cos exp floor log max min pow random round sin sqrt tan getdate getday getfullyear gethours getmilliseconds getminutes getmonth getseconds gettime gettimezoneoffset getyear setdate setfullyear sethours setmilliseconds setminutes setmonth setseconds settime getascii getcode isdown istoggled hide show getbeginindex getcaretindex getendindex getfocus setfocus setselection attachsound getpan gettransform getvolume loadsound setpan settransform setvolume start getrgb setrgb addproperty hasownproperty ispropertyenumerable isprototypeof registerclass unwatch valueof watch apply call escape unescape gettimer getversion isfinite isnan parsefloat parseint setinterval clearinterval trace updateafterevent fscommand getproperty setproperty targetpath loadmovienum loadvariablesnum unloadmovienum nextscene prevscene stopallsounds print asSetPropFlags asnative number string boolean array object load send sendandload parsexml createelement createtextnode`.split(/\s+/).map((s) => s.toLowerCase()));

export const SHELL_FUNCTIONS = ["DoHyperLinks", "enableQuizButton", "disableQuizButton", "showRightFeed", "showWrongFeed", "doPlayFQQuestionAudio", "doPlayFQAnswerAudio", "setBookMark", "getBookMark", "doCloseApp", "doNeedMoreHelp", "doPlaySpanishAudio", "doStopSpanishAudio", "doCheckSpanishAudio", "doPlayNextMovie", "doPlayPreviousMovie", "loadSWFMovie", "doGetSwfFileName", "doMapClickEnableAll"];
const SHELL_CLIPS = ["InternalPreloader", "popup", "replay_mc", "back_mc", "next_mc", "pause_mc", "play_mc", "nextani", "Send_Quiz_Report_Mc", "Send_Click_Report_Mc"];
const SHELL_TEXT = ["dtfFinalQuizAudio", "dtfFinalQuizSpanishAudio", "dtfFinalQuizAnswerAudio", "dtfFinalQuizAnswerSpanishAudio", "dtfClicks"];

const CLIP_EVENTS = { load: 0x1, enterFrame: 0x2, unload: 0x4, mouseMove: 0x8, mouseDown: 0x10, mouseUp: 0x20, keyDown: 0x40, keyUp: 0x80, data: 0x100, initialize: 0x200, press: 0x400, release: 0x800, releaseOutside: 0x1000, rollOver: 0x2000, rollOut: 0x4000, dragOver: 0x8000, dragOut: 0x10000, keyPress: 0x20000, construct: 0x40000 };
const HANDLER = { load: "onLoad", enterFrame: "onEnterFrame", unload: "onUnload", mouseMove: "onMouseMove", mouseDown: "onMouseDown", mouseUp: "onMouseUp", keyDown: "onKeyDown", keyUp: "onKeyUp", data: "onData", press: "onPress", release: "onRelease", releaseOutside: "onReleaseOutside", rollOver: "onRollOver", rollOut: "onRollOut", dragOver: "onDragOver", dragOut: "onDragOut" };

function mulM(m, n) { // m applied after n
  return { a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b, c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d, tx: m.a * n.tx + m.c * n.ty + m.tx, ty: m.b * n.tx + m.d * n.ty + m.ty };
}
function xformRect(m, r) {
  if (!r) return null;
  const pts = [[r.xmin, r.ymin], [r.xmax, r.ymin], [r.xmin, r.ymax], [r.xmax, r.ymax]].map(([x, y]) => [m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty]);
  return { xmin: Math.min(...pts.map((p) => p[0])), xmax: Math.max(...pts.map((p) => p[0])), ymin: Math.min(...pts.map((p) => p[1])), ymax: Math.max(...pts.map((p) => p[1])) };
}
function unionRect(a, b) { if (!a) return b; if (!b) return a; return { xmin: Math.min(a.xmin, b.xmin), xmax: Math.max(a.xmax, b.xmax), ymin: Math.min(a.ymin, b.ymin), ymax: Math.max(a.ymax, b.ymax) }; }
function stripHtml(s) { return String(s).replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'"); }

class DisplayObject extends ASObject {
  constructor(rt, proto, def, parent, depth, name) {
    super(rt, proto);
    this.isDisplay = true; this.def = def; this.parentClip = parent; this.depth = depth; this.name = name ?? "";
    this.m = ID(); this.alpha = 100; this.visible = true; this.removed = false; this.scriptMoved = false;
  }
  targetPath() {
    if (!this.parentClip) return "_level0";
    return this.parentClip.targetPath() + "." + this.name;
  }
  slashPath() { if (!this.parentClip) return "/"; const p = this.parentClip.slashPath(); return (p === "/" ? "/" : p + "/") + this.name; }
  localBounds() { return this.def?.bounds ?? null; }
  bounds() { return xformRect(this.m, this.localBounds()); }
  dispProp(name) {
    switch (this.rt.k(name)) {
      case "_x": return this.m.tx / 20;
      case "_y": return this.m.ty / 20;
      case "_xscale": return Math.hypot(this.m.a, this.m.b) * 100;
      case "_yscale": return Math.hypot(this.m.c, this.m.d) * 100;
      case "_rotation": return (Math.atan2(this.m.b, this.m.a) * 180) / Math.PI;
      case "_alpha": return this.alpha;
      case "_visible": return this.visible;
      case "_width": { const b = this.bounds(); return b ? (b.xmax - b.xmin) / 20 : 0; }
      case "_height": { const b = this.bounds(); return b ? (b.ymax - b.ymin) / 20 : 0; }
      case "_name": return this.name;
      case "_parent": return this.parentClip ?? undefined;
      case "_root": case "_level0": return this.rt.shell;
      case "_global": return this.rt.Global;
      case "_target": return this.slashPath();
      case "_currentframe": return this.isClip ? Math.max(1, this.frame) : undefined;
      case "_totalframes": case "_framesloaded": return this.isClip ? this.totalFrames : undefined;
      case "_xmouse": return 0; case "_ymouse": return 0;
      case "_droptarget": return ""; case "_url": return "file:///page.swf";
      case "_highquality": return 1; case "_quality": return "HIGH"; case "_focusrect": return true; case "_soundbuftime": return 5;
      default: return NOTFOUND;
    }
  }
  setDispProp(name, v) {
    const rt = this.rt; const k = rt.k(name);
    const num = () => rt.toNum(v);
    const setScale = (sx, sy) => {
      const rot = Math.atan2(this.m.b, this.m.a), skew = Math.atan2(-this.m.c, this.m.d);
      if (sx !== null) { this.m.a = Math.cos(rot) * sx; this.m.b = Math.sin(rot) * sx; }
      if (sy !== null) { this.m.c = -Math.sin(skew) * sy; this.m.d = Math.cos(skew) * sy; }
    };
    switch (k) {
      case "_x": { const n = num(); if (Number.isFinite(n)) this.m.tx = n * 20; break; }
      case "_y": { const n = num(); if (Number.isFinite(n)) this.m.ty = n * 20; break; }
      case "_xscale": { const n = num(); if (Number.isFinite(n)) setScale(n / 100, null); break; }
      case "_yscale": { const n = num(); if (Number.isFinite(n)) setScale(null, n / 100); break; }
      case "_rotation": { const n = num(); if (Number.isFinite(n)) { const sx = Math.hypot(this.m.a, this.m.b), sy = Math.hypot(this.m.c, this.m.d); const r = (n * Math.PI) / 180; this.m.a = Math.cos(r) * sx; this.m.b = Math.sin(r) * sx; this.m.c = -Math.sin(r) * sy; this.m.d = Math.cos(r) * sy; } break; }
      case "_alpha": { const n = num(); if (Number.isFinite(n)) this.alpha = n; break; }
      case "_visible": this.visible = rt.toBool(v); break;
      case "_width": case "_height": {
        const n = num(); const b = this.localBounds(); if (!b || !Number.isFinite(n)) break;
        const w = (k === "_width" ? b.xmax - b.xmin : b.ymax - b.ymin) / 20; if (w <= 0) break;
        if (k === "_width") setScale(n / w, null); else setScale(null, n / w);
        break;
      }
      case "_name": if (this.parentClip) this.name = rt.toStr(v); break;
      case "_quality": case "_highquality": case "_focusrect": case "_soundbuftime": break;
      case "_currentframe": case "_totalframes": case "_framesloaded": case "_target": case "_url": case "_droptarget": case "_xmouse": case "_ymouse": case "_parent": case "_root": case "_level0": case "_global": break;
      default: return false;
    }
    this.scriptMoved = true;
    return true;
  }
  getLocal(name, thisObj) {
    const own = super.getLocal(name, thisObj);
    if (own !== NOTFOUND) return own;
    if (this.isClip) { const c = this.childByName(name); if (c) return c; }
    return this.dispProp(name);
  }
  setLocalVirtual(name, v) { return this.dispProp(name) !== NOTFOUND ? this.setDispProp(name, v) : false; }
  typeOf() { return this.isClip ? "movieclip" : "object"; }
  toStringDefault() { return this.targetPath(); }
  ancestorsVisible() { let o = this; while (o) { if (!o.visible || o.removed) return false; o = o.parentClip; } return true; }
  getPropIndex(i) { const names = ["_x", "_y", "_xscale", "_yscale", "_currentframe", "_totalframes", "_alpha", "_visible", "_width", "_height", "_rotation", "_target", "_framesloaded", "_name", "_droptarget", "_url", "_highquality", "_focusrect", "_soundbuftime", "_quality", "_xmouse", "_ymouse"]; return names[i] ? this.dispProp(names[i]) : undefined; }
  setPropIndex(i, v) { const names = ["_x", "_y", "_xscale", "_yscale", "_currentframe", "_totalframes", "_alpha", "_visible", "_width", "_height", "_rotation", "_target", "_framesloaded", "_name", "_droptarget", "_url", "_highquality", "_focusrect", "_soundbuftime", "_quality", "_xmouse", "_ymouse"]; if (names[i]) this.setDispProp(names[i], v); }
  markRemoved() { this.removed = true; }
}

class MovieClip extends DisplayObject {
  constructor(rt, proto, def, parent, depth, name) {
    super(rt, proto, def, parent, depth, name);
    this.isClip = true; this.children = new Map(); this.frame = 0; this.playing = true; this.clipActions = []; this.drawOps = 0; this.bornTick = rt.tickCount;
  }
  get totalFrames() { return Math.max(1, this.def.frameCount || 0, this.def.frames?.length || 0); }
  childByName(name) {
    const k = this.rt.k(name);
    let best = null;
    for (const c of this.children.values()) if (!c.removed && c.asVisible && this.rt.k(c.name) === k && (!best || c.depth < best.depth)) best = c;
    return best;
  }
  sortedChildren() { return [...this.children.values()].sort((a, b) => a.depth - b.depth); }
  localBounds() {
    let r = null;
    for (const c of this.children.values()) if (!c.removed) r = unionRect(r, c.bounds());
    return r;
  }
  // ----- timeline -----
  applyFrameTags(f, runActions) {
    const tags = this.def.frames?.[f - 1] || [];
    for (const t of tags) {
      if (t.op === "place") this.placeTag(t);
      else if (t.op === "remove") this.removeAtDepth(t.depth);
      else if (t.op === "action" && runActions) this.rt.queueAction(this, t.bytes);
      else if (t.op === "init") this.rt.runInitAction(this, t);
      else if (t.op === "stream" && runActions) this.rt.streamFrames++;
    }
  }
  placeTag(t) {
    const rt = this.rt;
    const existing = this.children.get(t.depth);
    if (!t.move && t.charId !== undefined) {
      if (existing) this.removeAtDepth(t.depth);
      this.instantiate(t.charId, t.depth, t.name, t);
    } else if (t.move && t.charId === undefined) {
      if (!existing) return;
      if (t.matrix && !existing.scriptMoved) existing.m = { ...t.matrix };
      if (t.cxform && !existing.scriptMoved) existing.alpha = (t.cxform.am / 256) * 100;
      if (t.name) existing.name = t.name;
    } else if (t.move && t.charId !== undefined) {
      if (existing && existing.def?.id === t.charId) { if (t.matrix && !existing.scriptMoved) existing.m = { ...t.matrix }; return; }
      const keep = existing ? { m: existing.m, name: existing.name } : null;
      if (existing) this.removeAtDepth(t.depth);
      const o = this.instantiate(t.charId, t.depth, t.name ?? keep?.name, t);
      if (o && keep && !t.matrix) o.m = keep.m;
    }
    void rt;
  }
  instantiate(charId, depth, name, t, opts = {}) {
    const rt = this.rt; const def = rt.swf.dict.get(charId);
    if (!def) { rt.note("missingCharacter", String(charId)); return null; }
    let o;
    if (def.kind === "sprite") {
      const cls = rt.classForChar(charId);
      o = new MovieClip(rt, cls ? cls.get("prototype") : rt.MovieClipProto, def, this, depth, name || `instance${++rt.instanceCounter}`);
      o.asVisible = true;
    } else if (def.kind === "button") {
      o = new ButtonObj(rt, rt.ButtonProto, def, this, depth, name || `instance${++rt.instanceCounter}`); o.asVisible = true;
    } else if (def.kind === "edittext") {
      o = new TextFieldObj(rt, rt.TextFieldProto, def, this, depth, name || `instance${++rt.instanceCounter}`); o.asVisible = true;
    } else {
      o = new DisplayObject(rt, null, def, this, depth, name); o.asVisible = false;
    }
    if (t?.matrix) o.m = { ...t.matrix };
    if (t?.cxform) o.alpha = (t.cxform.am / 256) * 100;
    this.children.set(depth, o);
    if (o.isClip) {
      if (t?.clipActions) o.clipActions = t.clipActions;
      if (opts.init instanceof ASObject) for (const k2 of opts.init.enumKeys()) o.set(k2, opts.init.get(k2));
      rt.fireClipActions(o, "initialize");
      const cls = rt.classForChar(charId);
      if (cls) { o.define("__constructor__", cls, { dontEnum: true }); rt.safe(() => rt.callFn(cls, o, [], cls.get("prototype"))); }
      o.frame = 1; o.applyFrameTags(1, true);
      rt.queueEvent(o, "load");
    } else if (o.isButton && t?.clipActions) {
      o.clipActions = t.clipActions;
    }
    return o;
  }
  removeAtDepth(depth) {
    const o = this.children.get(depth); if (!o) return;
    this.children.delete(depth);
    this.rt.unloadTree(o);
  }
  advance() {
    if (this.removed) return;
    if (this.playing && this.totalFrames > 1 && this.bornTick !== this.rt.tickCount) {
      const next = this.frame + 1;
      if (next > this.totalFrames) { this.gotoFrame(1); this.looped = true; }
      else { this.frame = next; this.applyFrameTags(next, true); }
      if (!this.looped) this.rt.frameAdvances++;
    }
    for (const c of this.sortedChildren()) if (c.isClip && !c.removed) c.advance();
  }
  gotoFrame(f) {
    f = Math.max(1, Math.min(this.totalFrames, f | 0));
    if (f === this.frame) return;
    if (f > this.frame) { for (let i = this.frame + 1; i <= f; i++) this.applyFrameTags(i, i === f); this.frame = f; return; }
    // rewind: rebuild the timeline-owned display list for frame f
    const desired = new Map();
    for (let i = 1; i <= f; i++) for (const t of this.def.frames?.[i - 1] || []) {
      if (t.op === "place") {
        if (!t.move && t.charId !== undefined) desired.set(t.depth, { ...t });
        else if (t.move && t.charId === undefined) { const d = desired.get(t.depth); if (d) { if (t.matrix) d.matrix = t.matrix; if (t.cxform) d.cxform = t.cxform; if (t.name) d.name = t.name; } }
        else if (t.move && t.charId !== undefined) { const d = desired.get(t.depth); desired.set(t.depth, { ...(d || {}), ...t, move: false, clipActions: t.clipActions ?? d?.clipActions }); }
      } else if (t.op === "remove") desired.delete(t.depth);
    }
    for (const [depth, o] of [...this.children]) {
      if (depth >= TIMELINE_DEPTH_LIMIT) continue;
      const d = desired.get(depth);
      if (!d || d.charId !== o.def?.id) this.removeAtDepth(depth);
    }
    for (const [depth, d] of desired) {
      const o = this.children.get(depth);
      if (!o) this.instantiate(d.charId, depth, d.name, d);
      else if (d.matrix && !o.scriptMoved) o.m = { ...d.matrix };
    }
    this.frame = f;
    for (const t of this.def.frames?.[f - 1] || []) if (t.op === "action") this.rt.queueAction(this, t.bytes);
  }
  playCmd() { this.playing = true; }
  stopCmd() { this.playing = false; }
  gotoCmd(f, play) { this.gotoFrame(f); this.playing = !!play; }
  gotoLabelCmd(label, play) {
    const f = this.def.frames?.labels?.[String(label).toLowerCase()];
    if (f) this.gotoCmd(f, play); else this.rt.note("missingLabel", String(label));
  }
  nextFrameCmd() { this.gotoFrame(this.frame + 1); this.playing = false; }
  prevFrameCmd() { this.gotoFrame(this.frame - 1); this.playing = false; }
  duplicate(newName, depth, init) {
    if (!this.parentClip) return undefined;
    const p = this.parentClip, d = depth + TIMELINE_DEPTH_LIMIT;
    if (p.children.has(d)) p.removeAtDepth(d);
    const o = p.instantiate(this.def.id, d, newName, { matrix: this.m, clipActions: this.clipActions }, { init });
    return o ?? undefined;
  }
  removeCmd() { if (this.parentClip && this.depth >= 0) this.parentClip.removeAtDepth(this.depth); }
}

class ButtonObj extends DisplayObject {
  constructor(...a) { super(...a); this.isButton = true; }
  localBounds() {
    let r = null;
    for (const rec of this.def.records || []) if (rec.states & 0x01) { const d = this.rt.swf.dict.get(rec.charId); const b = d?.bounds ?? (d?.kind === "sprite" ? null : null); r = unionRect(r, xformRect(rec.matrix, b)); }
    return r;
  }
}

class TextFieldObj extends DisplayObject {
  constructor(rt, proto, def, parent, depth, name) {
    super(rt, proto, def, parent, depth, name);
    this.isText = true; this.html = !!def.html; this.textValue = def.initialText ? (def.html ? stripHtml(def.initialText) : def.initialText) : ""; this.variable = def.variable || "";
  }
  getLocal(name, thisObj) {
    const k = this.rt.k(name);
    switch (k) {
      case "text": return this.textValue;
      case "htmltext": return this.htmlValue ?? this.textValue;
      case "length": return this.textValue.length;
      case "variable": return this.variable || null;
      case "html": return this.html;
      case "maxscroll": case "scroll": case "bottomscroll": return 1;
      case "hscroll": case "maxhscroll": return 0;
      case "textwidth": return this.textValue.length * 7;
      case "textheight": return 14;
    }
    return super.getLocal(name, thisObj);
  }
  setLocalVirtual(name, v) {
    const k = this.rt.k(name);
    if (k === "text") { this.textValue = this.rt.toStr(v); this.htmlValue = undefined; this.pushToVariable(); return true; }
    if (k === "htmltext") { this.htmlValue = this.rt.toStr(v); this.textValue = stripHtml(this.htmlValue); this.pushToVariable(); return true; }
    if (k === "variable") { this.variable = v == null ? "" : this.rt.toStr(v); return true; }
    if (k === "html") { this.html = this.rt.toBool(v); return true; }
    return super.setLocalVirtual(name, v);
  }
  pushToVariable() { if (this.variable && this.parentClip) this.rt.safe(() => this.rt.setVariable({ scope: [this.rt.Global, this.parentClip], target: this.parentClip, origTarget: this.parentClip }, this.variable, this.textValue)); }
  pullFromVariable() {
    if (!this.variable || !this.parentClip) return;
    const v = this.rt.getVariable({ scope: [this.rt.Global, this.parentClip], target: this.parentClip, origTarget: this.parentClip }, this.variable);
    if (v !== undefined) { const s = this.rt.toStr(v); if (this.html) { this.htmlValue = s; this.textValue = stripHtml(s); } else this.textValue = s; }
  }
}

export class Runtime extends AVM1 {
  constructor(swf, opts = {}) {
    super();
    this.swf = swf; this.version = swf.version; this.ci = swf.version < 7;
    this.tickCount = 0; this.timeMs = 0; this.instanceCounter = 0; this.queue = []; this.initDone = new Set();
    this.intervals = new Map(); this.intervalId = 0; this.seed = opts.seed ?? 12345;
    this.hostLog = []; this.notes = new Map(); this.missing = { shell: new Map(), builtin: new Map(), content: new Map(), undefinedReceiver: new Map() };
    this.errors = []; this.frameAdvances = 0; this.streamFrames = 0; this.registeredClasses = new Map();
    this.mouseListeners = []; this.keyListeners = []; this.focus = null;
    this.installBuiltins();
    this.buildShell();
  }
  random() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x80000000; }
  note(kind, detail) { const k = kind + ":" + detail; this.notes.set(k, (this.notes.get(k) || 0) + 1); }
  host(kind, args) { if (this.hostLog.length < 5000) this.hostLog.push([this.tickCount, kind, ...args.map((a) => (a instanceof ASObject ? (a.isDisplay ? a.targetPath() : "[object]") : a))]); }
  safe(fn) { try { return fn(); } catch (e) { this.recordError(e); return undefined; } }
  recordError(e) { if (this.errors.length < 50) this.errors.push(String(e && e.message || e)); if (/op budget/.test(e?.message)) throw e; }
  defaultTarget() { return this.page ?? this.shell; }
  levelRoot() { return this.shell; }
  noteMissingCall(obj, name, ctx) {
    const lname = String(name).toLowerCase();
    if (obj === this.shell) { this.missing.shell.set(name, (this.missing.shell.get(name) || 0) + 1); return; }
    if (obj === undefined || obj === null) { const k = (this.lastUndefined ?? "?") + "." + name; this.missing.undefinedReceiver.set(k, (this.missing.undefinedReceiver.get(k) || 0) + 1); return; }
    const builtinish = obj === null || obj === undefined || typeof obj !== "object" || obj.isDisplay || obj instanceof ASArray || obj === this.MathObj || obj === this.KeyObj || obj === this.MouseObj || obj === this.SelectionObj || obj === this.StageObj || obj === this.Global;
    if (KNOWN_API.has(lname.replace(/^new /, "")) && builtinish) this.missing.builtin.set(name, (this.missing.builtin.get(name) || 0) + 1);
    else this.missing.content.set(name, (this.missing.content.get(name) || 0) + 1);
    void ctx;
  }
  classForChar(charId) {
    for (const [name, id] of this.swf.exports) if (id === charId && this.registeredClasses.has(name)) return this.registeredClasses.get(name);
    return null;
  }

  // ----- execution queue and events -----
  timelineCtx(clip) { return { scope: [this.Global, "TARGET"], target: clip, origTarget: clip, thisObj: undefined, regs: [undefined, undefined, undefined, undefined], pool: null, fn: null }; }
  queueAction(clip, bytes) { this.queue.push({ clip, bytes }); }
  queueEvent(clip, ev) { this.queue.push({ clip, ev }); }
  runQueue() {
    let guard = 0;
    while (this.queue.length) {
      if (++guard > 20000) { this.recordError(new Error("action queue runaway")); this.queue.length = 0; break; }
      const item = this.queue.shift();
      if (item.clip.removed) continue;
      if (item.bytes) this.safe(() => this.exec(item.bytes, this.timelineCtx(item.clip), this.version));
      else this.fireEvent(item.clip, item.ev);
    }
  }
  runInitAction(clip, t) {
    if (this.initDone.has(t)) return; this.initDone.add(t);
    this.safe(() => this.exec(t.bytes, this.timelineCtx(clip), this.version));
  }
  fireClipActions(clip, ev) {
    const flag = CLIP_EVENTS[ev]; let fired = false;
    for (const ca of clip.clipActions || []) if (ca.flags & flag) { fired = true; this.safe(() => this.exec(ca.bytes, this.timelineCtx(clip), this.version)); }
    return fired;
  }
  fireEvent(obj, ev) {
    if (obj.removed) return false;
    let fired = false;
    if (obj.isClip || obj.isButton) fired = this.fireClipActions(obj, ev) || fired;
    const h = HANDLER[ev];
    if (h) { const f = obj.get(h); if (f instanceof ASFunction) { fired = true; this.safe(() => this.callFn(f, obj, [])); } }
    return fired;
  }
  unloadTree(o) {
    o.markRemoved();
    if (o.isClip) { this.fireClipActions(o, "unload"); for (const c of o.children.values()) this.unloadTree(c); }
  }
  allClips(root = this.shell, out = []) { if (root.removed) return out; out.push(root); if (root.isClip) for (const c of root.sortedChildren()) if (c.isClip || c.isButton || c.isText) this.allClips(c, out); return out; }

  tick() {
    this.tickCount++; this.timeMs += 1000 / this.swf.frameRate;
    this.frameAdvances = 0;
    if (this.pendingBegin && this.page) {
      this.pendingBegin = false;
      if (this.page.def.frames?.labels?.begin) this.page.gotoLabelCmd("begin", true); else this.page.playCmd();
      this.frameAdvances++;
    }
    this.shell.advance();
    this.runQueue();
    for (const c of this.allClips()) if (c.isClip && !c.removed) this.fireEvent(c, "enterFrame");
    this.runQueue();
    for (const [id, iv] of [...this.intervals]) {
      let n = 0;
      while (this.intervals.has(id) && iv.next <= this.timeMs && n++ < 4) {
        iv.next += Math.max(10, iv.period);
        const f = iv.fn instanceof ASFunction ? iv.fn : iv.obj?.get(iv.method);
        if (f instanceof ASFunction) this.safe(() => this.callFn(f, iv.obj ?? undefined, iv.args)); else { this.intervals.delete(id); }
      }
    }
    this.runQueue();
    for (const c of this.allClips()) if (c.isText) this.safe(() => c.pullFromVariable());
  }

  // ----- the HELP Math 1.0 course shell shim -----
  buildShell() {
    const shellDef = { kind: "sprite", id: -1, frameCount: 1, frames: [[]] };
    this.shell = new MovieClip(this, this.MovieClipProto, shellDef, null, 0, "");
    this.shell.asVisible = true; this.shell.frame = 1; this.shell.playing = false;
    const mk = (parent, name, depth) => { const c = new MovieClip(this, this.MovieClipProto, { kind: "sprite", id: -2, frameCount: 1, frames: [[]] }, parent, depth, name); c.asVisible = true; c.frame = 1; c.playing = false; parent.children.set(depth, c); return c; };
    this.animationMc = mk(this.shell, "animation_mc", 1);
    SHELL_CLIPS.forEach((n, i) => mk(this.shell, n, 10 + i));
    SHELL_TEXT.forEach((n, i) => { const t = new TextFieldObj(this, this.TextFieldProto, { kind: "edittext", initialText: "ON", variable: "" }, this.shell, 40 + i, n); t.asVisible = true; this.shell.children.set(40 + i, t); });
    // Course-shell preloader handshake: page frame 1 calls
    // _level0.InternalPreloader.gotoAndPlay("jump_check") and stops; the shell
    // then starts the page at its "begin" label (frame 6 in the template).
    // Shell navigation buttons that pages switch between labelled states.
    for (const n of ["back_mc", "next_mc", "replay_mc", "pause_mc", "play_mc", "nextani", "popup"]) {
      const c = this.shell.childByName(n);
      for (const m of ["gotoAndStop", "gotoAndPlay"]) c.define(m, this.nat((self, args) => this.host("shell.nav." + n, [this.toStr(args[0])])), { dontEnum: true });
    }
    // Shell-owned global sound object and volume level.
    this.Global.set("gSound", this.construct(this.Global.get("Sound"), []));
    this.Global.set("volLevel", 100);
    const pre = this.shell.childByName("InternalPreloader");
    pre.define("gotoAndPlay", this.nat((self, args) => { this.host("shell.preloader", [this.toStr(args[0])]); if (this.k(this.toStr(args[0])) === "jump_check") this.pendingBegin = true; }), { dontEnum: true });
    for (const fname of SHELL_FUNCTIONS) {
      this.shell.define(fname, this.nat((self, args) => { this.host("shell." + fname, args.map((a) => (a instanceof ASObject ? (a.isDisplay ? a.targetPath() : "[object]") : a))); return fname === "getBookMark" ? "" : undefined; }), { dontEnum: true });
    }
  }
  loadPage() {
    // The 1.0 shell used animation_mc.loadMovie(page): the page root timeline
    // replaces animation_mc, so _root.animation_mc.animation is the page's
    // main content sprite (placed at the "begin" frame).
    const def = this.swf.root;
    this.shell.children.delete(this.animationMc.depth); this.animationMc.markRemoved();
    this.page = new MovieClip(this, this.MovieClipProto, def, this.shell, 1, "animation_mc");
    this.page.asVisible = true;
    this.shell.children.set(1, this.page);
    this.page.frame = 1; this.page.applyFrameTags(1, true);
    this.queueEvent(this.page, "load");
    this.runQueue();
  }

  // ----- built-ins -----
  nat(fn, ctor) { const f = new ASFunction(this, { name: "", params: [], native: fn }); if (ctor) f.ctor = ctor; return f; }
  installBuiltins() {
    const rt = this;
    this.ObjectProto = new ASObject(this, null);
    this.FunctionProto = new ASObject(this, this.ObjectProto);
    const G = this.Global = new ASObject(this, this.ObjectProto);
    const def = (o, name, fn) => o.define(name, this.nat(fn), { dontEnum: true });
    const cls = (name, ctorFn, protoParent = this.ObjectProto, construct) => {
      const f = this.nat(ctorFn ?? (() => undefined), construct);
      const proto = f.get("prototype"); proto.proto = protoParent;
      G.define(name, f, { dontEnum: true }); return [f, proto];
    };
    // Object / Function
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
    const [FunctionCtor] = cls("Function");
    FunctionCtor.define("prototype", this.FunctionProto, { dontEnum: true });
    def(this.FunctionProto, "call", (self, a) => rt.callFn(self, a[0] ?? undefined, a.slice(1)));
    def(this.FunctionProto, "apply", (self, a) => rt.callFn(self, a[0] ?? undefined, a[1] instanceof ASArray ? a[1].a.slice() : []));
    // Array
    const [ArrayCtor, AP] = cls("Array", (self, a) => mkArray(a), this.ObjectProto, (a) => mkArray(a));
    this.ArrayProto = AP;
    function mkArray(a) { if (a.length === 1 && typeof a[0] === "number") return new ASArray(rt, new Array(Math.max(0, a[0] | 0)).fill(undefined)); return new ASArray(rt, a.slice()); }
    const arr = (self) => (self instanceof ASArray ? self.a : []);
    def(AP, "push", (self, a) => { arr(self).push(...a); return arr(self).length; });
    def(AP, "pop", (self) => arr(self).pop());
    def(AP, "shift", (self) => arr(self).shift());
    def(AP, "unshift", (self, a) => arr(self).unshift(...a));
    def(AP, "splice", (self, a) => { const x = arr(self); let s = rt.toInt(a[0]); if (s < 0) s = Math.max(0, x.length + s); const n = a.length > 1 ? Math.max(0, rt.toInt(a[1])) : x.length - s; return new ASArray(rt, x.splice(s, n, ...a.slice(2))); });
    def(AP, "slice", (self, a) => { const x = arr(self); return new ASArray(rt, x.slice(a[0] === undefined ? 0 : rt.toInt(a[0]), a[1] === undefined ? undefined : rt.toInt(a[1]))); });
    def(AP, "join", (self, a) => arr(self).map((v) => (v === undefined ? "" : v === null ? "null" : rt.toStr(v))).join(a[0] === undefined ? "," : rt.toStr(a[0])));
    def(AP, "toString", (self) => self instanceof ASArray ? self.toStringDefault() : "");
    def(AP, "concat", (self, a) => { const out = arr(self).slice(); for (const v of a) { if (v instanceof ASArray) out.push(...v.a); else out.push(v); } return new ASArray(rt, out); });
    def(AP, "reverse", (self) => { arr(self).reverse(); return self; });
    const sorter = (flags, cmpFn) => (x, y) => {
      let r;
      if (cmpFn instanceof ASFunction) r = rt.toNum(rt.callFn(cmpFn, undefined, [x, y]));
      else if (flags & 16) r = rt.toNum(x) - rt.toNum(y);
      else { let sx = rt.toStr(x), sy = rt.toStr(y); if (flags & 1) { sx = sx.toLowerCase(); sy = sy.toLowerCase(); } r = sx < sy ? -1 : sx > sy ? 1 : 0; }
      return flags & 2 ? -r : r;
    };
    def(AP, "sort", (self, a) => { const cmp = a[0] instanceof ASFunction ? a[0] : null; const flags = cmp ? rt.toInt(a[1]) : rt.toInt(a[0]); arr(self).sort(sorter(flags, cmp)); return self; });
    def(AP, "sortOn", (self, a) => { const f = rt.toStr(a[0]); const flags = rt.toInt(a[1]); const s = sorter(flags, null); arr(self).sort((x, y) => s(rt.getMember(x, f), rt.getMember(y, f))); return self; });
    ArrayCtor.define("CASEINSENSITIVE", 1).define("DESCENDING", 2).define("UNIQUESORT", 4).define("RETURNINDEXEDARRAY", 8).define("NUMERIC", 16);
    // String / Number / Boolean
    const [StringCtor, SP] = cls("String", (self, a) => (a.length ? rt.toStr(a[0]) : ""));
    this.StringProto = SP;
    const str = (self) => (self instanceof ASObject ? rt.toStr(self.get("__value") ?? "") : rt.toStr(self));
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
    const [NumberCtor, NP] = cls("Number", (self, a) => (a.length ? rt.toNum(a[0]) : 0));
    this.NumberProto = NP;
    def(NP, "toString", (self, a) => { const n = rt.toNum(self); const r = a[0] === undefined ? 10 : rt.toInt(a[0]); return r === 10 ? rt.numStr(n) : n.toString(r); });
    def(NP, "valueOf", (self) => rt.toNum(self));
    NumberCtor.define("MAX_VALUE", Number.MAX_VALUE).define("MIN_VALUE", Number.MIN_VALUE).define("NaN", NaN).define("POSITIVE_INFINITY", Infinity).define("NEGATIVE_INFINITY", -Infinity);
    const [, BP] = cls("Boolean", (self, a) => rt.toBool(a[0]));
    this.BooleanProto = BP;
    def(BP, "toString", (self) => rt.toStr(rt.toBool(self))); def(BP, "valueOf", (self) => rt.toBool(self));
    // Math
    const M = this.MathObj = new ASObject(this, this.ObjectProto); G.define("Math", M, { dontEnum: true });
    for (const n of ["abs", "acos", "asin", "atan", "ceil", "cos", "exp", "floor", "log", "sin", "sqrt", "tan"]) def(M, n, (self, a) => Math[n](rt.toNum(a[0])));
    def(M, "atan2", (self, a) => Math.atan2(rt.toNum(a[0]), rt.toNum(a[1])));
    def(M, "pow", (self, a) => Math.pow(rt.toNum(a[0]), rt.toNum(a[1])));
    def(M, "max", (self, a) => (a.length ? Math.max(...a.map((x) => rt.toNum(x))) : -Infinity));
    def(M, "min", (self, a) => (a.length ? Math.min(...a.map((x) => rt.toNum(x))) : Infinity));
    def(M, "round", (self, a) => Math.floor(rt.toNum(a[0]) + 0.5));
    def(M, "random", () => rt.random());
    for (const n of ["PI", "E", "LN2", "LN10", "LOG2E", "LOG10E", "SQRT1_2", "SQRT2"]) M.define(n, Math[n]);
    // Date (deterministic clock)
    const [, DP] = cls("Date", null, this.ObjectProto, (a) => { const o = new ASObject(rt, DP); o.t = a.length ? new Date(rt.toNum(a[0])) : new Date(Date.UTC(2007, 0, 15, 9, 0, 0) + rt.timeMs); return o; });
    for (const n of ["getTime", "getHours", "getMinutes", "getSeconds", "getMilliseconds", "getDate", "getDay", "getMonth", "getFullYear", "getTimezoneOffset"]) def(DP, n, (self) => (self?.t ? self.t[n]() : NaN));
    def(DP, "getYear", (self) => (self?.t ? self.t.getFullYear() - 1900 : NaN));
    def(DP, "toString", (self) => (self?.t ? self.t.toString() : ""));
    def(DP, "setTime", (self, a) => { if (self) self.t = new Date(rt.toNum(a[0])); });
    // Global functions
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
      let names = null; if (a[1] instanceof ASArray) names = a[1].a.map((x) => rt.k(rt.toStr(x))); else if (a[1] !== null && a[1] !== undefined) names = rt.toStr(a[1]).split(",").map((x) => rt.k(x));
      for (const [key, e] of o.props) if (!names || names.includes(key)) { const f = ((e.dontEnum ? 1 : 0) | (e.perm ? 2 : 0) | (e.ro ? 4 : 0)) & ~clear | set; e.dontEnum = !!(f & 1); e.perm = !!(f & 2); e.ro = !!(f & 4); }
    });
    def(G, "ASnative", () => rt.nat(() => undefined));
    // MovieClip / Button / TextField prototypes
    const [, MCP] = cls("MovieClip"); this.MovieClipProto = MCP;
    MCP.define("enabled", true).define("useHandCursor", true).define("focusEnabled", false, { dontEnum: true });
    const clip = (self) => (self?.isClip ? self : null);
    def(MCP, "play", (self) => clip(self)?.playCmd());
    def(MCP, "stop", (self) => clip(self)?.stopCmd());
    def(MCP, "gotoAndPlay", (self, a) => { const c = clip(self); if (!c) return; typeof a[0] === "string" && !/^\d+$/.test(a[0]) ? c.gotoLabelCmd(a[0], true) : c.gotoCmd(rt.toInt(a[0]), true); });
    def(MCP, "gotoAndStop", (self, a) => { const c = clip(self); if (!c) return; typeof a[0] === "string" && !/^\d+$/.test(a[0]) ? c.gotoLabelCmd(a[0], false) : c.gotoCmd(rt.toInt(a[0]), false); });
    def(MCP, "nextFrame", (self) => clip(self)?.nextFrameCmd());
    def(MCP, "prevFrame", (self) => clip(self)?.prevFrameCmd());
    def(MCP, "attachMovie", (self, a) => {
      const c = clip(self); if (!c) return undefined;
      const id = rt.swf.exports.get(rt.toStr(a[0]).toLowerCase()); if (id === undefined) { rt.note("attachMovieMissingLinkage", rt.toStr(a[0])); return undefined; }
      const d = rt.toInt(a[2]) + TIMELINE_DEPTH_LIMIT; if (c.children.has(d)) c.removeAtDepth(d);
      const o = c.instantiate(id, d, rt.toStr(a[1]), null, { init: a[3] }); return o ?? undefined;
    });
    def(MCP, "createEmptyMovieClip", (self, a) => {
      const c = clip(self); if (!c) return undefined; const d = rt.toInt(a[1]) + TIMELINE_DEPTH_LIMIT; if (c.children.has(d)) c.removeAtDepth(d);
      const o = new MovieClip(rt, rt.MovieClipProto, { kind: "sprite", id: -3, frameCount: 1, frames: [[]] }, c, d, rt.toStr(a[0])); o.asVisible = true; o.frame = 1; c.children.set(d, o); return o;
    });
    def(MCP, "createTextField", (self, a) => {
      const c = clip(self); if (!c) return undefined; const d = rt.toInt(a[1]) + TIMELINE_DEPTH_LIMIT; if (c.children.has(d)) c.removeAtDepth(d);
      const w = rt.toNum(a[4]) * 20, h = rt.toNum(a[5]) * 20;
      const o = new TextFieldObj(rt, rt.TextFieldProto, { kind: "edittext", bounds: { xmin: 0, ymin: 0, xmax: w, ymax: h }, variable: "" }, c, d, rt.toStr(a[0]));
      o.asVisible = true; o.m.tx = rt.toNum(a[2]) * 20; o.m.ty = rt.toNum(a[3]) * 20; c.children.set(d, o); return o;
    });
    def(MCP, "duplicateMovieClip", (self, a) => clip(self)?.duplicate(rt.toStr(a[0]), rt.toInt(a[1]), a[2]));
    def(MCP, "removeMovieClip", (self) => { const c = clip(self); if (c && c.parentClip && c.depth >= TIMELINE_DEPTH_LIMIT) c.parentClip.removeAtDepth(c.depth); });
    def(MCP, "swapDepths", (self, a) => {
      const c = self?.isDisplay ? self : null; if (!c || !c.parentClip) return; const p = c.parentClip;
      let d; if (a[0]?.isDisplay) { if (a[0].parentClip !== p) return; d = a[0].depth; } else d = rt.toInt(a[0]) + TIMELINE_DEPTH_LIMIT;
      const other = p.children.get(d); p.children.delete(c.depth); if (other) { other.depth = c.depth; p.children.set(c.depth, other); }
      c.depth = d; p.children.set(d, c);
    });
    def(MCP, "getDepth", (self) => (self?.isDisplay ? self.depth - TIMELINE_DEPTH_LIMIT : undefined));
    def(MCP, "getNextHighestDepth", (self) => { const c = clip(self); if (!c) return 0; let m = -1; for (const d of c.children.keys()) m = Math.max(m, d - TIMELINE_DEPTH_LIMIT); return Math.max(0, m + 1); });
    def(MCP, "getInstanceAtDepth", (self, a) => clip(self)?.children.get(rt.toInt(a[0]) + TIMELINE_DEPTH_LIMIT));
    def(MCP, "getBytesLoaded", () => 1000); def(MCP, "getBytesTotal", () => 1000);
    def(MCP, "getSWFVersion", () => rt.version);
    def(MCP, "hitTest", () => false);
    def(MCP, "getBounds", (self) => { const b = self?.isDisplay ? self.localBounds() : null; const o = new ASObject(rt, rt.ObjectProto); o.set("xMin", b ? b.xmin / 20 : 0); o.set("xMax", b ? b.xmax / 20 : 0); o.set("yMin", b ? b.ymin / 20 : 0); o.set("yMax", b ? b.ymax / 20 : 0); return o; });
    def(MCP, "localToGlobal", () => undefined); def(MCP, "globalToLocal", () => undefined);
    def(MCP, "startDrag", (self) => rt.host("startDrag", [self])); def(MCP, "stopDrag", () => rt.host("stopDrag", []));
    def(MCP, "setMask", () => undefined);
    for (const n of ["lineStyle", "moveTo", "lineTo", "curveTo", "beginFill", "beginGradientFill", "endFill", "clear"]) def(MCP, n, (self) => { if (self?.isClip) self.drawOps++; });
    def(MCP, "loadMovie", (self, a) => rt.host("loadMovie", [rt.toStr(a[0])]));
    def(MCP, "unloadMovie", (self) => rt.host("unloadMovie", [self]));
    def(MCP, "loadVariables", (self, a) => rt.host("loadVariables", [rt.toStr(a[0])]));
    def(MCP, "getURL", (self, a) => rt.host("getURL", [rt.toStr(a[0])]));
    def(MCP, "attachAudio", () => undefined);
    const [, BTP] = cls("Button"); this.ButtonProto = BTP;
    BTP.define("enabled", true).define("useHandCursor", true);
    def(BTP, "getDepth", (self) => (self?.isDisplay ? self.depth - TIMELINE_DEPTH_LIMIT : undefined));
    const [, TFP] = cls("TextField"); this.TextFieldProto = TFP;
    for (const n of ["setTextFormat", "setNewTextFormat", "replaceSel", "addListener", "removeListener", "replaceText"]) def(TFP, n, () => undefined);
    def(TFP, "getTextFormat", () => new ASObject(rt, rt.TextFormatProto));
    def(TFP, "getNewTextFormat", () => new ASObject(rt, rt.TextFormatProto));
    def(TFP, "getDepth", (self) => (self?.isDisplay ? self.depth - TIMELINE_DEPTH_LIMIT : undefined));
    def(TFP, "removeTextField", (self) => { if (self?.parentClip) self.parentClip.removeAtDepth(self.depth); });
    const [, TFMT] = cls("TextFormat", (self, a) => { if (self instanceof ASObject) ["font", "size", "color", "bold", "italic", "underline", "url", "target", "align", "leftMargin", "rightMargin", "indent", "leading"].forEach((n, i) => self.set(n, a[i] === undefined ? null : a[i])); });
    this.TextFormatProto = TFMT;
    def(TFMT, "getTextExtent", (self, a) => { const o = new ASObject(rt, rt.ObjectProto); const s = rt.toStr(a[0]); o.set("width", s.length * 7); o.set("height", 14); o.set("textFieldWidth", s.length * 7 + 4); o.set("textFieldHeight", 18); return o; });
    // Color
    const [, CP] = cls("Color", (self, a) => { if (self instanceof ASObject) self.define("__target", a[0], { dontEnum: true }); });
    def(CP, "setRGB", (self, a) => { const t = self?.get?.("__target"); if (t?.isDisplay) t.rgb = rt.toInt(a[0]); });
    def(CP, "getRGB", (self) => self?.get?.("__target")?.rgb ?? 0);
    def(CP, "setTransform", () => undefined);
    def(CP, "getTransform", () => { const o = new ASObject(rt, rt.ObjectProto); for (const n of ["ra", "ga", "ba", "aa"]) o.set(n, 100); for (const n of ["rb", "gb", "bb", "ab"]) o.set(n, 0); return o; });
    // Key / Mouse / Selection / Stage / System
    const K = this.KeyObj = new ASObject(this, this.ObjectProto); G.define("Key", K, { dontEnum: true });
    Object.entries({ BACKSPACE: 8, TAB: 9, ENTER: 13, SHIFT: 16, CONTROL: 17, CAPSLOCK: 20, ESCAPE: 27, SPACE: 32, PGUP: 33, PGDN: 34, END: 35, HOME: 36, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETEKEY: 46 }).forEach(([n, v]) => K.define(n, v));
    def(K, "isDown", () => false); def(K, "isToggled", () => false); def(K, "getCode", () => 0); def(K, "getAscii", () => 0);
    def(K, "addListener", (self, a) => { if (!rt.keyListeners.includes(a[0])) rt.keyListeners.push(a[0]); return true; });
    def(K, "removeListener", (self, a) => { rt.keyListeners = rt.keyListeners.filter((x) => x !== a[0]); return true; });
    const Mo = this.MouseObj = new ASObject(this, this.ObjectProto); G.define("Mouse", Mo, { dontEnum: true });
    def(Mo, "show", () => 1); def(Mo, "hide", () => 1);
    def(Mo, "addListener", (self, a) => { if (!rt.mouseListeners.includes(a[0])) rt.mouseListeners.push(a[0]); return true; });
    def(Mo, "removeListener", (self, a) => { rt.mouseListeners = rt.mouseListeners.filter((x) => x !== a[0]); return true; });
    const S = this.SelectionObj = new ASObject(this, this.ObjectProto); G.define("Selection", S, { dontEnum: true });
    def(S, "setFocus", (self, a) => { rt.focus = a[0] instanceof ASObject ? a[0] : (typeof a[0] === "string" ? rt.resolvePath(rt.timelineCtx(rt.page ?? rt.shell), a[0]) : null); return true; });
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
    // Sound (sandboxed; logs only)
    const [, SoundP] = cls("Sound", (self, a) => { if (self instanceof ASObject) self.define("__target", a[0], { dontEnum: true }); });
    for (const n of ["attachSound", "start", "stop", "setVolume", "setPan", "setTransform", "loadSound"]) def(SoundP, n, (self, a) => rt.host("sound." + n, a.map((x) => rt.toStr(x))));
    def(SoundP, "getVolume", () => 100); def(SoundP, "getPan", () => 0); def(SoundP, "getBytesLoaded", () => 1); def(SoundP, "getBytesTotal", () => 1);
    // XML / LoadVars (network sandboxed)
    for (const n of ["XML", "LoadVars"]) { const [, P] = cls(n); for (const m of ["load", "send", "sendAndLoad"]) def(P, m, (self, a) => { rt.host(n + "." + m, [rt.toStr(a[0])]); return false; }); def(P, "parseXML", () => undefined); }
  }

  // ----- interaction driver -----
  clickables() {
    const out = [];
    for (const o of this.allClips()) {
      if (o === this.shell || o.removed || !o.ancestorsVisible()) continue;
      if (o.get("enabled") === false) continue;
      if (o.isButton) {
        const hasCond = (o.def.conds || []).some((c) => c.b0 & 0x0c);
        if (hasCond || o.get("onRelease") instanceof ASFunction || o.get("onPress") instanceof ASFunction) out.push(o);
      } else if (o.isClip) {
        const hasCA = (o.clipActions || []).some((ca) => ca.flags & (CLIP_EVENTS.press | CLIP_EVENTS.release));
        if (hasCA || o.get("onRelease") instanceof ASFunction || o.get("onPress") instanceof ASFunction) out.push(o);
      }
    }
    return out;
  }
  click(o) {
    for (const c of this.allClips()) c.looped = false;
    const conds = (bits) => { if (!o.isButton) return; for (const c of o.def.conds || []) if (c.b0 & bits) this.safe(() => this.exec(c.bytes, this.timelineCtx(o.parentClip), this.version)); };
    conds(0x01); this.fireEvent(o, "rollOver"); this.runQueue();
    for (const c of this.allClips()) if (c.isClip) this.fireClipActions(c, "mouseDown");
    for (const l of this.mouseListeners) { const f = l?.get?.("onMouseDown"); if (f instanceof ASFunction) this.safe(() => this.callFn(f, l, [])); }
    conds(0x04); this.fireEvent(o, "press"); this.runQueue();
    for (const c of this.allClips()) if (c.isClip) this.fireClipActions(c, "mouseUp");
    for (const l of this.mouseListeners) { const f = l?.get?.("onMouseUp"); if (f instanceof ASFunction) this.safe(() => this.callFn(f, l, [])); }
    conds(0x08); this.fireEvent(o, "release"); this.runQueue();
    conds(0x02); this.fireEvent(o, "rollOut"); this.runQueue();
  }
}
