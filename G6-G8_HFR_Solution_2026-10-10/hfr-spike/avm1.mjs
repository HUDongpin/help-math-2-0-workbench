// HFR feasibility spike: AVM1 object model, coercions and bytecode interpreter.
// Scope: the 65 opcodes observed in the G6-G8 corpus plus close relatives.
export const NOTFOUND = Symbol("notfound");

export class ASObject {
  constructor(rt, proto = null) { this.rt = rt; this.proto = proto; this.props = new Map(); this.watchers = null; }
  k(name) { name = String(name); return this.rt.ci ? name.toLowerCase() : name; }
  getProto() { return this.proto; }
  // Own (local) lookup. Subclasses add virtual properties and children.
  getLocal(name, thisObj) {
    if (this.k(name) === "__proto__") return this.proto ?? undefined;
    const e = this.props.get(this.k(name));
    if (!e) return NOTFOUND;
    if (e.getter) return this.rt.callFn(e.getter, thisObj, []);
    return e.v;
  }
  hasOwn(name) { return this.getLocal(name, this) !== NOTFOUND; }
  getWithHolder(name, thisObj = this) {
    let o = this, d = 0;
    while (o && d++ < 100) {
      const v = o.getLocal(name, thisObj);
      if (v !== NOTFOUND) return [v, o];
      o = o.getProto();
    }
    return [undefined, null];
  }
  get(name, thisObj = this) { return this.getWithHolder(name, thisObj)[0]; }
  setLocalVirtual() { return false; }
  set(name, v) {
    const key = this.k(name);
    if (key === "__proto__") { this.proto = v instanceof ASObject ? v : null; return; }
    if (this.setLocalVirtual(name, v)) return;
    if (this.watchers && this.watchers.has(key)) {
      const w = this.watchers.get(key);
      const old = this.get(name);
      v = this.rt.callFn(w.cb, this, [String(name), old, v, w.data]);
    }
    const e = this.props.get(key);
    if (e) {
      if (e.setter) { this.rt.callFn(e.setter, this, [v]); return; }
      if (e.ro) return;
      e.v = v; return;
    }
    let o = this.getProto(), d = 0;
    while (o && d++ < 100) {
      const pe = o.props.get(key);
      if (pe && pe.setter) { this.rt.callFn(pe.setter, this, [v]); return; }
      o = o.getProto();
    }
    this.props.set(key, { n: String(name), v });
  }
  define(name, v, flags = {}) { this.props.set(this.k(name), { n: String(name), v, ...flags }); return this; }
  delete(name) {
    const e = this.props.get(this.k(name));
    if (!e || e.perm) return false;
    this.props.delete(this.k(name)); return true;
  }
  ownKeys() {
    const out = [];
    for (const e of this.props.values()) if (!e.dontEnum) out.push(e.n);
    return out.reverse();
  }
  enumKeys() {
    const seen = new Set(); const out = [];
    let o = this, d = 0;
    while (o && d++ < 100) {
      for (const n of o.ownKeys()) { const kk = this.k(n); if (!seen.has(kk)) { seen.add(kk); out.push(n); } }
      o = o.getProto();
    }
    return out;
  }
  typeOf() { return "object"; }
  toStringDefault() { return "[object Object]"; }
}

export class ASFunction extends ASObject {
  constructor(rt, spec) {
    super(rt, rt.FunctionProto);
    Object.assign(this, spec); // name, params, body, scope, pool, df2, regCount, flags, native, version, target
    const proto = new ASObject(rt, rt.ObjectProto);
    proto.define("constructor", this, { dontEnum: true });
    this.define("prototype", proto, { dontEnum: true });
  }
  typeOf() { return "function"; }
  toStringDefault() { return "[type Function]"; }
}

export class ASArray extends ASObject {
  constructor(rt, items = []) { super(rt, rt.ArrayProto); this.a = items; }
  getLocal(name, thisObj) {
    const s = String(name);
    if (s === "length") return this.a.length;
    if (/^\d+$/.test(s)) { const i = +s; return i < this.a.length ? this.a[i] : NOTFOUND; }
    return super.getLocal(name, thisObj);
  }
  setLocalVirtual(name, v) {
    const s = String(name);
    if (s === "length") { const n = Math.max(0, this.rt.toInt(v)); if (n < this.a.length) this.a.length = n; else while (this.a.length < n) this.a.push(undefined); return true; }
    if (/^\d+$/.test(s)) { const i = +s; while (this.a.length < i) this.a.push(undefined); this.a[i] = v; return true; }
    return false;
  }
  ownKeys() { return [...super.ownKeys(), ...this.a.map((_, i) => String(i)).reverse()]; }
  toStringDefault() { return this.a.map((x) => (x === undefined || x === null ? (x === null ? "null" : "") : this.rt.toStr(x))).join(","); }
}

class SuperObject extends ASObject {
  constructor(rt, thisObj, base) { super(rt, null); this.thisObj = thisObj; this.base = base; }
  getLocal() { return NOTFOUND; }
}

const OPN = {0x04:"NextFrame",0x05:"PreviousFrame",0x06:"Play",0x07:"Stop",0x09:"StopSounds",0x0A:"Add",0x0B:"Subtract",0x0C:"Multiply",0x0D:"Divide",0x0E:"Equals",0x0F:"Less",0x10:"And",0x11:"Or",0x12:"Not",0x13:"StringEquals",0x14:"StringLength",0x15:"StringExtract",0x17:"Pop",0x18:"ToInteger",0x1C:"GetVariable",0x1D:"SetVariable",0x20:"SetTarget2",0x21:"StringAdd",0x22:"GetProperty",0x23:"SetProperty",0x24:"CloneSprite",0x25:"RemoveSprite",0x26:"Trace",0x27:"StartDrag",0x28:"EndDrag",0x29:"StringLess",0x30:"RandomNumber",0x34:"GetTime",0x3A:"Delete",0x3B:"Delete2",0x3C:"DefineLocal",0x3D:"CallFunction",0x3E:"Return",0x3F:"Modulo",0x40:"NewObject",0x41:"DefineLocal2",0x42:"InitArray",0x43:"InitObject",0x44:"TypeOf",0x45:"TargetPath",0x46:"Enumerate",0x47:"Add2",0x48:"Less2",0x49:"Equals2",0x4A:"ToNumber",0x4B:"ToString",0x4C:"PushDuplicate",0x4D:"StackSwap",0x4E:"GetMember",0x4F:"SetMember",0x50:"Increment",0x51:"Decrement",0x52:"CallMethod",0x53:"NewMethod",0x54:"InstanceOf",0x55:"Enumerate2",0x60:"BitAnd",0x61:"BitOr",0x62:"BitXor",0x63:"BitLShift",0x64:"BitRShift",0x65:"BitURShift",0x66:"StrictEquals",0x67:"Greater",0x68:"StringGreater",0x81:"GotoFrame",0x83:"GetURL",0x87:"StoreRegister",0x88:"ConstantPool",0x8A:"WaitForFrame",0x8B:"SetTarget",0x8C:"GoToLabel",0x8D:"WaitForFrame2",0x8E:"DefineFunction2",0x94:"With",0x96:"Push",0x99:"Jump",0x9A:"GetURL2",0x9B:"DefineFunction",0x9D:"If",0x9E:"Call",0x9F:"GotoFrame2"};
export const OPNAMES = OPN;

export class AVM1 {
  constructor() { this.ci = true; this.version = 6; this.opsExecuted = 0; this.opCoverage = new Map(); this.opBudget = 3_000_000; }

  // ---------- coercions (SWF-version aware) ----------
  isObj(v) { return v instanceof ASObject; }
  toPrim(v, hint) {
    if (!(v instanceof ASObject)) return v;
    if (v.isClip) return v.targetPath();
    const fnName = hint === "string" ? "toString" : "valueOf";
    const f = v.get(fnName);
    if (f instanceof ASFunction) {
      const r = this.callFn(f, v, []);
      if (!(r instanceof ASObject)) return r;
    }
    const f2 = v.get(hint === "string" ? "valueOf" : "toString");
    if (f2 instanceof ASFunction) { const r = this.callFn(f2, v, []); if (!(r instanceof ASObject)) return r; }
    return v.toStringDefault();
  }
  toNum(v) {
    if (typeof v === "number") return v;
    if (v === undefined || v === null) return this.version >= 7 ? NaN : 0;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "string") {
      const s = v.trim();
      if (s === "") return this.version >= 5 ? NaN : 0;
      if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16);
      const n = Number(s); return n;
    }
    if (v instanceof ASObject) return this.toNum(this.toPrim(v, "number"));
    return NaN;
  }
  toInt(v) { const n = this.toNum(v); return Number.isFinite(n) ? Math.trunc(n) : 0; }
  toI32(v) { return this.toNum(v) | 0; }
  numStr(n) {
    if (Number.isNaN(n)) return "NaN";
    if (n === Infinity) return "Infinity";
    if (n === -Infinity) return "-Infinity";
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    let s = Number(n.toPrecision(15)).toString();
    return s;
  }
  toStr(v) {
    if (typeof v === "string") return v;
    if (v === undefined) return this.version >= 7 ? "undefined" : "";
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return this.numStr(v);
    if (v instanceof ASObject) { const p = this.toPrim(v, "string"); return typeof p === "string" ? p : this.toStr(p); }
    return String(v);
  }
  toBool(v) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return !Number.isNaN(v) && v !== 0;
    if (typeof v === "string") {
      if (this.version >= 7) return v.length > 0;
      const n = this.toNum(v); return !Number.isNaN(n) && n !== 0;
    }
    if (v === undefined || v === null) return false;
    return true;
  }
  typeOf(v) {
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "string") return "string";
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "boolean";
    if (v instanceof ASObject) return v.typeOf();
    return "object";
  }
  equals2(a, b) {
    const ta = this.typeOf(a), tb = this.typeOf(b);
    if ((a === undefined || a === null) && (b === undefined || b === null)) return true;
    if (a === undefined || a === null || b === undefined || b === null) return false;
    if (a instanceof ASObject && b instanceof ASObject) return a === b;
    if (ta === tb && !(a instanceof ASObject)) {
      if (ta === "number") return a === b;
      return a === b;
    }
    if (a instanceof ASObject) return this.equals2(this.toPrim(a), b);
    if (b instanceof ASObject) return this.equals2(a, this.toPrim(b));
    if (ta === "boolean") return this.equals2(a ? 1 : 0, b);
    if (tb === "boolean") return this.equals2(a, b ? 1 : 0);
    return this.toNum(a) === this.toNum(b);
  }
  less2(a, b) {
    const pa = this.toPrim(a, "number"), pb = this.toPrim(b, "number");
    if (typeof pa === "string" && typeof pb === "string") return pa < pb;
    const na = this.toNum(pa), nb = this.toNum(pb);
    if (Number.isNaN(na) || Number.isNaN(nb)) return undefined;
    return na < nb;
  }
  add2(a, b) {
    const pa = this.toPrim(a), pb = this.toPrim(b);
    if (typeof pa === "string" || typeof pb === "string") return this.toStr(pa) + this.toStr(pb);
    return this.toNum(pa) + this.toNum(pb);
  }

  // property access on any value (boxing primitives)
  getMember(obj, name) {
    if (obj instanceof ASObject) return obj.get(name, obj);
    if (typeof obj === "string") {
      if (this.k(name) === "length") return obj.length;
      return this.StringProto.get(name, obj);
    }
    if (typeof obj === "number") return this.NumberProto.get(name, obj);
    if (typeof obj === "boolean") return this.BooleanProto.get(name, obj);
    return undefined;
  }
  getMemberWithHolder(obj, name) {
    if (obj instanceof SuperObject) return obj.base ? obj.base.getWithHolder(name, obj.thisObj) : [undefined, null];
    if (obj instanceof ASObject) return obj.getWithHolder(name, obj);
    return [this.getMember(obj, name), null];
  }
  setMember(obj, name, v) { if (obj instanceof ASObject) obj.set(name, v); }
  k(name) { name = String(name); return this.ci ? name.toLowerCase() : name; }

  // ---------- function calls ----------
  callFn(fn, thisObj, args, home = null) {
    if (!(fn instanceof ASFunction)) return undefined;
    if (fn.native) return fn.native.call(this, thisObj, args, fn);
    return this.runFunction(fn, thisObj, args, home);
  }
  construct(fn, args) {
    if (!(fn instanceof ASFunction)) return undefined;
    if (fn.ctor) { const r = fn.ctor.call(this, args, fn); if (r !== undefined) return r; }
    const proto = fn.get("prototype");
    const obj = new ASObject(this, proto instanceof ASObject ? proto : this.ObjectProto);
    obj.define("__constructor__", fn, { dontEnum: true });
    obj.define("constructor", fn, { dontEnum: true });
    const r = this.callFn(fn, obj, args, proto instanceof ASObject ? proto : null);
    return r instanceof ASObject && fn.native ? r : obj;
  }
  makeArgs(args, fn, caller) {
    const a = new ASArray(this, args.slice());
    a.define("callee", fn, { dontEnum: true });
    a.define("caller", caller ?? null, { dontEnum: true });
    return a;
  }
  runFunction(fn, thisObj, args, home) {
    if ((this.callDepth = (this.callDepth || 0) + 1) > 200) { this.callDepth--; throw new Error("AVM1 recursion limit"); }
    try {
      const act = new ASObject(this, null);
      const regs = new Array(Math.max(4, fn.regCount || 0)).fill(undefined);
      const targetClip = fn.target && !fn.target.removed ? fn.target : this.defaultTarget();
      const ctx = { scope: [...fn.scope, act], target: targetClip, origTarget: targetClip, thisObj: thisObj ?? undefined, regs, pool: fn.pool, fn, home };
      const superObj = home && home.getProto ? new SuperObject(this, thisObj, home.getProto()) : new SuperObject(this, thisObj, thisObj instanceof ASObject && thisObj.getProto() ? thisObj.getProto().getProto() : null);
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
      return this.exec(fn.body, ctx, fn.version);
    } finally { this.callDepth--; }
  }

  // ---------- scope / variables ----------
  findScopeVar(ctx, name) {
    const lname = String(name);
    const key = this.k(lname);
    if (key === "this") return [true, ctx.thisObj !== undefined ? ctx.thisObj : ctx.target];
    if (key === "_global") return [true, this.Global];
    if (key === "_root" || key === "_level0") return [true, this.levelRoot(ctx.target)];
    if (/^_level\d+$/.test(key)) return [true, key === "_level0" ? this.levelRoot(ctx.target) : undefined];
    for (let i = ctx.scope.length - 1; i >= 0; i--) {
      const s = ctx.scope[i] === "TARGET" ? ctx.target : ctx.scope[i];
      if (!s) continue;
      const [v, holder] = s.getWithHolder(lname, s);
      if (holder) return [true, v];
    }
    return [false, undefined];
  }
  getVariable(ctx, name) {
    name = String(name);
    if (name.includes(":")) {
      const i = name.lastIndexOf(":");
      const tgt = this.resolvePath(ctx, name.slice(0, i));
      return tgt instanceof ASObject ? tgt.get(name.slice(i + 1)) : undefined;
    }
    if (name.includes("/")) return this.resolvePath(ctx, name);
    if (name.includes(".")) {
      const parts = name.split(".");
      let v = this.findScopeVar(ctx, parts[0])[1];
      for (let i = 1; i < parts.length && v !== undefined; i++) v = this.getMember(v, parts[i]);
      return v;
    }
    return this.findScopeVar(ctx, name)[1];
  }
  setVariable(ctx, name, v) {
    name = String(name);
    if (name.includes(":") || (name.includes(".") && !name.startsWith("."))) {
      let tgtPath, vname;
      if (name.includes(":")) { const i = name.lastIndexOf(":"); tgtPath = name.slice(0, i); vname = name.slice(i + 1); }
      else { const i = name.lastIndexOf("."); tgtPath = name.slice(0, i); vname = name.slice(i + 1); }
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
  resolvePath(ctx, path) {
    path = String(path);
    let cur = ctx.target;
    if (path === "") return cur;
    if (path.includes(".") && !path.includes("/")) {
      const parts = path.split(".");
      let v = this.findScopeVar(ctx, parts[0]); v = v[0] ? v[1] : cur?.get(parts[0]);
      for (let i = 1; i < parts.length && v !== undefined; i++) v = this.getMember(v, parts[i]);
      return v;
    }
    if (path.startsWith("/")) { cur = this.levelRoot(cur); path = path.slice(1); }
    for (const seg of path.split("/")) {
      if (!cur) return undefined;
      if (seg === "" ) continue;
      if (seg === "..") { cur = cur.parentClip; continue; }
      const k = this.k(seg);
      if (k === "_root" || k === "_level0") { cur = this.levelRoot(cur); continue; }
      if (k === "_parent") { cur = cur.parentClip; continue; }
      if (k === "this") continue;
      const v = cur.get(seg); cur = v instanceof ASObject ? v : undefined;
    }
    return cur;
  }

  // ---------- the interpreter ----------
  exec(bytes, ctx, version) {
    const stack = [];
    const pop = () => (stack.length ? stack.pop() : undefined);
    const popArgs = () => { let n = this.toInt(pop()); if (n < 0 || n > 1000) n = 0; const a = []; for (let i = 0; i < n; i++) a.push(pop()); return a; };
    const withs = [];
    let pc = 0; const end = bytes.length;
    let localOps = 0;
    while (pc < end) {
      while (withs.length && pc >= withs[withs.length - 1].end) { const w = withs.pop(); ctx.scope.length = w.len; }
      const code = bytes[pc]; let len = 0; let p = pc + 1;
      if (code === 0) break;
      if (code >= 0x80) { len = bytes.readUInt16LE(p); p += 2; }
      const next = p + len;
      if (++this.opsExecuted > this.opBudget) throw new Error("AVM1 op budget exceeded");
      if (++localOps > 8_000_000) throw new Error("AVM1 script timeout (action block)");
      this.opCoverage.set(code, (this.opCoverage.get(code) || 0) + 1);
      switch (code) {
        case 0x04: this.clipOf(ctx)?.nextFrameCmd(); break;
        case 0x05: this.clipOf(ctx)?.prevFrameCmd(); break;
        case 0x06: this.clipOf(ctx)?.playCmd(); break;
        case 0x07: this.clipOf(ctx)?.stopCmd(); break;
        case 0x09: this.host("stopAllSounds", []); break;
        case 0x0A: { const b = pop(), a = pop(); stack.push(this.toNum(a) + this.toNum(b)); break; }
        case 0x0B: { const b = pop(), a = pop(); stack.push(this.toNum(a) - this.toNum(b)); break; }
        case 0x0C: { const b = pop(), a = pop(); stack.push(this.toNum(a) * this.toNum(b)); break; }
        case 0x0D: { const b = pop(), a = pop(); const nb = this.toNum(b); stack.push(nb === 0 && version < 5 ? "#ERROR#" : this.toNum(a) / nb); break; }
        case 0x0E: { const b = pop(), a = pop(); stack.push(this.toNum(a) === this.toNum(b)); break; }
        case 0x0F: { const b = pop(), a = pop(); stack.push(this.toNum(a) < this.toNum(b)); break; }
        case 0x10: { const b = pop(), a = pop(); stack.push(this.toBool(a) && this.toBool(b)); break; }
        case 0x11: { const b = pop(), a = pop(); stack.push(this.toBool(a) || this.toBool(b)); break; }
        case 0x12: stack.push(!this.toBool(pop())); break;
        case 0x13: { const b = pop(), a = pop(); stack.push(this.toStr(a) === this.toStr(b)); break; }
        case 0x14: stack.push(this.toStr(pop()).length); break;
        case 0x15: { const cnt = this.toInt(pop()), idx = this.toInt(pop()), s = this.toStr(pop()); stack.push(s.substr(Math.max(0, idx - 1), Math.max(0, cnt))); break; }
        case 0x17: pop(); break;
        case 0x18: stack.push(this.toInt(pop())); break;
        case 0x1C: { const n = this.toStr(pop()); const v = this.getVariable(ctx, n); if (v === undefined) this.lastUndefined = n; stack.push(v); break; }
        case 0x1D: { const v = pop(); const n = this.toStr(pop()); this.setVariable(ctx, n, v); break; }
        case 0x20: { const t = pop(); this.setTarget(ctx, t); break; }
        case 0x21: { const b = pop(), a = pop(); stack.push(this.toStr(a) + this.toStr(b)); break; }
        case 0x22: { const idx = this.toInt(pop()); const t = pop(); const clip = this.targetOf(ctx, t); stack.push(clip ? clip.getPropIndex(idx) : undefined); break; }
        case 0x23: { const v = pop(); const idx = this.toInt(pop()); const t = pop(); const clip = this.targetOf(ctx, t); if (clip) clip.setPropIndex(idx, v); break; }
        case 0x24: { const depth = this.toInt(pop()); const tgt = this.toStr(pop()); const src = this.targetOf(ctx, pop()); if (src?.duplicate) src.duplicate(tgt, depth); break; }
        case 0x25: { const t = this.targetOf(ctx, pop()); if (t?.removeCmd) t.removeCmd(); break; }
        case 0x26: this.host("trace", [this.toStr(pop())]); break;
        case 0x27: { const t = pop(); this.toBool(pop()); const c = this.toBool(pop()); if (c) { pop(); pop(); pop(); pop(); } this.host("startDrag", [this.toStr(t)]); break; }
        case 0x28: this.host("stopDrag", []); break;
        case 0x29: { const b = pop(), a = pop(); stack.push(this.toStr(a) < this.toStr(b)); break; }
        case 0x30: { const max = this.toInt(pop()); stack.push(max > 0 ? Math.floor(this.random() * max) : 0); break; }
        case 0x34: stack.push(Math.floor(this.timeMs)); break;
        case 0x3A: { const n = pop(); const o = pop(); stack.push(o instanceof ASObject ? o.delete(this.toStr(n)) : false); break; }
        case 0x3B: { const n = this.toStr(pop()); let ok = false; for (let i = ctx.scope.length - 1; i >= 0; i--) { const s = ctx.scope[i]; if (s instanceof ASObject && s.hasOwn(n)) { ok = s.delete(n); break; } } stack.push(ok); break; }
        case 0x3C: { const v = pop(); const n = this.toStr(pop()); this.localScope(ctx).define(n, v); break; }
        case 0x41: { const n = this.toStr(pop()); const s = this.localScope(ctx); if (!s.hasOwn(n)) s.define(n, undefined); break; }
        case 0x3D: {
          const name = this.toStr(pop()); const args = popArgs();
          const f = this.getVariable(ctx, name);
          if (f instanceof ASFunction) stack.push(this.callFn(f, this.callFunctionThis(ctx), args));
          else { this.noteMissingCall(null, name, ctx); stack.push(undefined); }
          break;
        }
        case 0x3E: return pop();
        case 0x3F: { const b = pop(), a = pop(); stack.push(this.toNum(a) % this.toNum(b)); break; }
        case 0x40: {
          const name = this.toStr(pop()); const args = popArgs();
          const f = this.getVariable(ctx, name);
          if (f instanceof ASFunction) stack.push(this.construct(f, args));
          else { this.noteMissingCall(null, "new " + name, ctx); stack.push(undefined); }
          break;
        }
        case 0x42: { const n = this.toInt(pop()); const a = []; for (let i = 0; i < n; i++) a.push(pop()); stack.push(new ASArray(this, a)); break; }
        case 0x43: { const n = this.toInt(pop()); const o = new ASObject(this, this.ObjectProto); for (let i = 0; i < n; i++) { const v = pop(); const k = this.toStr(pop()); o.set(k, v); } stack.push(o); break; }
        case 0x44: stack.push(this.typeOf(pop())); break;
        case 0x45: { const o = pop(); stack.push(o?.isClip ? o.targetPath() : undefined); break; }
        case 0x46: { const n = this.toStr(pop()); const o = this.getVariable(ctx, n); stack.push(null); if (o instanceof ASObject) for (const k of o.enumKeys()) stack.push(k); break; }
        case 0x55: { const o = pop(); stack.push(null); if (o instanceof ASObject) for (const k of o.enumKeys()) stack.push(k); break; }
        case 0x47: { const b = pop(), a = pop(); stack.push(this.add2(a, b)); break; }
        case 0x48: { const b = pop(), a = pop(); stack.push(this.less2(a, b)); break; }
        case 0x67: { const b = pop(), a = pop(); stack.push(this.less2(b, a)); break; }
        case 0x49: { const b = pop(), a = pop(); stack.push(this.equals2(a, b)); break; }
        case 0x66: { const b = pop(), a = pop(); stack.push(this.typeOf(a) === this.typeOf(b) && (a instanceof ASObject ? a === b : a === b)); break; }
        case 0x4A: stack.push(this.toNum(pop())); break;
        case 0x4B: stack.push(this.toStr(pop())); break;
        case 0x4C: { const v = stack.length ? stack[stack.length - 1] : undefined; stack.push(v); break; }
        case 0x4D: { const b = pop(), a = pop(); stack.push(b, a); break; }
        case 0x4E: { const n = pop(); const o = pop(); const v = this.getMember(o, this.toStr(n)); if (v === undefined) this.lastUndefined = this.toStr(n); stack.push(v); break; }
        case 0x4F: { const v = pop(); const n = this.toStr(pop()); const o = pop(); this.setMember(o, n, v); break; }
        case 0x50: stack.push(this.toNum(pop()) + 1); break;
        case 0x51: stack.push(this.toNum(pop()) - 1); break;
        case 0x52: {
          const mname = pop(); const obj = pop(); const args = popArgs();
          if (mname === undefined || mname === null || mname === "") {
            if (obj instanceof SuperObject) { const ctor = obj.base?.get("__constructor__") ?? obj.base?.get("constructor"); stack.push(this.callFn(ctor, obj.thisObj, args, obj.base)); }
            else if (obj instanceof ASFunction) stack.push(this.callFn(obj, undefined, args));
            else stack.push(undefined);
            break;
          }
          const name = this.toStr(mname);
          const [f, holder] = this.getMemberWithHolder(obj, name);
          const thisObj = obj instanceof SuperObject ? obj.thisObj : obj;
          if (f instanceof ASFunction) stack.push(this.callFn(f, thisObj, args, holder));
          else { this.noteMissingCall(obj, name, ctx); stack.push(undefined); }
          break;
        }
        case 0x53: {
          const mname = pop(); const obj = pop(); const args = popArgs();
          const f = (mname === undefined || mname === "") ? obj : this.getMember(obj, this.toStr(mname));
          stack.push(f instanceof ASFunction ? this.construct(f, args) : undefined);
          break;
        }
        case 0x54: { const ctor = pop(); const o = pop(); stack.push(this.instanceOf(o, ctor)); break; }
        case 0x60: { const b = pop(), a = pop(); stack.push(this.toI32(a) & this.toI32(b)); break; }
        case 0x61: { const b = pop(), a = pop(); stack.push(this.toI32(a) | this.toI32(b)); break; }
        case 0x62: { const b = pop(), a = pop(); stack.push(this.toI32(a) ^ this.toI32(b)); break; }
        case 0x63: { const b = pop(), a = pop(); stack.push(this.toI32(a) << (this.toI32(b) & 31)); break; }
        case 0x64: { const b = pop(), a = pop(); stack.push(this.toI32(a) >> (this.toI32(b) & 31)); break; }
        case 0x65: { const b = pop(), a = pop(); stack.push(this.toI32(a) >>> (this.toI32(b) & 31)); break; }
        case 0x68: { const b = pop(), a = pop(); stack.push(this.toStr(a) > this.toStr(b)); break; }
        case 0x81: this.clipOf(ctx)?.gotoCmd(bytes.readUInt16LE(p) + 1, false); break;
        case 0x83: { const e1 = bytes.indexOf(0, p); const url = bytes.toString("latin1", p, e1); const e2 = bytes.indexOf(0, e1 + 1); this.host("getURL", [url, bytes.toString("latin1", e1 + 1, e2)]); break; }
        case 0x87: regs(ctx)[bytes[p]] = stack.length ? stack[stack.length - 1] : undefined; break;
        case 0x88: {
          const n = bytes.readUInt16LE(p); let q = p + 2; const pool = [];
          for (let i = 0; i < n; i++) { const e = bytes.indexOf(0, q); pool.push(bytes.toString("latin1", q, e)); q = e + 1; }
          ctx.pool = pool; break;
        }
        case 0x8A: case 0x8D: { if (code === 0x8D) pop(); break; } // all frames are loaded in this runtime
        case 0x8B: { const e = bytes.indexOf(0, p); this.setTarget(ctx, bytes.toString("latin1", p, e)); break; }
        case 0x8C: { const e = bytes.indexOf(0, p); this.clipOf(ctx)?.gotoLabelCmd(bytes.toString("latin1", p, e), false); break; }
        case 0x8E: case 0x9B: {
          let q = p; const e = bytes.indexOf(0, q); const name = bytes.toString("latin1", q, e); q = e + 1;
          const np = bytes.readUInt16LE(q); q += 2;
          let regCount = 0, flags = 0; const params = [];
          if (code === 0x8E) { regCount = bytes[q]; flags = bytes.readUInt16BE(q + 1); q += 3; flags = ((flags >> 8) & 0xff) | ((flags & 0x01) << 8); }
          for (let i = 0; i < np; i++) {
            let reg = 0; if (code === 0x8E) { reg = bytes[q]; q++; }
            const e2 = bytes.indexOf(0, q); params.push({ reg, name: bytes.toString("latin1", q, e2) }); q = e2 + 1;
          }
          const size = bytes.readUInt16LE(q);
          const body = bytes.subarray(next, next + size);
          const fn = new ASFunction(this, { name, params, body, scope: ctx.scope.map((s) => (s === "TARGET" ? ctx.target : s)), pool: ctx.pool, df2: code === 0x8E, regCount, flags, version, target: ctx.target });
          if (name) this.setVariableDefine(ctx, name, fn); else stack.push(fn);
          pc = next + size; continue;
        }
        case 0x94: {
          const size = bytes.readUInt16LE(p); const o = pop();
          withs.push({ end: next + size, len: ctx.scope.length });
          if (o instanceof ASObject) ctx.scope.push(o); else ctx.scope.push(new ASObject(this, null));
          break;
        }
        case 0x96: {
          let q = p;
          while (q < next) {
            const t = bytes[q++];
            switch (t) {
              case 0: { const e = bytes.indexOf(0, q); stack.push(bytes.toString("latin1", q, e)); q = e + 1; break; }
              case 1: stack.push(bytes.readFloatLE(q)); q += 4; break;
              case 2: stack.push(null); break;
              case 3: stack.push(undefined); break;
              case 4: stack.push(regs(ctx)[bytes[q]]); q++; break;
              case 5: stack.push(bytes[q] !== 0); q++; break;
              case 6: { const b = Buffer.alloc(8); bytes.copy(b, 0, q + 4, q + 8); bytes.copy(b, 4, q, q + 4); stack.push(b.readDoubleLE(0)); q += 8; break; }
              case 7: stack.push(bytes.readInt32LE(q)); q += 4; break;
              case 8: stack.push(ctx.pool?.[bytes[q]]); q++; break;
              case 9: stack.push(ctx.pool?.[bytes.readUInt16LE(q)]); q += 2; break;
              default: throw new Error("bad push type " + t);
            }
          }
          break;
        }
        case 0x99: pc = next + bytes.readInt16LE(p); continue;
        case 0x9D: if (this.toBool(pop())) { pc = next + bytes.readInt16LE(p); continue; } break;
        case 0x9A: { const target = this.toStr(pop()); const url = this.toStr(pop()); this.host("getURL2", [url, target, bytes[p]]); break; }
        case 0x9E: { const t = pop(); const clip = this.targetOf(ctx, t); this.host("callFrame", [this.toStr(t)]); void clip; break; }
        case 0x9F: {
          const flags = bytes[p]; const play = !!(flags & 1); const bias = flags & 2 ? bytes.readUInt16LE(p + 1) : 0;
          const f = pop();
          if (typeof f === "number") this.clipOf(ctx)?.gotoCmd(this.toInt(f) + bias, play);
          else {
            let s = this.toStr(f); let clip = this.clipOf(ctx);
            if (s.includes(":")) { const i = s.lastIndexOf(":"); clip = this.resolvePath(ctx, s.slice(0, i)); s = s.slice(i + 1); }
            if (/^\d+$/.test(s)) clip?.gotoCmd?.(+s + bias, play); else clip?.gotoLabelCmd?.(s, play);
          }
          break;
        }
        default:
          throw new Error("unimplemented opcode 0x" + code.toString(16) + " " + (OPN[code] || ""));
      }
      pc = next;
    }
    return undefined;
    function regs(c) { return c.regs; }
  }
  setVariableDefine(ctx, name, v) {
    if (ctx.fn) this.localScope(ctx).define(name, v);
    else (ctx.target ?? this.defaultTarget()).set(name, v);
  }
  localScope(ctx) {
    const s = ctx.scope[ctx.scope.length - 1];
    if (ctx.fn && s instanceof ASObject) return s;
    return ctx.target ?? this.defaultTarget();
  }
  callFunctionThis(ctx) { return ctx.target; }
  clipOf(ctx) { return ctx.target?.isClip ? ctx.target : null; }
  targetOf(ctx, t) {
    if (t instanceof ASObject) return t.isDisplay ? t : null;
    const s = this.toStr(t);
    if (s === "") return ctx.target;
    const r = this.resolvePath(ctx, s);
    return r?.isDisplay ? r : null;
  }
  setTarget(ctx, t) {
    if (t === "" || t === undefined) { ctx.target = ctx.origTarget; return; }
    const r = t instanceof ASObject ? t : this.resolvePath({ ...ctx, target: ctx.origTarget }, this.toStr(t));
    if (r?.isClip) ctx.target = r; else this.note("setTargetMissing", this.toStr(t));
  }
  instanceOf(o, ctor) {
    if (!(o instanceof ASObject) || !(ctor instanceof ASFunction)) return false;
    const proto = ctor.get("prototype"); let p = o.getProto(), d = 0;
    while (p && d++ < 100) { if (p === proto) return true; p = p.getProto(); }
    return false;
  }
}
