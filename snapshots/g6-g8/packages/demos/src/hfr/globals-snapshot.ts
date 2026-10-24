import {ASArray, ASObject} from './avm';
import {MovieClip, TextFieldObj, type DisplayObject, type Runtime} from './display';

type Primitive = null | undefined | string | number | boolean;
type Value = Primitive | Readonly<{ref: number}>;
interface Property {
  readonly name: string;
  readonly value: Value;
  readonly dontEnum?: boolean;
  readonly perm?: boolean;
  readonly ro?: boolean;
}
interface Node {
  readonly kind: 'object' | 'array';
  readonly prototype: 'object' | 'array' | 'null';
  readonly properties: readonly Property[];
  readonly length?: number;
  readonly items?: readonly Readonly<{index: number; value: Value}>[];
}
/** Immutable graph, never JSON-coerced: undefined, NaN, aliases and cycles survive. */
export interface GlobalsSnapshot {
  readonly schema: 'hfr-globals-graph/1';
  readonly roots: readonly Property[];
  readonly nodes: readonly Node[];
}
export interface SnapshotIssue {readonly path: string; readonly code: string}
export type GlobalsSnapshotResult =
  | Readonly<{ok: true; snapshot: GlobalsSnapshot}>
  | Readonly<{ok: false; issues: readonly SnapshotIssue[]}>;

type Entry = ASObject['props'] extends Map<string, infer E> ? E : never;
interface ObjectBaseline {
  readonly object: ASObject;
  readonly proto: ASObject | null;
  readonly props: ReadonlyMap<string, Entry>;
  readonly items?: readonly unknown[];
}
export interface GlobalsBaseline {
  readonly globalProps: ReadonlyMap<string, Entry>;
  readonly shellProps: ReadonlyMap<string, Entry>;
  readonly objects: readonly ObjectBaseline[];
  readonly shellChildren: ReadonlyMap<number, DisplayObject>;
  readonly shellDisplay: readonly Readonly<{object: DisplayObject; state: readonly unknown[]}>[];
}
const displayState = (object: DisplayObject): readonly unknown[] => [
  object.name, object.depth, object.parentClip, object.charId, object.ratio, object.clipDepth,
  object.visible, object.removed, object.scriptMoved, object.asVisible,
  object.m.a, object.m.b, object.m.c, object.m.d, object.m.tx, object.m.ty, ...object.cx,
  ...(object instanceof MovieClip ? [object.frame, object.playing, object.looped,
    object.graphics.length, object.clipActions.length, object.stream, object.mask] : []),
  ...(object instanceof TextFieldObj ? [object.html, object.textValue, object.htmlValue,
    object.variable, object.border, ...(object.textColor ?? []), ...Object.entries(object.format).flat()] : []),
];
const copyProps = (object: ASObject) => new Map([...object.props].map(([key, entry]) => [key, {...entry}]));
const sameEntry = (left: Entry | undefined, right: Entry | undefined) => Boolean(left && right &&
  left.n === right.n && Object.is(left.v, right.v) && left.getter === right.getter && left.setter === right.setter &&
  left.dontEnum === right.dontEnum && left.perm === right.perm && left.ro === right.ro);

/** Snapshot runtime bindings before source globals are imported or page code runs. */
export function captureGlobalsBaseline(rt: Runtime): GlobalsBaseline {
  const globalProps = copyProps(rt.Global), shellProps = copyProps(rt.shell);
  const objects: ObjectBaseline[] = [], seen = new Set<ASObject>(), queue: ASObject[] = [];
  const visit = (value: unknown) => {
    if (value instanceof ASObject && value !== rt.Global && value !== rt.shell && !seen.has(value)) {
      seen.add(value); queue.push(value);
    }
  };
  for (const entry of [...globalProps.values(), ...shellProps.values()]) {visit(entry.v); visit(entry.getter); visit(entry.setter);}
  for (const child of rt.shell.children.values()) visit(child);
  for (let index = 0; index < queue.length; index++) {
    const object = queue[index]!;
    const props = copyProps(object);
    objects.push({object, proto: object.proto, props, items: object instanceof ASArray ? object.a.slice() : undefined});
    visit(object.proto);
    for (const entry of props.values()) {visit(entry.v); visit(entry.getter); visit(entry.setter);}
    if (object instanceof ASArray) for (const value of object.a) visit(value);
  }
  return {globalProps, shellProps, objects, shellChildren: new Map(rt.shell.children),
    shellDisplay: [rt.shell, ...rt.shell.children.values()].map((object) => ({object, state: displayState(object)}))};
}

/** Capture only supported source global data, rejecting every unsupported binding. */
export function captureGlobals(rt: Runtime, baseline: GlobalsBaseline): GlobalsSnapshotResult {
  const issues: SnapshotIssue[] = [];
  const issue = (path: string, code: string) => {issues.push({path, code});};
  // Volume is explicitly host-owned. Recreating other mutated built-ins loses semantics.
  for (const [key, entry] of baseline.globalProps) {
    if (key !== rt.k('volLevel') && !sameEntry(entry, rt.Global.props.get(key))) issue(`_global.${entry.n}`, 'changed-runtime-binding');
  }
  if (rt.shell.props.size !== baseline.shellProps.size) issue('_root', 'changed-shell-bindings');
  for (const [key, entry] of baseline.shellProps) if (!sameEntry(entry, rt.shell.props.get(key))) issue(`_root.${entry.n}`, 'changed-shell-binding');
  for (const base of baseline.objects) {
    const object = base.object;
    if (object.proto !== base.proto || object.props.size !== base.props.size || object.watchers?.size ||
        [...base.props].some(([key, value]) => !sameEntry(value, object.props.get(key))) ||
        (object instanceof ASArray && (object.a.length !== base.items!.length ||
          base.items!.some((value, index) => !Object.is(value, object.a[index]))))) {
      issue('_global.<runtime-object>', 'mutated-runtime-object');
    }
  }
  for (const item of baseline.shellDisplay) {
    const state = displayState(item.object);
    if (state.length !== item.state.length || state.some((value, index) => !Object.is(value, item.state[index]))) {
      issue('_root.<display>', 'changed-shell-display-state');
    }
  }
  for (const [depth, child] of rt.shell.children) {
    if (child !== rt.page_ && baseline.shellChildren.get(depth) !== child) issue('_root', 'changed-shell-display-binding');
  }
  for (const [depth, child] of baseline.shellChildren) if (rt.shell.children.get(depth) !== child) issue('_root', 'removed-shell-display-binding');
  if (rt.registeredClasses.size || rt.intervals.size || rt.mouseListeners.length || rt.keyListeners.length) issue('<runtime>', 'active-runtime-binding');
  if (rt.Global.watchers?.size) issue('_global', 'watcher-binding');
  if (rt.Global.proto !== rt.ObjectProto) issue('_global', 'custom-prototype');
  if (rt.errors.length) issue('<runtime>', 'runtime-errors');
  const nodes: Node[] = [], pending: {object: ASObject; path: string; index: number}[] = [];
  const refs = new Map<ASObject, number>();
  let propertyCount = 0;
  const value = (item: unknown, path: string): Value => {
    if (item === null || item === undefined || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return item;
    if (!(item instanceof ASObject)) {issue(path, 'unsupported-value'); return undefined;}
    if (item.isDisplay) {issue(path, 'display-binding'); return undefined;}
    if (item.constructor !== ASObject && item.constructor !== ASArray) {issue(path, 'function-or-native-object-binding'); return undefined;}
    if (item.watchers?.size) {issue(path, 'watcher-binding'); return undefined;}
    if (item.proto !== null && item.proto !== rt.ObjectProto && item.proto !== rt.ArrayProto) {issue(path, 'custom-prototype'); return undefined;}
    const existing = refs.get(item);
    if (existing !== undefined) return Object.freeze({ref: existing});
    if (pending.length >= 10000) {issue(path, 'snapshot-node-budget'); return undefined;}
    const index = pending.length;
    refs.set(item, index); pending.push({object: item, path, index});
    return Object.freeze({ref: index});
  };
  const property = (entry: Entry, path: string): Property => {
    if (++propertyCount > 100000) issue(path, 'snapshot-property-budget');
    if (entry.getter || entry.setter) issue(path, 'accessor-binding');
    return Object.freeze({name: entry.n, value: value(entry.v, path), dontEnum: entry.dontEnum, perm: entry.perm, ro: entry.ro});
  };
  const roots: Property[] = [];
  for (const [key, entry] of rt.Global.props) {
    if (!baseline.globalProps.has(key)) roots.push(property(entry, `_global.${entry.n}`));
  }
  for (let cursor = 0; cursor < pending.length; cursor++) {
    const {object, path, index} = pending[cursor]!;
    const properties = [...object.props.values()].map((entry) => property(entry, `${path}.${entry.n}`));
    const items: {index: number; value: Value}[] = [];
    if (object instanceof ASArray) {
      if (object.a.length > 100000) issue(path, 'snapshot-array-budget');
      else for (let i = 0; i < object.a.length; i++) if (Object.hasOwn(object.a, i)) items.push(Object.freeze({index: i, value: value(object.a[i], `${path}[${i}]`)}));
    }
    nodes[index] = Object.freeze({kind: object instanceof ASArray ? 'array' : 'object',
      prototype: object.proto === null ? 'null' : object.proto === rt.ArrayProto ? 'array' : 'object',
      properties: Object.freeze(properties), ...(object instanceof ASArray ? {length: object.a.length, items: Object.freeze(items)} : {})});
  }
  if (issues.length) return Object.freeze({ok: false, issues: Object.freeze(issues)});
  return Object.freeze({ok: true, snapshot: Object.freeze({schema: 'hfr-globals-graph/1', roots: Object.freeze(roots), nodes: Object.freeze(nodes)})});
}

export function restoreGlobals(rt: Runtime, baseline: GlobalsBaseline, snapshot: GlobalsSnapshot): void {
  if (snapshot.schema !== 'hfr-globals-graph/1') throw new Error('HFR_GLOBAL_SNAPSHOT_SCHEMA');
  const objects = snapshot.nodes.map((node) => node.kind === 'array' ? new ASArray(rt, new Array(node.length)) : new ASObject(rt));
  const read = (item: Value): unknown => {
    if (item && typeof item === 'object') {
      if (!Number.isSafeInteger(item.ref) || item.ref < 0 || !objects[item.ref]) throw new Error('HFR_GLOBAL_SNAPSHOT_REFERENCE');
      return objects[item.ref];
    }
    return item;
  };
  const define = (target: ASObject, entry: Property) => target.define(entry.name, read(entry.value), {dontEnum: entry.dontEnum, perm: entry.perm, ro: entry.ro});
  snapshot.nodes.forEach((node, index) => {
    const object = objects[index]!;
    object.proto = node.prototype === 'null' ? null : node.prototype === 'array' ? rt.ArrayProto : rt.ObjectProto;
    if (object instanceof ASArray) for (const item of node.items ?? []) object.a[item.index] = read(item.value);
    for (const entry of node.properties) define(object, entry);
  });
  for (const entry of snapshot.roots) {
    if (baseline.globalProps.has(rt.k(entry.name))) throw new Error('HFR_GLOBAL_SNAPSHOT_RUNTIME_COLLISION');
    define(rt.Global, entry);
  }
}
