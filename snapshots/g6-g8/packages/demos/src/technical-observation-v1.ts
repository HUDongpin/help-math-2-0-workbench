/** Read-only diagnostics for successful product commits. No source controls. */
export interface TechnicalOwner {
  readonly animationId: string; readonly sourceSha256: string; readonly playerId: string;
  readonly ownerKind: 'source-vm'|'surface-run'; readonly replay: number;
  readonly surfaceId?: string; readonly runEpoch?: number; readonly runToken?: string; readonly leaseToken?: number|string;
}
type Source = Record<string, unknown> & {frame: number; frameDomain: string; errors: readonly string[]; missing: readonly unknown[]; tick?: number};
type Commit = {status: string; identity: TechnicalOwner; source: Record<string, unknown>; render: Record<string, unknown>; host: Record<string, unknown>};
const objectIds = new WeakMap<object, string>(), resourceOwners = new WeakMap<object, TechnicalOwner>();
const observations = new WeakMap<Element, {value: Commit; sequence: number; tick: number; sourceKey: string}>();
const lifecycleReads = new WeakMap<Element, {playerId: string; read: () => Record<string, unknown>}>();
let serial = 0;
export function technicalObjectId(object: object, prefix: string): string {
  let id = objectIds.get(object); if (!id) {id = `${prefix}:${++serial}`; objectIds.set(object, id);} return id;
}
export function nativeTechnicalOwner(instance: object, surface: Element, animationId: string, sourceSha256: string, replay: number): TechnicalOwner {
  const surfaceId = technicalObjectId(surface, 'surface'), runToken = `${technicalObjectId(instance, 'runtime')}:replay:${replay}`;
  return Object.freeze({animationId, sourceSha256, playerId: runToken, ownerKind: 'surface-run', surfaceId, replay, runEpoch: replay, runToken});
}
export function bindTechnicalOwner<T extends object>(resource: T, owner: TechnicalOwner|null|undefined): T {
  if (owner) resourceOwners.set(resource, Object.freeze({...owner})); exposeOperationRead(); return resource;
}
export function readTechnicalResourceOwner(resource: unknown): TechnicalOwner|null {
  return resource !== null && (typeof resource === 'object' || typeof resource === 'function') ? resourceOwners.get(resource as object) ?? null : null;
}
function exposeOperationRead(): void {
  if (typeof window !== 'undefined' && !Object.hasOwn(window, '__g678ReadOperationOwner')) Object.defineProperty(window, '__g678ReadOperationOwner', {
    value: readTechnicalResourceOwner, configurable: false, writable: false});
}
function exposeRead(surface: Element): void {
  if (!Object.hasOwn(surface, '__g678TechnicalRead')) Object.defineProperty(surface, '__g678TechnicalRead', {value: () => {
    const row = observations.get(surface); if (!row) return {status: 'loading'};
    const lifecycle = lifecycleReads.get(surface);
    return structuredClone({...row.value, status: surface.isConnected ? row.value.status : 'retired',
      ...(lifecycle?.playerId === row.value.identity.playerId ? {lifecycle: lifecycle.read()} : {})});
  }, configurable: false, writable: false});
  exposeOperationRead();
}
/** Retain an actual producer reader for the exact page lease. Detachment alone
 * supplies no resource-cleanup or shared-VM-lifetime assertion. */
export function bindTechnicalLifecycle(surface: Element, identity: TechnicalOwner, read: () => Record<string, unknown>): void {
  lifecycleReads.set(surface, {playerId: identity.playerId, read}); exposeRead(surface);
}
/** Call only after asset.render/renderer.render returns successfully or React's
 * layout effect confirms that this exact source snapshot reached its DOM. */
export function publishTechnicalCommit(surface: Element, identity: TechnicalOwner, rendererFamily: string, source: Source, host: Record<string, unknown> = {}): void {
  const previous = observations.get(surface), sameRun = previous?.value.identity.playerId === identity.playerId;
  const sourceKey = JSON.stringify(source), sequence = (previous?.sequence ?? 0) + 1;
  const tick = identity.ownerKind === 'source-vm' ? source.tick! : sameRun ? previous!.tick + Number(previous!.sourceKey !== sourceKey) : 1;
  const surfaceId = identity.surfaceId ?? technicalObjectId(surface, 'surface');
  const value: Commit = {status: 'ready', identity: {...identity}, source: {...source, tick,
    observedFrom: identity.ownerKind === 'source-vm' ? 'source-runtime' : 'renderer-state',
    tickKind: identity.ownerKind === 'source-vm' ? 'source-tick' : 'observed-committed-paint', clockOwnerId: identity.playerId},
    render: {status: 'ready', animationId: identity.animationId, rendererFamily, surfaceId, commitId: `${surfaceId}:commit:${sequence}`,
      commitSequence: sequence, committedAtMs: performance.now(), sourceTick: tick, sourceFrame: source.frame, sourceFrameDomain: source.frameDomain}, host: {...host}};
  observations.set(surface, {value, sequence, tick, sourceKey}); exposeRead(surface);
}
/** Nonvisual state is read from the actual source/host while the already drawn
 * frame stays bound. This never declares a paint or increments a source tick. */
export function publishTechnicalState(surface: Element, identity: TechnicalOwner, source: Record<string, unknown>, host: Record<string, unknown>): void {
  const row = observations.get(surface); if (!row || row.value.identity.playerId !== identity.playerId) return;
  const {frame, frameDomain, tick, ...nonvisual} = source;
  if (frame !== undefined && frame !== row.value.source.frame || frameDomain !== undefined && frameDomain !== row.value.source.frameDomain || tick !== undefined && tick !== row.value.source.tick) return;
  row.value = {...row.value, source: {...row.value.source, ...nonvisual}, host: {...row.value.host, ...host}};
}
export function retireTechnicalObservation(surface: Element|null, identity?: TechnicalOwner|null): void {
  if (!surface) return; const row = observations.get(surface);
  if (row && (!identity || row.value.identity.playerId === identity.playerId)) row.value = {...row.value, status: 'retired'};
}
export function failTechnicalObservation(surface: Element|null, error: unknown): void {
  if (!surface) return; const row = observations.get(surface); if (!row) return;
  row.value = {...row.value, status: 'failed', render: {...row.value.render, status: 'failed'},
    source: {...row.value.source, errors: [...(row.value.source.errors as string[]), String(error)]}};
}
