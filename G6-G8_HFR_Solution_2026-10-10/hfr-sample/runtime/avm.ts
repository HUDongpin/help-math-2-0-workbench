// HFR runtime · ActionScript 1/2 object model, coercions and the reference
// bytecode interpreter. Generated TypeScript pages run on the same object
// model; the interpreter is kept to verify the translation (differential test).
/* eslint-disable @typescript-eslint/no-explicit-any */

export const NOTFOUND: unique symbol = Symbol("notfound");
type Found = any | typeof NOTFOUND;

interface PropEntry { n: string; v?: any; getter?: ASFunction | null; setter?: ASFunction | null; dontEnum?: boolean; perm?: boolean; ro?: boolean }

export class ASObject {
  rt: AVM1; proto: ASObject | null; props = new Map<string, PropEntry>(); watchers: Map<string, { cb: ASFunction; data: any }> | null = null;
  isDisplay = false; isClip = false; isButton = false; isText = false;
  constructor(rt: AVM1, proto: ASObject | null = null) { this.rt = rt; this.proto = proto; }
  k(name: any): string { const s = String(name); return this.rt.ci ? s.toLowerCase() : s; }
  getProto(): ASObject | null { return this.proto; }
  getLocal(name: string, thisObj: any): Found {
    if (this.k(name) === "__proto__") return this.proto ?? undefined;
    const e = this.props.get(this.k(name));
    if (!e) return NOTFOUND;
    if (e.getter) return this.rt.callFn(e.getter, thisObj, []);
    return e.v;
  }
  hasOwn(name: string): boolean { return this.getLocal(name, this) !== NOTFOUND; }
  getWithHolder(name: string, thisObj: any = this): [any, ASObject | null] {
    let o: ASObject | null = this; let d = 0;
    while (o && d++ < 100) { const v = o.getLocal(name, thisObj); if (v !== NOTFOUND) return [v, o]; o = o.getProto(); }
    return [undefined, null];
  }
  get(name: string, thisObj: any = this): any { return this.getWithHolder(name, thisObj)[0]; }
  setLocalVirtual(_name: string, _v: any): boolean { return false; }
  set(name: string, v: any): void {
    const key = this.k(name);
    if (key === "__proto__") { this.proto = v instanceof ASObject ? v : null; return; }
    if (this.setLocalVirtual(name, v)) return;
    if (this.watchers && this.watchers.has(key)) { const w = this.watchers.get(key)!; v = this.rt.callFn(w.cb, this, [String(name), this.get(name), v, w.data]); }
    const e = this.props.get(key);
    if (e) { if (e.setter) { this.rt.callFn(e.setter, this, [v]); return; } if (e.ro) return; e.v = v; return; }
    let o = this.getProto(); let d = 0;
    while (o && d++ < 100) { const pe = o.props.get(key); if (pe && pe.setter) { this.rt.callFn(pe.setter, this, [v]); return; } o = o.getProto(); }
    this.props.set(key, { n: String(name), v });
  }
  define(name: string, v: any, flags: Partial<PropEntry> = {}): this { this.props.set(this.k(name), { n: String(name), v, ...flags }); return this; }
  delete(name: string): boolean { const e = this.props.get(this.k(name)); if (!e || e.perm) return false; this.props.delete(this.k(name)); return true; }
  ownKeys(): string[] { const out: string[] = []; for (const e of this.props.values()) if (!e.dontEnum) out.push(e.n); return out.reverse(); }
  enumKeys(): string[] {
    const seen = new Set<string>(); const out: string[] = []; let o: ASObject | null = this; let d = 0;
    while (o && d++ < 100) { for (const n of o.ownKeys()) { const kk = this.k(n); if (!seen.has(kk)) { seen.add(kk); out.push(n); } } o = o.getProto(); }
    return out;
  }
  typeOf(): string { return "object"; }
  toStringDefault(): string { return "[object Object]"; }
  targetPath(): string { return ""; }
}

export interface FnSpec { name: string; params: { name: string; reg: number }[]; body?: Uint8Array; scope?: any[]; pool?: string[] | null; df2?: boolean; regCount?: number; flags?: number; version?: number; target?: any; native?: (this: AVM1, self: any, args: any[], fn: ASFunction) => any; compiled?: (thisObj: any, args: any[], home: any) => any }
export class ASFunction extends ASObject {
  name = ""; params: { name: string; reg: number }[] = []; body?: Uint8Array; scope: any[] = []; pool: string[] | null = null; df2 = false; regCount = 0; flags = 0; version = 6; target: any;
  native?: FnSpec["native"]; compiled?: FnSpec["compiled"]; ctor?: (this: AVM1, args: any[], fn: ASFunction) => any;
  constructor(rt: AVM1, spec: FnSpec) {
    super(rt, rt.FunctionProto);
    Object.assign(this, spec);
    const proto = new ASObject(rt, rt.ObjectProto); proto.define("constructor", this, { dontEnum: true });
    this.define("prototype", proto, { dontEnum: true });
  }
  typeOf() { return "function"; }
  toStringDefault() { return "[type Function]"; }
}

export class ASArray extends ASObject {
  a: any[];
  constructor(rt: AVM1, items: any[] = []) { super(rt, rt.ArrayProto); this.a = items; }
  getLocal(name: string, thisObj: any): Found {
    const s = String(name);
    if (s === "length") return this.a.length;
    if (/^\d+$/.test(s)) { const i = +s; return i < this.a.length ? this.a[i] : NOTFOUND; }
    return super.getLocal(name, thisObj);
  }
  setLocalVirtual(name: string, v: any): boolean {
    const s = String(name);
    if (s === "length") { const n = Math.max(0, this.rt.toInt(v)); if (n < this.a.length) this.a.length = n; else while (this.a.length < n) this.a.push(undefined); return true; }
    if (/^\d+$/.test(s)) { const i = +s; while (this.a.length < i) this.a.push(undefined); this.a[i] = v; return true; }
    return false;
  }
  ownKeys(): string[] { return [...super.ownKeys(), ...this.a.map((_, i) => String(i)).reverse()]; }
  toStringDefault(): string { return this.a.map((x) => (x === undefined ? "" : x === null ? "null" : this.rt.toStr(x))).join(","); }
}

export class SuperObject extends ASObject {
  thisObj: any; base: ASObject | null;
  constructor(rt: AVM1, thisObj: any, base: ASObject | null) { super(rt, null); this.thisObj = thisObj; this.base = base; }
  getLocal(): Found { return NOTFOUND; }
}

export interface Ctx { scope: any[]; target: any; origTarget: any; thisObj: any; regs: any[]; pool: string[] | null; fn: ASFunction | null; home?: any; withStack?: Ctx[] }

// ---------------------------------------------------------------- byte helpers
const u16 = (b: Uint8Array, p: number) => b[p] | (b[p + 1] << 8);
const s16 = (b: Uint8Array, p: number) => (u16(b, p) << 16) >> 16;
const s32 = (b: Uint8Array, p: number) => b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24);
const f32 = (b: Uint8Array, p: number) => new DataView(b.buffer, b.byteOffset + p, 4).getFloat32(0, true);
function f64swap(b: Uint8Array, p: number) { const t = new Uint8Array(8); t.set(b.subarray(p + 4, p + 8), 0); t.set(b.subarray(p, p + 4), 4); return new DataView(t.buffer).getFloat64(0, true); }
function cstr(b: Uint8Array, p: number): [string, number] { let e = p; while (e < b.length && b[e]) e++; let s = ""; for (let i = p; i < e; i++) s += String.fromCharCode(b[i]); return [s, e + 1]; }

export const OPNAMES: Record<number, string> = { 0x04: "NextFrame", 0x05: "PreviousFrame", 0x06: "Play", 0x07: "Stop", 0x09: "StopSounds", 0x0a: "Add", 0x0b: "Subtract", 0x0c: "Multiply", 0x0d: "Divide", 0x0e: "Equals", 0x0f: "Less", 0x10: "And", 0x11: "Or", 0x12: "Not", 0x13: "StringEquals", 0x14: "StringLength", 0x15: "StringExtract", 0x17: "Pop", 0x18: "ToInteger", 0x1c: "GetVariable", 0x1d: "SetVariable", 0x20: "SetTarget2", 0x21: "StringAdd", 0x22: "GetProperty", 0x23: "SetProperty", 0x24: "CloneSprite", 0x25: "RemoveSprite", 0x26: "Trace", 0x27: "StartDrag", 0x28: "EndDrag", 0x29: "StringLess", 0x30: "RandomNumber", 0x34: "GetTime", 0x3a: "Delete", 0x3b: "Delete2", 0x3c: "DefineLocal", 0x3d: "CallFunction", 0x3e: "Return", 0x3f: "Modulo", 0x40: "NewObject", 0x41: "DefineLocal2", 0x42: "InitArray", 0x43: "InitObject", 0x44: "TypeOf", 0x45: "TargetPath", 0x46: "Enumerate", 0x47: "Add2", 0x48: "Less2", 0x49: "Equals2", 0x4a: "ToNumber", 0x4b: "ToString", 0x4c: "PushDuplicate", 0x4d: "StackSwap", 0x4e: "GetMember", 0x4f: "SetMember", 0x50: "Increment", 0x51: "Decrement", 0x52: "CallMethod", 0x53: "NewMethod", 0x54: "InstanceOf", 0x55: "Enumerate2", 0x60: "BitAnd", 0x61: "BitOr", 0x62: "BitXor", 0x63: "BitLShift", 0x64: "BitRShift", 0x65: "BitURShift", 0x66: "StrictEquals", 0x67: "Greater", 0x68: "StringGreater", 0x81: "GotoFrame", 0x83: "GetURL", 0x87: "StoreRegister", 0x88: "ConstantPool", 0x8a: "WaitForFrame", 0x8b: "SetTarget", 0x8c: "GoToLabel", 0x8d: "WaitForFrame2", 0x8e: "DefineFunction2", 0x94: "With", 0x96: "Push", 0x99: "Jump", 0x9a: "GetURL2", 0x9b: "DefineFunction", 0x9d: "If", 0x9e: "Call", 0x9f: "GotoFrame2" };

export const PROPS = ["_x", "_y", "_xscale", "_yscale", "_currentframe", "_totalframes", "_alpha", "_visible", "_width", "_height", "_rotation", "_target", "_framesloaded", "_name", "_droptarget", "_url", "_highquality", "_focusrect", "_soundbuftime", "_quality", "_xmouse", "_ymouse"];

export abstract class AVM1 {
  ci = true; version = 6; opsExecuted = 0; opBudget = 60_000_000; callDepth = 0; timeMs = 0; lastUndefined = "";
  ObjectProto!: ASObject; FunctionProto!: ASObject; ArrayProto!: ASObject; StringProto!: ASObject; NumberProto!: ASObject; BooleanProto!: ASObject; Global!: ASObject;
  abstract levelRoot(t?: any): any; abstract defaultTarget(): any; abstract host(kind: string, args: any[]): void; abstract note(kind: string, detail: string): void;
  abstract noteMissingCall(obj: any, name: string, ctx: Ctx | null): void; abstract random(): number;

  // ---- coercions (SWF-version aware)
  toPrim(v: any, hint?: string): any {
    if (!(v instanceof ASObject)) return v;
    if (v.isClip) return v.targetPath();
    const f = v.get(hint === "string" ? "toString" : "valueOf");
    if (f instanceof ASFunction) { const r = this.callFn(f, v, []); if (!(r instanceof ASObject)) return r; }
    const f2 = v.get(hint === "string" ? "valueOf" : "toString");
    if (f2 instanceof ASFunction) { const r = this.callFn(f2, v, []); if (!(r instanceof ASObject)) return r; }
    return v.toStringDefault();
  }
  toNum(v: any): number {
    if (typeof v === "number") return v;
    if (v === undefined || v === null) return this.version >= 7 ? NaN : 0;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "string") { const s = v.trim(); if (s === "") return NaN; if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16); return Number(s); }
    if (v instanceof ASObject) return this.toNum(this.toPrim(v, "number"));
    return NaN;
  }
  toInt(v: any): number { const n = this.toNum(v); return Number.isFinite(n) ? Math.trunc(n) : 0; }
  toI32(v: any): number { return this.toNum(v) | 0; }
  numStr(n: number): string {
    if (Number.isNaN(n)) return "NaN"; if (n === Infinity) return "Infinity"; if (n === -Infinity) return "-Infinity";
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    return Number(n.toPrecision(15)).toString();
  }
  toStr(v: any): string {
    if (typeof v === "string") return v;
    if (v === undefined) return this.version >= 7 ? "undefined" : "";
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return this.numStr(v);
    if (v instanceof ASObject) { const p = this.toPrim(v, "string"); return typeof p === "string" ? p : this.toStr(p); }
    return String(v);
  }
  toBool(v: any): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return !Number.isNaN(v) && v !== 0;
    if (typeof v === "string") { if (this.version >= 7) return v.length > 0; const n = this.toNum(v); return !Number.isNaN(n) && n !== 0; }
    if (v === undefined || v === null) return false;
    return true;
  }
  typeOf(v: any): string {
    if (v === undefined) return "undefined"; if (v === null) return "null";
    if (typeof v === "string") return "string"; if (typeof v === "number") return "number"; if (typeof v === "boolean") return "boolean";
    if (v instanceof ASObject) return v.typeOf();
    return "object";
  }
  equals2(a: any, b: any): boolean {
    if ((a === undefined || a === null) && (b === undefined || b === null)) return true;
    if (a === undefined || a === null || b === undefined || b === null) return false;
    if (a instanceof ASObject && b instanceof ASObject) return a === b;
    const ta = this.typeOf(a), tb = this.typeOf(b);
    if (ta === tb && !(a instanceof ASObject)) return a === b;
    if (a instanceof ASObject) return this.equals2(this.toPrim(a), b);
    if (b instanceof ASObject) return this.equals2(a, this.toPrim(b));
    if (ta === "boolean") return this.equals2(a ? 1 : 0, b);
    if (tb === "boolean") return this.equals2(a, b ? 1 : 0);
    return this.toNum(a) === this.toNum(b);
  }
  strictEquals(a: any, b: any): boolean { return this.typeOf(a) === this.typeOf(b) && a === b; }
  less2(a: any, b: any): boolean | undefined {
    const pa = this.toPrim(a, "number"), pb = this.toPrim(b, "number");
    if (typeof pa === "string" && typeof pb === "string") return pa < pb;
    const na = this.toNum(pa), nb = this.toNum(pb);
    if (Number.isNaN(na) || Number.isNaN(nb)) return undefined;
    return na < nb;
  }
  add2(a: any, b: any): any {
    const pa = this.toPrim(a), pb = this.toPrim(b);
    if (typeof pa === "string" || typeof pb === "string") return this.toStr(pa) + this.toStr(pb);
    return this.toNum(pa) + this.toNum(pb);
  }
  k(name: any): string { const s = String(name); return this.ci ? s.toLowerCase() : s; }

  // ---- members
  getMember(obj: any, name: string): any {
    if (obj instanceof ASObject) return obj.get(name, obj);
    if (typeof obj === "string") { if (this.k(name) === "length") return obj.length; return this.StringProto.get(name, obj); }
    if (typeof obj === "number") return this.NumberProto.get(name, obj);
    if (typeof obj === "boolean") return this.BooleanProto.get(name, obj);
    return undefined;
  }
  getMemberWithHolder(obj: any, name: string): [any, ASObject | null] {
    if (obj instanceof SuperObject) return obj.base ? obj.base.getWithHolder(name, obj.thisObj) : [undefined, null];
    if (obj instanceof ASObject) return obj.getWithHolder(name, obj);
    return [this.getMember(obj, name), null];
  }
  setMember(obj: any, name: string, v: any): void { if (obj instanceof ASObject) obj.set(name, v); }

  // ---- calls
  callFn(fn: any, thisObj: any, args: any[], home: any = null): any {
    if (!(fn instanceof ASFunction)) return undefined;
    if (fn.native) return fn.native.call(this, thisObj, args, fn);
    if (fn.compiled) {
      if (++this.callDepth > 200) { this.callDepth--; throw new Error("AVM1 recursion limit"); }
      try { return fn.compiled(thisObj, args, home); } finally { this.callDepth--; }
    }
    return this.runFunction(fn, thisObj, args, home);
  }
  construct(fn: any, args: any[]): any {
    if (!(fn instanceof ASFunction)) return undefined;
    if (fn.ctor) { const r = fn.ctor.call(this, args, fn); if (r !== undefined) return r; }
    const proto = fn.get("prototype");
    const obj = new ASObject(this, proto instanceof ASObject ? proto : this.ObjectProto);
    obj.define("__constructor__", fn, { dontEnum: true }); obj.define("constructor", fn, { dontEnum: true });
    const r = this.callFn(fn, obj, args, proto instanceof ASObject ? proto : null);
    return r instanceof ASObject && fn.native ? r : obj;
  }
  makeArgs(args: any[], fn: ASFunction, caller?: any): ASArray {
    const a = new ASArray(this, args.slice()); a.define("callee", fn, { dontEnum: true }); a.define("caller", caller ?? null, { dontEnum: true }); return a;
  }
  superFor(thisObj: any, home: any): SuperObject {
    return home && home.getProto ? new SuperObject(this, thisObj, home.getProto()) : new SuperObject(this, thisObj, thisObj instanceof ASObject && thisObj.getProto() ? thisObj.getProto()!.getProto() : null);
  }
  /** Activation + registers for a call (shared by interpreted and compiled functions). */
  prepareCall(fn: ASFunction, thisObj: any, args: any[], home: any) {
    const act = new ASObject(this, null);
    const regs = new Array(Math.max(4, fn.regCount || 0)).fill(undefined);
    const targetClip = fn.target && !fn.target.removed ? fn.target : this.defaultTarget();
    const ctx: Ctx = { scope: [...fn.scope, act], target: targetClip, origTarget: targetClip, thisObj: thisObj ?? undefined, regs, pool: fn.pool, fn, home };
    const superObj = this.superFor(thisObj, home);
    if (fn.df2) {
      let r = 1; const f = fn.flags;
      if (f & 0x0001) regs[r++] = thisObj;
      if (f & 0x0004) regs[r++] = this.makeArgs(args, fn);
      if (f & 0x0010) regs[r++] = superObj;
      if (f & 0x0040) regs[r++] = this.levelRoot(targetClip);
      if (f & 0x0080) regs[r++] = targetClip?.parentClip ?? undefined;
      if (f & 0x0100) regs[r++] = this.Global;
      if (!(f & 0x0008) && !(f & 0x0004)) act.define("arguments", this.makeArgs(args, fn), { dontEnum: true });
      if (!(f & 0x0002) && !(f & 0x0001)) act.define("this", thisObj, { dontEnum: true });
      if (!(f & 0x0020) && !(f & 0x0010)) act.define("super", superObj, { dontEnum: true });
      fn.params.forEach((p, i) => { if (p.reg) regs[p.reg] = args[i]; else act.define(p.name, args[i]); });
    } else {
      act.define("arguments", this.makeArgs(args, fn), { dontEnum: true });
      act.define("this", thisObj, { dontEnum: true });
      act.define("super", superObj, { dontEnum: true });
      fn.params.forEach((p, i) => act.define(p.name, args[i]));
    }
    return { ctx, act };
  }
  runFunction(fn: ASFunction, thisObj: any, args: any[], home: any): any {
    if (++this.callDepth > 200) { this.callDepth--; throw new Error("AVM1 recursion limit"); }
    try { const { ctx } = this.prepareCall(fn, thisObj, args, home); return this.exec(fn.body!, ctx, fn.version); } finally { this.callDepth--; }
  }

  // ---- scope / variables
  findScopeVar(ctx: Ctx, name: string): [boolean, any] {
    const key = this.k(name);
    if (key === "this") return [true, ctx.thisObj !== undefined ? ctx.thisObj : ctx.target];
    if (key === "_global") return [true, this.Global];
    if (key === "_root" || key === "_level0") return [true, this.levelRoot(ctx.target)];
    if (/^_level\d+$/.test(key)) return [true, undefined];
    for (let i = ctx.scope.length - 1; i >= 0; i--) {
      const s = ctx.scope[i] === "TARGET" ? ctx.target : ctx.scope[i];
      if (!s) continue;
      const [v, holder] = s.getWithHolder(name, s);
      if (holder) return [true, v];
    }
    return [false, undefined];
  }
  getVariable(ctx: Ctx, name: string): any {
    name = String(name);
    if (name.includes(":")) { const i = name.lastIndexOf(":"); const tgt = this.resolvePath(ctx, name.slice(0, i)); return tgt instanceof ASObject ? tgt.get(name.slice(i + 1)) : undefined; }
    if (name.includes("/")) return this.resolvePath(ctx, name);
    if (name.includes(".")) { const parts = name.split("."); let v = this.findScopeVar(ctx, parts[0])[1]; for (let i = 1; i < parts.length && v !== undefined; i++) v = this.getMember(v, parts[i]); return v; }
    return this.findScopeVar(ctx, name)[1];
  }
  setVariable(ctx: Ctx, name: string, v: any): void {
    name = String(name);
    if (name.includes(":") || (name.includes(".") && !name.startsWith("."))) {
      let tgtPath: string, vname: string;
      if (name.includes(":")) { const i = name.lastIndexOf(":"); tgtPath = name.slice(0, i); vname = name.slice(i + 1); } else { const i = name.lastIndexOf("."); tgtPath = name.slice(0, i); vname = name.slice(i + 1); }
      const tgt = name.includes(":") ? this.resolvePath(ctx, tgtPath) : this.getVariable(ctx, tgtPath);
      if (tgt instanceof ASObject) tgt.set(vname, v);
      return;
    }
    for (let i = ctx.scope.length - 1; i >= 0; i--) {
      const s = ctx.scope[i] === "TARGET" ? ctx.target : ctx.scope[i];
      if (!s || s === this.Global) continue;
      if (s.hasOwn(name)) { s.set(name, v); return; }
    }
    if (this.Global.hasOwn(name)) { this.Global.set(name, v); return; }
    (ctx.target ?? this.defaultTarget()).set(name, v);
  }
  resolvePath(ctx: Ctx, path: string): any {
    path = String(path); let cur = ctx.target;
    if (path === "") return cur;
    if (path.includes(".") && !path.includes("/")) {
      const parts = path.split("."); const f = this.findScopeVar(ctx, parts[0]); let v = f[0] ? f[1] : cur?.get(parts[0]);
      for (let i = 1; i < parts.length && v !== undefined; i++) v = this.getMember(v, parts[i]);
      return v;
    }
    if (path.startsWith("/")) { cur = this.levelRoot(cur); path = path.slice(1); }
    for (const seg of path.split("/")) {
      if (!cur) return undefined;
      if (seg === "") continue;
      if (seg === "..") { cur = cur.parentClip; continue; }
      const k = this.k(seg);
      if (k === "_root" || k === "_level0") { cur = this.levelRoot(cur); continue; }
      if (k === "_parent") { cur = cur.parentClip; continue; }
      if (k === "this") continue;
      const v = cur.get(seg); cur = v instanceof ASObject ? v : undefined;
    }
    return cur;
  }
  localScope(ctx: Ctx): ASObject {
    const s = ctx.scope[ctx.scope.length - 1];
    if (ctx.fn && s instanceof ASObject) return s;
    return ctx.target ?? this.defaultTarget();
  }
  clipOf(ctx: Ctx): any { return ctx.target?.isClip ? ctx.target : null; }
  targetOf(ctx: Ctx, t: any): any {
    if (t instanceof ASObject) return t.isDisplay ? t : null;
    const s = this.toStr(t); if (s === "") return ctx.target;
    const r = this.resolvePath(ctx, s); return r?.isDisplay ? r : null;
  }
  retarget(ctx: Ctx, t: any): Ctx {
    if (t === "" || t === undefined) return { ...ctx, target: ctx.origTarget };
    const r = t instanceof ASObject ? t : this.resolvePath({ ...ctx, target: ctx.origTarget }, this.toStr(t));
    if (r?.isClip) return { ...ctx, target: r };
    this.note("setTargetMissing", this.toStr(t));
    return ctx;
  }
  instanceOf(o: any, ctor: any): boolean {
    if (!(o instanceof ASObject) || !(ctor instanceof ASFunction)) return false;
    const proto = ctor.get("prototype"); let p = o.getProto(); let d = 0;
    while (p && d++ < 100) { if (p === proto) return true; p = p.getProto(); }
    return false;
  }
  gotoFrameExpr(ctx: Ctx, f: any, play: boolean, bias = 0): void {
    if (typeof f === "number") { this.clipOf(ctx)?.gotoCmd(this.toInt(f) + bias, play); return; }
    let s = this.toStr(f); let clip = this.clipOf(ctx);
    if (s.includes(":")) { const i = s.lastIndexOf(":"); clip = this.resolvePath(ctx, s.slice(0, i)); s = s.slice(i + 1); }
    if (/^\d+$/.test(s)) clip?.gotoCmd?.(+s + bias, play); else clip?.gotoLabelCmd?.(s, play);
  }

  // ---- reference interpreter (verification oracle)
  exec(bytes: Uint8Array, ctx: Ctx, version: number): any {
    const stack: any[] = []; const pop = () => (stack.length ? stack.pop() : undefined);
    const popArgs = () => { let n = this.toInt(pop()); if (n < 0 || n > 1000) n = 0; const a: any[] = []; for (let i = 0; i < n; i++) a.push(pop()); return a; };
    const withs: { end: number; len: number }[] = []; let pc = 0; const end = bytes.length; let localOps = 0;
    while (pc < end) {
      while (withs.length && pc >= withs[withs.length - 1].end) { const w = withs.pop()!; ctx.scope.length = w.len; }
      const code = bytes[pc]; let len = 0; let p = pc + 1;
      if (code === 0) break;
      if (code >= 0x80) { len = u16(bytes, p); p += 2; }
      const next = p + len;
      if (++this.opsExecuted > this.opBudget) throw new Error("AVM1 op budget exceeded");
      if (++localOps > 8_000_000) throw new Error("AVM1 script timeout (action block)");
      switch (code) {
        case 0x04: this.clipOf(ctx)?.nextFrameCmd(); break;
        case 0x05: this.clipOf(ctx)?.prevFrameCmd(); break;
        case 0x06: this.clipOf(ctx)?.playCmd(); break;
        case 0x07: this.clipOf(ctx)?.stopCmd(); break;
        case 0x09: this.host("stopAllSounds", []); break;
        case 0x0a: { const b = pop(), a = pop(); stack.push(this.toNum(a) + this.toNum(b)); break; }
        case 0x0b: { const b = pop(), a = pop(); stack.push(this.toNum(a) - this.toNum(b)); break; }
        case 0x0c: { const b = pop(), a = pop(); stack.push(this.toNum(a) * this.toNum(b)); break; }
        case 0x0d: { const b = pop(), a = pop(); stack.push(this.toNum(a) / this.toNum(b)); break; }
        case 0x0e: { const b = pop(), a = pop(); stack.push(this.toNum(a) === this.toNum(b)); break; }
        case 0x0f: { const b = pop(), a = pop(); stack.push(this.toNum(a) < this.toNum(b)); break; }
        case 0x10: { const b = pop(), a = pop(); stack.push(this.toBool(a) && this.toBool(b)); break; }
        case 0x11: { const b = pop(), a = pop(); stack.push(this.toBool(a) || this.toBool(b)); break; }
        case 0x12: stack.push(!this.toBool(pop())); break;
        case 0x13: { const b = pop(), a = pop(); stack.push(this.toStr(a) === this.toStr(b)); break; }
        case 0x14: stack.push(this.toStr(pop()).length); break;
        case 0x15: { const cnt = this.toInt(pop()), idx = this.toInt(pop()), s = this.toStr(pop()); stack.push(s.substr(Math.max(0, idx - 1), Math.max(0, cnt))); break; }
        case 0x17: pop(); break;
        case 0x18: stack.push(this.toInt(pop())); break;
        case 0x1c: { const n = this.toStr(pop()); const v = this.getVariable(ctx, n); if (v === undefined) this.lastUndefined = n; stack.push(v); break; }
        case 0x1d: { const v = pop(); const n = this.toStr(pop()); this.setVariable(ctx, n, v); break; }
        case 0x20: { const t = pop(); Object.assign(ctx, this.retarget(ctx, t)); break; }
        case 0x21: { const b = pop(), a = pop(); stack.push(this.toStr(a) + this.toStr(b)); break; }
        case 0x22: { const idx = this.toInt(pop()); const t = pop(); const clip = this.targetOf(ctx, t); stack.push(clip ? clip.getPropIndex(idx) : undefined); break; }
        case 0x23: { const v = pop(); const idx = this.toInt(pop()); const t = pop(); const clip = this.targetOf(ctx, t); if (clip) clip.setPropIndex(idx, v); break; }
        case 0x24: { const depth = this.toInt(pop()); const tgt = this.toStr(pop()); const src = this.targetOf(ctx, pop()); if (src?.duplicate) src.duplicate(tgt, depth); break; }
        case 0x25: { const t = this.targetOf(ctx, pop()); if (t?.removeCmd) t.removeCmd(); break; }
        case 0x26: this.host("trace", [this.toStr(pop())]); break;
        case 0x27: { const t = pop(); const lock = this.toBool(pop()); const c = this.toBool(pop()); let rect: number[] | null = null; if (c) { const y2 = pop(), x2 = pop(), y1 = pop(), x1 = pop(); rect = [x1, y1, x2, y2].map((v) => this.toNum(v)); } this.startDragTarget(this.targetOf(ctx, t), lock, rect); break; }
        case 0x28: this.stopDragAll(); break;
        case 0x29: { const b = pop(), a = pop(); stack.push(this.toStr(a) < this.toStr(b)); break; }
        case 0x30: { const max = this.toInt(pop()); stack.push(max > 0 ? Math.floor(this.random() * max) : 0); break; }
        case 0x34: stack.push(Math.floor(this.timeMs)); break;
        case 0x3a: { const n = pop(); const o = pop(); stack.push(o instanceof ASObject ? o.delete(this.toStr(n)) : false); break; }
        case 0x3b: { const n = this.toStr(pop()); stack.push(this.deleteVar(ctx, n)); break; }
        case 0x3c: { const v = pop(); const n = this.toStr(pop()); this.localScope(ctx).define(n, v); break; }
        case 0x41: { const n = this.toStr(pop()); const s = this.localScope(ctx); if (!s.hasOwn(n)) s.define(n, undefined); break; }
        case 0x3d: { const name = this.toStr(pop()); const args = popArgs(); const f = this.getVariable(ctx, name); if (f instanceof ASFunction) stack.push(this.callFn(f, ctx.target, args)); else { this.noteMissingCall(null, name, ctx); stack.push(undefined); } break; }
        case 0x3e: return pop();
        case 0x3f: { const b = pop(), a = pop(); stack.push(this.toNum(a) % this.toNum(b)); break; }
        case 0x40: { const name = this.toStr(pop()); const args = popArgs(); const f = this.getVariable(ctx, name); if (f instanceof ASFunction) stack.push(this.construct(f, args)); else { this.noteMissingCall(null, "new " + name, ctx); stack.push(undefined); } break; }
        case 0x42: { const n = this.toInt(pop()); const a: any[] = []; for (let i = 0; i < n; i++) a.push(pop()); stack.push(new ASArray(this, a)); break; }
        case 0x43: { const n = this.toInt(pop()); const o = new ASObject(this, this.ObjectProto); for (let i = 0; i < n; i++) { const v = pop(); const kk = this.toStr(pop()); o.set(kk, v); } stack.push(o); break; }
        case 0x44: stack.push(this.typeOf(pop())); break;
        case 0x45: { const o = pop(); stack.push(o?.isClip ? o.targetPath() : undefined); break; }
        case 0x46: { const n = this.toStr(pop()); const o = this.getVariable(ctx, n); stack.push(null); if (o instanceof ASObject) for (const kk of o.enumKeys().reverse()) stack.push(kk); break; }
        case 0x55: { const o = pop(); stack.push(null); if (o instanceof ASObject) for (const kk of o.enumKeys().reverse()) stack.push(kk); break; }
        case 0x47: { const b = pop(), a = pop(); stack.push(this.add2(a, b)); break; }
        case 0x48: { const b = pop(), a = pop(); stack.push(this.less2(a, b)); break; }
        case 0x67: { const b = pop(), a = pop(); stack.push(this.less2(b, a)); break; }
        case 0x49: { const b = pop(), a = pop(); stack.push(this.equals2(a, b)); break; }
        case 0x66: { const b = pop(), a = pop(); stack.push(this.strictEquals(a, b)); break; }
        case 0x4a: stack.push(this.toNum(pop())); break;
        case 0x4b: stack.push(this.toStr(pop())); break;
        case 0x4c: { const v = stack.length ? stack[stack.length - 1] : undefined; stack.push(v); break; }
        case 0x4d: { const b = pop(), a = pop(); stack.push(b, a); break; }
        case 0x4e: { const n = pop(); const o = pop(); const v = this.getMember(o, this.toStr(n)); if (v === undefined) this.lastUndefined = this.toStr(n); stack.push(v); break; }
        case 0x4f: { const v = pop(); const n = this.toStr(pop()); const o = pop(); this.setMember(o, n, v); break; }
        case 0x50: stack.push(this.toNum(pop()) + 1); break;
        case 0x51: stack.push(this.toNum(pop()) - 1); break;
        case 0x52: { const m = pop(); const o = pop(); const args = popArgs(); stack.push(this.callMethod(o, m, args, ctx)); break; }
        case 0x53: { const m = pop(); const o = pop(); const args = popArgs(); const f = m === undefined || m === "" ? o : this.getMember(o, this.toStr(m)); stack.push(f instanceof ASFunction ? this.construct(f, args) : undefined); break; }
        case 0x54: { const c = pop(); const o = pop(); stack.push(this.instanceOf(o, c)); break; }
        case 0x60: { const b = pop(), a = pop(); stack.push(this.toI32(a) & this.toI32(b)); break; }
        case 0x61: { const b = pop(), a = pop(); stack.push(this.toI32(a) | this.toI32(b)); break; }
        case 0x62: { const b = pop(), a = pop(); stack.push(this.toI32(a) ^ this.toI32(b)); break; }
        case 0x63: { const b = pop(), a = pop(); stack.push(this.toI32(a) << (this.toI32(b) & 31)); break; }
        case 0x64: { const b = pop(), a = pop(); stack.push(this.toI32(a) >> (this.toI32(b) & 31)); break; }
        case 0x65: { const b = pop(), a = pop(); stack.push(this.toI32(a) >>> (this.toI32(b) & 31)); break; }
        case 0x68: { const b = pop(), a = pop(); stack.push(this.toStr(a) > this.toStr(b)); break; }
        case 0x81: this.clipOf(ctx)?.gotoCmd(u16(bytes, p) + 1, false); break;
        case 0x83: { const [url, q] = cstr(bytes, p); this.host("getURL", [url, cstr(bytes, q)[0]]); break; }
        case 0x87: ctx.regs[bytes[p]] = stack.length ? stack[stack.length - 1] : undefined; break;
        case 0x88: { const n = u16(bytes, p); let q = p + 2; const pool: string[] = []; for (let i = 0; i < n; i++) { const [s, q2] = cstr(bytes, q); pool.push(s); q = q2; } ctx.pool = pool; break; }
        case 0x8a: case 0x8d: if (code === 0x8d) pop(); break;
        case 0x8b: { Object.assign(ctx, this.retarget(ctx, cstr(bytes, p)[0])); break; }
        case 0x8c: this.clipOf(ctx)?.gotoLabelCmd(cstr(bytes, p)[0], false); break;
        case 0x8e: case 0x9b: {
          let q = p; const [name, q1] = cstr(bytes, q); q = q1; const np = u16(bytes, q); q += 2;
          let regCount = 0, flags = 0; const params: { name: string; reg: number }[] = [];
          if (code === 0x8e) { regCount = bytes[q]; const f = (bytes[q + 1] << 8) | bytes[q + 2]; flags = ((f >> 8) & 0xff) | ((f & 1) << 8); q += 3; }
          for (let i = 0; i < np; i++) { let reg = 0; if (code === 0x8e) reg = bytes[q++]; const [pn, q2] = cstr(bytes, q); params.push({ reg, name: pn }); q = q2; }
          const size = u16(bytes, q);
          const fn = new ASFunction(this, { name, params, body: bytes.subarray(next, next + size), scope: ctx.scope.map((s) => (s === "TARGET" ? ctx.target : s)), pool: ctx.pool, df2: code === 0x8e, regCount, flags, version, target: ctx.target });
          if (name) { if (ctx.fn) this.localScope(ctx).define(name, fn); else (ctx.target ?? this.defaultTarget()).set(name, fn); } else stack.push(fn);
          pc = next + size; continue;
        }
        case 0x94: { const size = u16(bytes, p); const o = pop(); withs.push({ end: next + size, len: ctx.scope.length }); ctx.scope.push(o instanceof ASObject ? o : new ASObject(this, null)); break; }
        case 0x96: {
          let q = p;
          while (q < next) {
            const t = bytes[q++];
            switch (t) {
              case 0: { const [s, q2] = cstr(bytes, q); stack.push(s); q = q2; break; }
              case 1: stack.push(f32(bytes, q)); q += 4; break;
              case 2: stack.push(null); break;
              case 3: stack.push(undefined); break;
              case 4: stack.push(ctx.regs[bytes[q]]); q++; break;
              case 5: stack.push(bytes[q] !== 0); q++; break;
              case 6: stack.push(f64swap(bytes, q)); q += 8; break;
              case 7: stack.push(s32(bytes, q)); q += 4; break;
              case 8: stack.push(ctx.pool?.[bytes[q]]); q++; break;
              case 9: stack.push(ctx.pool?.[u16(bytes, q)]); q += 2; break;
              default: throw new Error("bad push type " + t);
            }
          }
          break;
        }
        case 0x99: pc = next + s16(bytes, p); continue;
        case 0x9d: if (this.toBool(pop())) { pc = next + s16(bytes, p); continue; } break;
        case 0x9a: { const target = this.toStr(pop()); const url = this.toStr(pop()); this.host("getURL", [url, target, bytes[p]]); break; }
        case 0x9e: this.host("callFrame", [this.toStr(pop())]); break;
        case 0x9f: { const flags = bytes[p]; this.gotoFrameExpr(ctx, pop(), !!(flags & 1), flags & 2 ? u16(bytes, p + 1) : 0); break; }
        default: throw new Error("unimplemented opcode 0x" + code.toString(16) + " " + (OPNAMES[code] || ""));
      }
      pc = next;
    }
    return undefined;
  }
  callMethod(o: any, m: any, args: any[], ctx: Ctx | null): any {
    if (m === undefined || m === null || m === "") {
      if (o instanceof SuperObject) { const c = o.base?.get("__constructor__") ?? o.base?.get("constructor"); return this.callFn(c, o.thisObj, args, o.base); }
      if (o instanceof ASFunction) return this.callFn(o, undefined, args);
      return undefined;
    }
    const name = this.toStr(m); const [f, holder] = this.getMemberWithHolder(o, name);
    const thisObj = o instanceof SuperObject ? o.thisObj : o;
    if (f instanceof ASFunction) return this.callFn(f, thisObj, args, holder);
    this.noteMissingCall(o, name, ctx); return undefined;
  }
  deleteVar(ctx: Ctx, n: string): boolean {
    for (let i = ctx.scope.length - 1; i >= 0; i--) { const s = ctx.scope[i] === "TARGET" ? ctx.target : ctx.scope[i]; if (s instanceof ASObject && s.hasOwn(n)) return s.delete(n); }
    return false;
  }
  startDragTarget(_t: any, _lock: boolean, _rect: number[] | null): void { this.host("startDrag", []); }
  stopDragAll(): void { this.host("stopDrag", []); }
}
