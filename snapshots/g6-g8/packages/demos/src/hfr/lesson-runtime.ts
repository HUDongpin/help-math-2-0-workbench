/* eslint-disable @typescript-eslint/no-explicit-any */
import {Runtime, type RuntimeOptions} from './display';
import {makeHelpers} from './helpers';
import {captureEntryState, type EntryState} from './entry-state';
import type {PageData, PageFactory} from './types';

export interface LessonPageBinding {
  readonly lessonKey: string; readonly pageKey: string;
  readonly sourceSha256: string; readonly compiler: string; readonly seed: number;
}
type Resources = Pick<RuntimeOptions,'audio'|'host'|'hitTest'>;
export interface RuntimeLease {readonly token: number; readonly binding: LessonPageBinding; readonly disposition: 'new-lesson'|'navigation'|'replay'}

/** Owned by one modern lesson host. Never transfers AS values between VMs. */
export class LessonRuntime {
  private rt?: Runtime;
  private current?: RuntimeLease;
  private last?: RuntimeLease;
  private entry?: EntryState;
  private nextToken = 0;
  private pageFactory?: PageFactory;
  private data?: PageData;
  private failed = false;
  private transitioning = false;
  readonly failures: string[] = [];

  private check(binding: LessonPageBinding, data: PageData): void {
    const lessonKey = `shared-${data.placement.module.toLowerCase()}-l${String(data.placement.lesson).padStart(2,'0')}`;
    if (binding.lessonKey !== lessonKey || binding.pageKey !== data.placement.animationId ||
        !/^[a-f0-9]{64}$/u.test(binding.sourceSha256) || binding.sourceSha256 !== data.source.sha256 ||
        binding.compiler !== data.compiler || !Number.isSafeInteger(binding.seed) || binding.seed < 0)
      throw new Error('HFR_LESSON_BINDING_INVALID');
    if (this.last && (binding.lessonKey !== this.last.binding.lessonKey || binding.seed !== this.last.binding.seed))
      throw new Error('HFR_LESSON_VM_BINDING_CHANGED');
    if (this.last?.binding.pageKey === binding.pageKey &&
        (binding.sourceSha256 !== this.last.binding.sourceSha256 || binding.compiler !== this.last.binding.compiler))
      throw new Error('HFR_REPLAY_ENTRY_BINDING_CHANGED');
  }
  /** SWF 6 and SWF 7 disagree on name lookup. A different version is a new movie. */
  private abandonVm(): void {
    try { this.rt?.audio?.stopAll(); } catch { /* The replacement movie does not inherit this VM. */ }
    this.rt = undefined;
    this.entry = undefined;
    this.last = undefined;
    this.current = undefined;
    this.pageFactory = undefined;
    this.data = undefined;
  }
  private resources(resources: Resources): void {
    this.rt!.audio = resources.audio ?? null; this.rt!.hostCb = resources.host; this.rt!.hitTestFn = resources.hitTest;
  }
  private healthy(): void {
    if (this.rt!.errors.length) throw new Error(`HFR_LESSON_SOURCE_ERROR: ${this.rt!.errors.join('; ')}`);
  }
  enter(binding: LessonPageBinding, data: PageData, factory: PageFactory, resources: Resources = {}): RuntimeLease {
    let mutated = false;
    try {
      if (this.failed || this.transitioning) throw new Error('HFR_LESSON_VM_UNAVAILABLE');
      this.check(binding,data);
      const versionChanged = this.rt !== undefined && data.source.swfVersion !== this.rt.version;
      const samePage = this.last?.binding.pageKey === binding.pageKey;
      if (samePage && (factory !== this.pageFactory || data !== this.data || versionChanged)) throw new Error('HFR_REPLAY_PAYLOAD_IDENTITY_CHANGED');
      const disposition = samePage ? 'replay' : this.rt && !versionChanged ? 'navigation' : 'new-lesson';
      // Invalidate old player callbacks before any unload or source code runs.
      mutated = true; this.transitioning = true;
      this.current = undefined;
      if (versionChanged) this.abandonVm();
      if (this.rt) {this.rt.unloadPage(); this.healthy();}
      if (samePage) {
        if (!this.entry) throw new Error('HFR_REPLAY_ENTRY_UNAVAILABLE');
        this.resources(resources); this.entry.restore(); this.rt!.runQueue();
      } else {
        if (!this.rt) {this.rt = new Runtime(data,{...resources,seed:binding.seed}); this.rt.helpers = makeHelpers(this.rt);}
        else {
          this.rt.page = data; this.resources(resources);
          this.rt.streamsByTimeline.clear(); for (const stream of data.streams) this.rt.streamsByTimeline.set(stream.timeline,stream);
          // getTimer/RNG belong to the persistent VM; navigation does not reseed
          // or reset its clock. Replay restores this page's captured entry clock.
          this.rt.initDone.clear(); this.rt.opsExecuted = 0;
          this.rt.hostLog.length = 0; this.rt.notes.clear(); this.rt.errors.length = 0;
          for (const map of Object.values(this.rt.missing)) map.clear();
        }
        // The modern host never configures the legacy report endpoint.
        this.rt.shell.set("Report_URL", "");
        this.pageFactory = factory; this.data = data; this.rt.scripts = factory(this.rt.helpers);
        this.rt.loadPage(() => {this.entry = captureEntryState(this.rt!);});
      }
      this.healthy();
      const lease = Object.freeze({token:++this.nextToken,binding:Object.freeze({...binding}),disposition});
      this.current = this.last = lease; return lease;
    } catch (error) {if (mutated) this.failed = true; this.failures.push(String(error)); throw error;}
    finally {if (mutated) this.transitioning = false;}
  }
  active(lease: RuntimeLease): Runtime | null {return this.current?.token === lease.token ? this.rt! : null;}
  tick(lease: RuntimeLease): boolean {
    const rt = this.active(lease); if (!rt) return false;
    try {rt.tick(); this.healthy(); return true;}
    catch (error) {this.current = undefined; this.failed = true; this.failures.push(String(error)); throw error;}
  }
  get entryObjectCount(): number {return this.entry?.objectCount ?? 0;}
  /** Call before the old player's media resources are destroyed. */
  release(lease: RuntimeLease): boolean {
    if (!this.active(lease)) return false;
    this.current = undefined; this.transitioning = true;
    try {this.rt!.unloadPage(); this.healthy(); return true;}
    catch (error) {this.failed = true; this.failures.push(String(error)); throw error;}
    finally {this.transitioning = false;}
  }
  close(): void {
    this.current = undefined; this.transitioning = true;
    try {this.rt?.unloadPage();}
    finally {this.rt = undefined; this.entry = undefined; this.last = undefined; this.pageFactory = undefined; this.data = undefined; this.failed = false; this.transitioning = false;}
  }
}
