// Deterministic observations of the shared HFR runtime, not a Flash oracle.
// Read stored descriptors without invoking getters or page code. Function bodies
// differ by design between the interpreter and compiler; compare metadata,
// captures, properties and alias relationships instead of JavaScript source.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "node:crypto";
import { ASArray, ASFunction, ASObject } from "../runtime/avm";
import { DisplayObject, MovieClip, Runtime, TextFieldObj } from "../runtime/display";

export function snapshotState(rt: Runtime): string {
  const seen = new Map<object, number>();
  const encode = (v: any): any => {
    if (v === undefined) return { type: "undefined" };
    if (typeof v === "number" && (!Number.isFinite(v) || Object.is(v, -0))) return { type: "number", value: Object.is(v, -0) ? "-0" : String(v) };
    if (v === null || typeof v === "string" || typeof v === "boolean" || typeof v === "number") return v;
    if (typeof v === "bigint") return { type: "bigint", value: String(v) };
    if (typeof v === "symbol") throw new Error("unsupported symbol in verification state");
    if (seen.has(v)) return { ref: seen.get(v) };
    const id = seen.size; seen.set(v, id);
    if (v instanceof ASObject) {
      const out: any = { id, type: v instanceof ASFunction ? "ASFunction" : v instanceof ASArray ? "ASArray" : v.isDisplay ? "DisplayObject" : "ASObject" };
      // Preserve property order: AVM1 enumeration can observe it. Include hidden
      // properties, accessors, prototypes, watchers and sparse array positions.
      out.props = [...v.props].map(([key, p]) => [key, p.n, !!p.dontEnum, !!p.perm, !!p.ro, encode(p.v), encode(p.getter), encode(p.setter)]);
      out.proto = encode(v.proto);
      out.watchers = v.watchers ? [...v.watchers].map(([key, w]) => [key, encode(w.cb), encode(w.data)]) : null;
      if (v instanceof ASArray) out.items = encode(v.a);
      if (v instanceof ASFunction) {
        out.function = { kind: v.native ? "native" : "page", name: v.name, params: v.params.map(p => [p.name, p.reg]), df2: v.df2, regCount: v.regCount, flags: v.flags, version: v.version, scope: v.scope.map(encode), target: encode(v.target) };
      }
      if (v instanceof DisplayObject) {
        out.display = { path: v.targetPath(), charId: v.charId, depth: v.depth, visible: v.visible, removed: v.removed, matrix: encode(v.m), color: encode(v.cx), ratio: v.ratio, clipDepth: v.clipDepth };
        if (v instanceof MovieClip) out.clip = { frame: v.frame, playing: v.playing, looped: v.looped, graphics: encode(v.graphics), mask: encode(v.mask), children: v.sortedChildren().map(encode) };
        if (v instanceof TextFieldObj) out.text = { value: v.textValue, htmlValue: encode(v.htmlValue), html: v.html, variable: v.variable, color: encode(v.textColor), format: encode(v.format), border: v.border };
      }
      return out;
    }
    if (Array.isArray(v)) return { id, type: "array", items: Array.from({ length: v.length }, (_, i) => i in v ? encode(v[i]) : { type: "hole" }) };
    if (v instanceof Map) return { id, type: "map", entries: [...v].map(([k, value]) => [encode(k), encode(value)]) };
    if (v instanceof Set) return { id, type: "set", values: [...v].map(encode) };
    // A raw JS function is not an ActionScript value with comparable metadata.
    // Fail closed rather than silently dropping executable state.
    if (typeof v === "function") throw new Error("unsupported raw function in verification state");
    if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new Error("unsupported object in verification state");
    const descriptors = Object.getOwnPropertyDescriptors(v);
    return { id, type: "object", props: Object.keys(descriptors).sort().map(key => {
      const d = descriptors[key];
      if (d.get || d.set) throw new Error("unsupported JS accessor in verification state");
      return [key, encode(d.value)];
    }) };
  };
  return JSON.stringify({
    global: encode(rt.Global), shell: encode(rt.shell), page: encode(rt.page_),
    tick: rt.tickCount, timeMs: rt.timeMs, seed: rt.seed, pendingBegin: rt.pendingBegin,
    intervals: encode(rt.intervals), registeredClasses: encode(rt.registeredClasses),
    mouseListeners: encode(rt.mouseListeners), keyListeners: encode(rt.keyListeners), focus: encode(rt.focus),
    missing: encode(rt.missing), notes: encode(rt.notes),
  });
}

export function runtimeDiagnostics(rt: Runtime) {
  const rows = (values: Map<string, number>) => [...values].map(([name, count]) => ({ name, count }));
  const missing = { shell: rows(rt.missing.shell), builtin: rows(rt.missing.builtin), content: rows(rt.missing.content) };
  const notes = rows(rt.notes);
  return { missing, notes, clean: Object.values(missing).every(v => v.length === 0) && notes.length === 0 };
}

export interface TraceStep { action: string; tick: number; stateSha256: string }
export function createStateTrace() {
  const steps: TraceStep[] = [];
  const trajectory = createHash("sha256");
  return {
    steps,
    record(rt: Runtime, action: string) {
      const state = snapshotState(rt);
      const step = { action, tick: rt.tickCount, stateSha256: createHash("sha256").update(state).digest("hex") };
      steps.push(step); trajectory.update(JSON.stringify(step) + "\n");
      return state;
    },
    digest() { return trajectory.copy().digest("hex"); },
  };
}
