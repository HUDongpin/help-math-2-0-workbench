// HFR runtime · the helper layer used by generated page modules.
// Values cross into TypeScript as Proxies over ActionScript objects, so page
// code can say `$.Mc_Car._rotation` while lookups, case rules and coercions
// stay exactly ActionScript.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ASObject, ASFunction, ASArray, PROPS, type Ctx } from "./avm";
import type { Runtime } from "./display";
import type { Helpers } from "./types";

const UNWRAP = Symbol("hfr.unwrap");

export function makeHelpers(rt: Runtime): Helpers & { wrap: (v: any) => any; scope: (ctx: Ctx) => any } {
  const proxies = new WeakMap<object, any>();
  const scopes = new WeakMap<object, Ctx>();
  const unwrap = (v: any): any => (v && (typeof v === "object" || typeof v === "function") && v[UNWRAP] ? v[UNWRAP] : v);
  const wrap = (v: any): any => {
    if (!(v instanceof ASObject)) return v;
    let p = proxies.get(v); if (p) return p;
    const target: any = v instanceof ASFunction ? function () { /* callable proxy target */ } : {};
    p = new Proxy(target, {
      get(_t, key) {
        if (key === UNWRAP) return v;
        if (typeof key === "symbol") return key === Symbol.toPrimitive ? () => rt.toPrim(v) : undefined;
        if (key === "then") return undefined;
        return wrap(rt.getMember(v, key));
      },
      set(_t, key, val) { if (typeof key === "string") v.set(key, unwrap(val)); return true; },
      has(_t, key) { return typeof key === "string" && v.getWithHolder(key)[1] !== null; },
      deleteProperty(_t, key) { return typeof key === "string" ? v.delete(key) : false; },
      apply(_t, thisArg, args) { return wrap(rt.callFn(v, thisOf(thisArg), args.map(unwrap))); },
      construct(_t, args) { return wrap(rt.construct(v, args.map(unwrap))); },
    });
    proxies.set(v, p); return p;
  };
  // A function called as `$.name()` (AVM1 CallFunction) gets the current timeline as `this`.
  const thisOf = (t: any) => { const ctx = t && scopes.get(t); return ctx ? ctx.target : unwrap(t); };
  const scope = (ctx: Ctx): any => {
    const p: any = new Proxy({}, {
      get(_t, key) { if (key === UNWRAP) return undefined; if (typeof key === "symbol" || key === "then") return undefined; return wrap(rt.getVariable(ctx, key)); },
      set(_t, key, val) { if (typeof key === "string") rt.setVariable(ctx, key, unwrap(val)); return true; },
      has(_t, key) { return typeof key === "string" && rt.findScopeVar(ctx, key)[0]; },
    });
    scopes.set(p, ctx); return p;
  };
  const ctxOf = ($: any): Ctx => scopes.get($)!;
  const clipOf = ($: any) => rt.clipOf(ctxOf($));
  const n = (x: any) => rt.toNum(unwrap(x));

  // Functions defined by page code: DefineFunction (v1) and DefineFunction2.
  const fn = ($: any, name: string, params: string[], body: ($: any, $$: any) => any) => {
    const outer = ctxOf($);
    const f = new ASFunction(rt, { name, params: params.map((p) => ({ name: p, reg: 0 })), scope: outer.scope.map((s) => (s === "TARGET" ? outer.target : s)), target: outer.target, version: rt.version });
    f.compiled = (thisObj, args, home) => { const { ctx, act } = rt.prepareCall(f, thisObj, args, home); return unwrap(body(scope(ctx), wrap(act))); };
    return wrap(f);
  };
  const fn2 = ($: any, name: string, spec: { params: string[]; paramRegs: number[]; regs: number; flags: number }, body: ($: any, $$: any, R: any[]) => any) => {
    const outer = ctxOf($);
    const f = new ASFunction(rt, { name, params: spec.params.map((p, i) => ({ name: p, reg: spec.paramRegs[i] })), scope: outer.scope.map((s) => (s === "TARGET" ? outer.target : s)), target: outer.target, df2: true, regCount: spec.regs, flags: spec.flags, version: rt.version });
    f.compiled = (thisObj, args, home) => { const { ctx, act } = rt.prepareCall(f, thisObj, args, home); return unwrap(body(scope(ctx), wrap(act), ctx.regs.map(wrap))); };
    return wrap(f);
  };

  const h = {
    wrap, scope,
    // coercions and operators (ActionScript semantics)
    truthy: (x: any) => rt.toBool(unwrap(x)),
    add: (a: any, b: any) => rt.add2(unwrap(a), unwrap(b)),
    sub: (a: any, b: any) => n(a) - n(b), mul: (a: any, b: any) => n(a) * n(b), div: (a: any, b: any) => n(a) / n(b), mod: (a: any, b: any) => n(a) % n(b),
    eq: (a: any, b: any) => rt.equals2(unwrap(a), unwrap(b)), seq: (a: any, b: any) => rt.strictEquals(unwrap(a), unwrap(b)),
    lt: (a: any, b: any) => rt.less2(unwrap(a), unwrap(b)), gt: (a: any, b: any) => rt.less2(unwrap(b), unwrap(a)),
    numAdd: (a: any, b: any) => n(a) + n(b), numEq: (a: any, b: any) => n(a) === n(b), numLt: (a: any, b: any) => n(a) < n(b),
    strEq: (a: any, b: any) => rt.toStr(unwrap(a)) === rt.toStr(unwrap(b)), strLt: (a: any, b: any) => rt.toStr(unwrap(a)) < rt.toStr(unwrap(b)), strGt: (a: any, b: any) => rt.toStr(unwrap(a)) > rt.toStr(unwrap(b)),
    concat: (a: any, b: any) => rt.toStr(unwrap(a)) + rt.toStr(unwrap(b)),
    bitAnd: (a: any, b: any) => rt.toI32(unwrap(a)) & rt.toI32(unwrap(b)), bitOr: (a: any, b: any) => rt.toI32(unwrap(a)) | rt.toI32(unwrap(b)), bitXor: (a: any, b: any) => rt.toI32(unwrap(a)) ^ rt.toI32(unwrap(b)),
    shl: (a: any, b: any) => rt.toI32(unwrap(a)) << (rt.toI32(unwrap(b)) & 31), shr: (a: any, b: any) => rt.toI32(unwrap(a)) >> (rt.toI32(unwrap(b)) & 31), ushr: (a: any, b: any) => rt.toI32(unwrap(a)) >>> (rt.toI32(unwrap(b)) & 31),
    instanceOf: (o: any, c: any) => rt.instanceOf(unwrap(o), unwrap(c)),
    inc: (x: any) => n(x) + 1, dec: (x: any) => n(x) - 1, num: (x: any) => n(x), str: (x: any) => rt.toStr(unwrap(x)), int: (x: any) => rt.toInt(unwrap(x)),
    typeOf: (x: any) => rt.typeOf(unwrap(x)), strlen: (x: any) => rt.toStr(unwrap(x)).length,
    targetPath: (x: any) => { const o = unwrap(x); return o?.isClip ? o.targetPath() : undefined; },
    substr: (s: any, i: any, c: any) => rt.toStr(unwrap(s)).substr(Math.max(0, rt.toInt(unwrap(i)) - 1), Math.max(0, rt.toInt(unwrap(c)))),
    and: (a: any, b: () => any) => (rt.toBool(unwrap(a)) ? b() : a), or: (a: any, b: () => any) => (rt.toBool(unwrap(a)) ? a : b()),
    // object construction
    newObj: (ctor: any, ...args: any[]) => { const c = unwrap(ctor); if (!(c instanceof ASFunction)) { rt.noteMissingCall(null, "new", null); return undefined; } return wrap(rt.construct(c, args.map(unwrap))); },
    obj: (o: Record<string, any>) => { const x = new ASObject(rt, rt.ObjectProto); for (const [k, v] of Object.entries(o)) x.set(k, unwrap(v)); return wrap(x); },
    arr: (...items: any[]) => wrap(new ASArray(rt, items.map(unwrap))),
    keys: (o: any) => { const x = unwrap(o); return x instanceof ASObject ? x.enumKeys() : []; },
    set: (o: any, k: any, v: any) => { const x = unwrap(o); if (x instanceof ASObject) x.set(rt.toStr(unwrap(k)), unwrap(v)); },
    del: (o: any, k: any) => { const x = unwrap(o); return x instanceof ASObject ? x.delete(rt.toStr(unwrap(k))) : false; },
    deleteVar: ($: any, k: any) => rt.deleteVar(ctxOf($), rt.toStr(unwrap(k))),
    declare: ($$: any, k: any) => { const o = unwrap($$); const key = rt.toStr(unwrap(k)); if (o instanceof ASObject && !o.hasOwn(key)) o.define(key, undefined); },
    fn, fn2,
    // scope changes
    tellTarget: ($: any, t: any) => scope(rt.retarget(ctxOf($), unwrap(t))),
    withScope: ($: any, o: any, body: ($: any, $$: any) => void) => { const c = ctxOf($); const x = unwrap(o); body(scope({ ...c, scope: [...c.scope, x instanceof ASObject ? x : new ASObject(rt, null)] }), wrap(rt.localScope(c))); },
    beginWith: ($: any, o: any) => { const c = ctxOf($); const x = unwrap(o); return scope({ ...c, scope: [...c.scope, x instanceof ASObject ? x : new ASObject(rt, null)], withStack: [...(c.withStack ?? []), c] }); },
    endWith: ($: any) => { const c = ctxOf($); const prev = c.withStack?.[c.withStack.length - 1]; return prev ? scope({ ...prev, target: c.target }) : $; },
    // timeline control of the current target (frame actions like gotoAndPlay(5))
    play: ($: any) => clipOf($)?.playCmd(), stop: ($: any) => clipOf($)?.stopCmd(),
    nextFrame: ($: any) => clipOf($)?.nextFrameCmd(), prevFrame: ($: any) => clipOf($)?.prevFrameCmd(),
    gotoAndStop: ($: any, f: any, bias = 0) => rt.gotoFrameExpr(ctxOf($), unwrap(f), false, bias),
    gotoAndPlay: ($: any, f: any, bias = 0) => rt.gotoFrameExpr(ctxOf($), unwrap(f), true, bias),
    gotoLabel: ($: any, l: string) => clipOf($)?.gotoLabelCmd(l, false),
    callFrame: ($: any, f: any) => rt.host("callFrame", [rt.toStr(unwrap(f))]),
    // movie clip and property functions
    getProperty: ($: any, t: any, p: any) => { const c = rt.targetOf(ctxOf($), unwrap(t)); const name = typeof p === "string" ? p : PROPS[rt.toInt(unwrap(p))]; return c ? c.dispProp(name) : undefined; },
    setProperty: ($: any, t: any, p: any, v: any) => { const c = rt.targetOf(ctxOf($), unwrap(t)); const name = typeof p === "string" ? p : PROPS[rt.toInt(unwrap(p))]; if (c) c.setDispProp(name, unwrap(v)); },
    duplicateMovieClip: ($: any, src: any, name: any, depth: any) => { const c = rt.targetOf(ctxOf($), unwrap(src)); if (c?.duplicate) c.duplicate(rt.toStr(unwrap(name)), rt.toInt(unwrap(depth))); },
    removeMovieClip: ($: any, t: any) => { const c = rt.targetOf(ctxOf($), unwrap(t)); if (c?.removeCmd) c.removeCmd(); },
    startDrag: ($: any, t: any, lock: any, x1?: any, y1?: any, x2?: any, y2?: any) => rt.startDragTarget(rt.targetOf(ctxOf($), unwrap(t)), rt.toBool(unwrap(lock)), x1 === undefined ? null : [x1, y1, x2, y2].map((v) => n(v))),
    stopDrag: (_$: any) => rt.stopDragAll(),
    stopAllSounds: (_$: any) => { rt.audio?.stopAll(); rt.host("stopAllSounds", []); },
    trace: (_$: any, x: any) => rt.host("trace", [rt.toStr(unwrap(x))]),
    random: (_$: any, max: any) => { const m = rt.toInt(unwrap(max)); return m > 0 ? Math.floor(rt.random() * m) : 0; },
    getTimer: (_$: any) => Math.floor(rt.timeMs),
    getURL: (_$: any, url: any, target: any, flags?: number) => rt.host("getURL", [rt.toStr(unwrap(url)), rt.toStr(unwrap(target)), flags ?? 0]),
    // exact helpers used by the explicit-stack fallback
    getVar: ($: any, name: any) => wrap(rt.getVariable(ctxOf($), rt.toStr(unwrap(name)))),
    setVar: ($: any, name: any, v: any) => rt.setVariable(ctxOf($), rt.toStr(unwrap(name)), unwrap(v)),
    getMem: (o: any, k: any) => wrap(rt.getMember(unwrap(o), rt.toStr(unwrap(k)))),
    callVar: ($: any, name: any, args: any[]) => { const c = ctxOf($); const f = rt.getVariable(c, rt.toStr(unwrap(name))); if (f instanceof ASFunction) return wrap(rt.callFn(f, c.target, args.map(unwrap))); rt.noteMissingCall(null, rt.toStr(unwrap(name)), c); return undefined; },
    callMethod: (o: any, m: any, args: any[]) => wrap(rt.callMethod(unwrap(o), unwrap(m), args.map(unwrap), null)),
    popArgs: (S: any[]) => { let c = rt.toInt(unwrap(S.pop())); if (c < 0 || c > 1000) c = 0; const a: any[] = []; for (let i = 0; i < c; i++) a.push(S.pop()); return a; },
  };
  return h;
}
