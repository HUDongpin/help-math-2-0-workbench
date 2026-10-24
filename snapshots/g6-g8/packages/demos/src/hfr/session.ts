// One persistent source VM per mounted modern lesson host. Reservations protect
// asynchronous media loading; Runtime leases protect source execution/cleanup.
import type {RendererLessonSessionScope} from '../contract';
import type {LessonRuntime, LessonPageBinding, RuntimeLease} from './lesson-runtime';
import type {RuntimeOptions} from './display';
import type {PageData, PageFactory} from './types';

export interface PageSessionBinding extends LessonPageBinding {readonly hostScope: RendererLessonSessionScope}
export interface PageSessionLease extends PageSessionBinding {readonly token: number}
interface Session {
  readonly lessonKey: string;
  readonly runtime: LessonRuntime;
  request: number;
  cached?: {binding: LessonPageBinding; data: PageData; factory: PageFactory; dataSha256: string};
}
const sessions = new WeakMap<RendererLessonSessionScope,Session>();
let nextToken = 0;
export class HfrSessionError extends Error {
  constructor(readonly code: string) {super(code);this.name='HfrSessionError';}
}
export function hfrSessionFailureCode(error: unknown): string {
  if (error instanceof HfrSessionError) return error.code;
  const code=error instanceof Error ? /^HFR_[A-Z0-9_]+(?=:|$)/u.exec(error.message)?.[0] : undefined;
  return code ?? 'HFR_PAGE_LOAD_FAILED';
}
export function beginPageSession(binding: PageSessionBinding, createRuntime: () => LessonRuntime): PageSessionLease {
  if (!binding.hostScope?.id || !binding.lessonKey || !binding.pageKey || !binding.compiler ||
      !Number.isSafeInteger(binding.seed) || binding.seed < 0 || !/^[a-f0-9]{64}$/u.test(binding.sourceSha256))
    throw new HfrSessionError('HFR_SESSION_BINDING_INVALID');
  let session=sessions.get(binding.hostScope);
  if (session && session.lessonKey !== binding.lessonKey) {session.runtime.close();sessions.delete(binding.hostScope);session=undefined;}
  if (!session) {session={lessonKey:binding.lessonKey,runtime:createRuntime(),request:0};sessions.set(binding.hostScope,session);}
  session.request=++nextToken;
  return Object.freeze({...binding,token:session.request});
}
export function isPageSessionCurrent(lease: PageSessionLease): boolean {return sessions.get(lease.hostScope)?.request === lease.token;}
/** Native preparation and execution must use the same retained payload object. */
export function resolvePageSessionData(lease: PageSessionLease, data: PageData, factory: PageFactory, dataSha256: string): PageData {
  const session=sessions.get(lease.hostScope);
  if (!session || !isPageSessionCurrent(lease)) throw new HfrSessionError('HFR_SESSION_RESERVATION_STALE');
  if (!/^[a-f0-9]{64}$/u.test(dataSha256)) throw new HfrSessionError('HFR_SESSION_DATA_HASH_INVALID');
  const cached=session.cached;
  if (cached?.binding.pageKey === lease.pageKey) {
    if (cached.dataSha256 !== dataSha256 || cached.factory !== factory)
      throw new HfrSessionError('HFR_REPLAY_PAYLOAD_CHANGED');
    return cached.data;
  }
  return data;
}
export function activatePageSession(lease: PageSessionLease, data: PageData, factory: PageFactory, dataSha256: string,
  resources: Pick<RuntimeOptions,'audio'|'host'|'hitTest'>): {owner: LessonRuntime; lease: RuntimeLease} {
  data=resolvePageSessionData(lease,data,factory,dataSha256);
  const session=sessions.get(lease.hostScope)!;
  const active=session.runtime.enter(lease,data,factory,resources);
  session.cached={binding:lease,data,factory,dataSha256};
  return {owner:session.runtime,lease:active};
}
export function disposeLessonSession(scope: RendererLessonSessionScope): void {
  const session=sessions.get(scope);if (!session) return;
  sessions.delete(scope);session.runtime.close();
}
