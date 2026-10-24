// Same-VM Replay only. AS objects/functions retain identity; this is not a serializer.
/* eslint-disable @typescript-eslint/no-explicit-any */
import {ASArray, ASFunction, ASObject, SuperObject} from './avm';
import {ButtonObj, DisplayObject, MovieClip, Runtime, TextFieldObj} from './display';

const RUNTIME_FIELDS = (`ci version opsExecuted opBudget callDepth timeMs lastUndefined
  ObjectProto FunctionProto ArrayProto StringProto NumberProto BooleanProto Global
  tickCount instanceCounter queue initDone intervals intervalId seed hostLog notes missing
  errors frameAdvances presentationBoundary registeredClasses mouseListeners keyListeners focus mouse hover
  pressed drag dropTarget keysDown lastKey shell page_ pendingBegin volume
  MovieClipProto ButtonProto TextFieldProto TextFormatProto MathObj KeyObj MouseObj
  SelectionObj StageObj`).split(/\s+/u);
// Page payload, compiled code and live host/media resources are independently rebound.
const LIVE_RUNTIME = new Set(['page','scripts','bytecode','audio','hostCb','hitTestFn','helpers','streamsByTimeline']);
const BASE = 'rt proto props watchers isDisplay isClip isButton isText';
const DISPLAY = 'def parentClip depth name charId m cx ratio clipDepth visible removed scriptMoved asVisible buttonOwner';
const FUNCTION = 'name params body scope pool df2 regCount flags version target native compiled ctor';
const MOVIE = 'children frame playing clipActions bornTick looped graphics stream mask';
const BUTTON = 'state stateChildren clipActions';
const TEXT = 'html textValue htmlValue variable textColor format border';
const READONLY = new Set(['rt','def','stream','body','native','compiled','ctor']);

export class HfrEntryStateError extends Error {
  constructor(readonly code: string, readonly path: string) {
    super(`${code}: ${path}`); this.name = 'HfrEntryStateError';
  }
}

export interface EntryState {readonly objectCount: number; restore(): void}

/** Capture after frame-one tags/init, before its queued load/actions execute. */
export function captureEntryState(rt: Runtime): EntryState {
  const objects = new Map<ASObject, Record<string, any>>();
  const copied = new Map<object, any>();
  const fail = (code: string, path: string): never => {throw new HfrEntryStateError(code,path);};
  const fields = (o: ASObject): Set<string> => {
    let names = BASE;
    if (o instanceof DisplayObject) names += ' ' + DISPLAY;
    if (o instanceof MovieClip) names += ' ' + MOVIE;
    else if (o instanceof ButtonObj) names += ' ' + BUTTON;
    else if (o instanceof TextFieldObj) names += ' ' + TEXT;
    else if (o instanceof ASFunction) names += ' ' + FUNCTION;
    else if (o instanceof ASArray) names += ' a';
    else if (o instanceof SuperObject) names += ' thisObj base';
    else if (Object.getPrototypeOf(o) !== ASObject.prototype && !(o instanceof DisplayObject))
      fail('HFR_ENTRY_UNSUPPORTED_OBJECT',o.constructor.name);
    return new Set(names.split(' '));
  };
  const copy = (v: any, path: string): any => {
    if (v === null || ['undefined','string','number','boolean'].includes(typeof v)) return v;
    if (v instanceof ASObject) {
      if (v.rt !== rt) fail('HFR_ENTRY_FOREIGN_VM',path);
      if (!objects.has(v)) {
        const saved: Record<string, any> = {}; objects.set(v,saved);
        const allowed = fields(v);
        for (const key of Object.keys(v)) {
          if (!allowed.has(key)) fail('HFR_ENTRY_UNSUPPORTED_FIELD',`${path}.${key}`);
          const value = (v as any)[key];
          saved[key] = READONLY.has(key) ? value : copy(value,`${path}.${key}`);
        }
      }
      return v;
    }
    if (typeof v !== 'object') fail('HFR_ENTRY_UNSUPPORTED_VALUE',path);
    if (copied.has(v)) return copied.get(v);
    if (Array.isArray(v)) {
      const a: any[] = []; copied.set(v,a);
      for (let i = 0; i < v.length; i++) if (i in v) a[i] = copy(v[i],`${path}[${i}]`);
      a.length = v.length; return a;
    }
    if (v instanceof Map) {
      const m = new Map(); copied.set(v,m);
      for (const [k,value] of v) m.set(copy(k,`${path}.key`),copy(value,`${path}.value`));
      return m;
    }
    if (v instanceof Set) {
      const s = new Set(); copied.set(v,s); for (const value of v) s.add(copy(value,`${path}.value`)); return s;
    }
    if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null)
      fail('HFR_ENTRY_UNSUPPORTED_VALUE',path);
    const o: Record<string, any> = Object.create(Object.getPrototypeOf(v)); copied.set(v,o);
    for (const key of Object.keys(v)) o[key] = copy(v[key],`${path}.${key}`);
    return o;
  };
  for (const key of Object.keys(rt)) if (!RUNTIME_FIELDS.includes(key) && !LIVE_RUNTIME.has(key))
    fail('HFR_ENTRY_RUNTIME_FIELD_UNCLASSIFIED',key);
  // initDone keys are source tag identities, not mutable AS values.
  const initializedTags = new Set(rt.initDone);
  const savedRuntime = Object.fromEntries(RUNTIME_FIELDS.filter(key=>key!=='initDone').map(key => [key,copy((rt as any)[key],key)]));
  // Copies above retain all AS identities. Each restore gets fresh mutable container
  // values, so changing page state cannot alter the retained entry checkpoint.
  const restoreCopy = (v: any, seen: Map<object,any>): any => {
    if (v === null || typeof v !== 'object' || v instanceof ASObject) return v;
    if (seen.has(v)) return seen.get(v);
    const out = Array.isArray(v) ? [] : v instanceof Map ? new Map() : v instanceof Set ? new Set() : Object.create(Object.getPrototypeOf(v));
    seen.set(v,out);
    if (v instanceof Map) for (const [k,value] of v) out.set(restoreCopy(k,seen),restoreCopy(value,seen));
    else if (v instanceof Set) for (const value of v) out.add(restoreCopy(value,seen));
    else {for (const key of Object.keys(v)) out[key] = restoreCopy(v[key],seen); if (Array.isArray(v)) out.length = v.length;}
    return out;
  };
  return {objectCount:objects.size,restore() {
    const seen = new Map<object,any>();
    for (const [object,saved] of objects) {
      for (const key of Object.keys(object)) if (!(key in saved)) delete (object as any)[key];
      for (const [key,value] of Object.entries(saved)) (object as any)[key] = READONLY.has(key) ? value : restoreCopy(value,seen);
    }
    for (const [key,value] of Object.entries(savedRuntime)) (rt as any)[key] = restoreCopy(value,seen);
    rt.initDone = new Set(initializedTags);
  }};
}
