import {DecodedSourceStreamTransport, type DecodedSourceStreamBinding,
  type DecodedStreamSnapshot} from './decoded-source-stream-transport';
import {P050_AUDIO_CLOCKS, P050_MEASURED_BINDINGS,
  type P050AudioDomain, type P050EmbeddedDomain} from './alg-l06-p050-measured-bindings-v1';
import {initialP050State, reduceP050, type P050Event, type P050State,
  type P050Transition} from './alg-l06-p050-state-v1';

export type P050TransportV1 = Pick<DecodedSourceStreamTransport,
  'prepare' | 'play' | 'pause' | 'replay' | 'seekDecodedSample' | 'snapshot' | 'setVolume' | 'close' | 'subscribe'>;
export interface P050RuntimeOptions {
  seed?: number;
  load: (id: P050AudioDomain, signal: AbortSignal) => Promise<ArrayBuffer>;
  onSnapshot?: (snapshot: P050RuntimeSnapshot) => void;
  onCleanup?: () => void;
  makeTransport?: (binding: DecodedSourceStreamBinding, id: P050AudioDomain) => P050TransportV1;
  now?: () => number;
  resumeEnded?: (id: P050EmbeddedDomain) => Promise<boolean>;
}
export interface P050RuntimeSnapshot {
  state: P050State;
  audio: {owner: P050AudioDomain | null; selected: DecodedStreamSnapshot | null;
    streams: Partial<Record<P050AudioDomain, DecodedStreamSnapshot>>};
  ready: boolean; failure: string | null;
  spanishSelected: boolean; spanishLoading: boolean; visualClockRunning: boolean;
  clockAuthority: 'engineering-12fps-audio-context-observer';
  sourceFrameAlignmentAccepted: false; listeningAccepted: false; lessonCompleted: false;
}
type Anchor = {domain: P050EmbeddedDomain; frame: number; time: number; transportEpoch: number};
const domains = Object.keys(P050_AUDIO_CLOCKS) as P050EmbeddedDomain[];
const domainFor = (spriteId: number): P050EmbeddedDomain => {
  const id = domains.find(d => P050_AUDIO_CLOCKS[d].spriteId === spriteId);
  if (!id) throw Error('P050_UNSELECTABLE_AUDIO_SPRITE');
  return id;
};

/** One game mount owns five source streams and explicit optional SA. The
 * measured transport provides byte/PCM checks and cancellation; this class
 * keeps the game clock, score clock, source stops and async ownership together.
 * MP3 latency and original Flash synchronization remain separate evidence. */
export class P050PageRuntimeV1 {
  private state: P050State;
  private readonly tracks = new Map<P050AudioDomain, P050TransportV1>();
  private readonly contexts: Partial<Record<P050AudioDomain, AudioContext>> = {};
  private readonly abort = new AbortController();
  private saAbort: AbortController | null = null;
  private readonly positions: Record<P050EmbeddedDomain, number> =
    {main: 1, wrong: 2, correct358: 2, correct432: 2, correct479: 2};
  private owner: P050AudioDomain | null = null;
  private anchor: Anchor | null = null;
  private enterFrameDue: number | null = null;
  private ready = false;
  private started = false;
  private closed = false;
  private ticking = false;
  private ticket = 0;
  private volume = 1;
  private failure: string | null = null;
  private spanishSelected = false;
  private spanishLoading = false;
  private spanishPrepared = false;
  private readonly subscriptions: (() => void)[] = [];
  private notificationQueued = false;

  constructor(private readonly options: P050RuntimeOptions) {
    this.state = initialP050State(options.seed ?? 0);
  }
  private now() {return this.options.now?.() ?? performance.now() / 1000;}
  private context(id: P050AudioDomain) {
    return this.contexts[id] ?? (this.contexts[id] = new AudioContext({
      sampleRate: P050_MEASURED_BINDINGS[id].sampleRate, latencyHint: 'interactive'}));
  }
  private track(id: P050AudioDomain) {
    let track = this.tracks.get(id);
    if (!track) {
      track = this.options.makeTransport?.(P050_MEASURED_BINDINGS[id], id) ??
        new DecodedSourceStreamTransport(P050_MEASURED_BINDINGS[id], {createContext: () => this.context(id)});
      track.setVolume(this.volume); this.tracks.set(id, track);
      this.subscriptions.push(track.subscribe(() => {
        // Audio EOF and browser interruption also occur while the game RAF is
        // held for Spanish Audio. Publish after the current operation finishes
        // so the host observes the settled owner/loading state.
        if (this.notificationQueued || this.closed) return;
        this.notificationQueued = true;
        queueMicrotask(() => {this.notificationQueued = false; this.publish();});
      }));
    }
    return track;
  }
  snapshot(): P050RuntimeSnapshot {
    const streams = Object.fromEntries([...this.tracks].map(([id, track]) => [id, track.snapshot()]));
    return {state: this.state, audio: {owner: this.owner,
      selected: this.owner ? streams[this.owner] ?? null : null, streams},
      ready: this.ready && !this.closed, failure: this.failure,
      spanishSelected: this.spanishSelected, spanishLoading: this.spanishLoading,
      visualClockRunning: !!this.anchor || this.enterFrameDue !== null,
      clockAuthority: 'engineering-12fps-audio-context-observer',
      sourceFrameAlignmentAccepted: false, listeningAccepted: false, lessonCompleted: false};
  }
  private publish() {if (!this.closed) this.options.onSnapshot?.(this.snapshot());}
  private live(ticket: number, epoch: number) {
    return !this.closed && ticket === this.ticket && epoch === this.state.epoch;
  }
  async start() {
    if (this.started || this.closed) return false;
    this.started = true;
    try {
      const rows = await Promise.all(domains.map(async id => [id, await this.options.load(id, this.abort.signal)] as const));
      if (this.closed) return false;
      for (const [id, bytes] of rows) {
        const result = await this.track(id).prepare(bytes);
        if (this.closed) return false;
        if (!result.accepted) throw Error(`${id}: ${result.reason}`);
      }
      // Preloading is mount-owned and never starts a stream or changes game
      // state, including when Replay was pressed while the bytes were loading.
      this.ready = true; this.publish(); return true;
    } catch (error) {
      if (!this.closed) {this.abort.abort(); this.failure = String(error); this.publish();}
      return false;
    }
  }
  private position() {
    const a = this.anchor, s = a ? this.tracks.get(a.domain)?.snapshot() : null;
    return a && s && s.contextTime !== null && s.epoch === a.transportEpoch
      ? a.frame + Math.max(0, s.contextTime - a.time) * 12 : null;
  }
  private hold() {
    const position = this.position();
    if (this.anchor && position !== null) this.positions[this.anchor.domain] = position;
    this.anchor = null; this.ticket++;
    this.saAbort?.abort(); this.saAbort = null;
    for (const track of this.tracks.values())
      if (['playing', 'start-pending'].includes(track.snapshot().phase)) track.pause();
    this.owner = null;
  }
  private failed(reason: string) {
    this.hold(); this.failure = reason;
    const paused = reduceP050(this.state, {type: 'pause', epoch: this.state.epoch});
    if (paused.accepted) this.state = paused.state;
    this.publish();
  }
  private async playDomain(id: P050EmbeddedDomain, frame: number, restart: boolean) {
    const ticket = ++this.ticket, epoch = this.state.epoch, reducerOwner = this.state.audioOwner;
    const track = this.track(id), clock = P050_AUDIO_CLOCKS[id];
    try {
      if (restart) {
        this.positions[id] = frame;
        const sample = frame === clock.entryFrame ? clock.decodedEntrySample :
          Math.ceil(Math.max(0, frame - clock.firstAudioFrame) * P050_MEASURED_BINDINGS[id].sampleRate / 12);
        const seek = track.seekDecodedSample(Math.min(sample, P050_MEASURED_BINDINGS[id].decodedSamples));
        if (!seek.accepted) throw Error(seek.reason);
      } else this.positions[id] = Math.max(frame, this.positions[id]);
      this.owner = id;
      const delay = Math.max(0, (clock.firstAudioFrame - this.positions[id]) / 12);
      const result = await track.play({activation: 'user', reducedMotion: false, delaySeconds: delay});
      if (!this.live(ticket, epoch) || this.state.audioOwner !== reducerOwner || this.spanishSelected) return;
      let snapshot = track.snapshot();
      if (!result.accepted && snapshot.phase === 'buffer-ended') {
        const resumed = this.options.resumeEnded ? await this.options.resumeEnded(id) :
          await this.context(id).resume().then(() => this.context(id).state === 'running');
        if (!this.live(ticket, epoch)) return;
        if (!resumed) throw Error('P050_VISUAL_TAIL_CLOCK_UNAVAILABLE');
        snapshot = track.snapshot();
      } else if (!result.accepted) throw Error(result.reason);
      if (snapshot.contextTime === null) throw Error('P050_AUDIO_CONTEXT_UNAVAILABLE');
      this.anchor = {domain: id, frame: this.positions[id], transportEpoch: snapshot.epoch,
        time: snapshot.playbackAnchor ? snapshot.playbackAnchor.contextTime - delay : snapshot.contextTime};
      this.failure = null; this.publish();
    } catch (error) {if (this.live(ticket, epoch)) this.failed(String(error));}
  }
  private apply(event: P050Event): P050Transition {
    const result = reduceP050(this.state, event);
    if (!result.accepted) return result;
    const priorDomain = this.anchor?.domain;
    if (result.effects.some(e => e.type === 'audio:cancelAll')) {
      this.hold();
      if (event.type === 'advance-main') this.positions.main = result.state.mainFrame;
      if (event.type === 'advance-feedback' && priorDomain)
        this.positions[priorDomain] = result.state.feedback?.frame ?? this.state.feedback!.endFrame;
    }
    this.state = result.state;
    if (event.type === 'start-game') this.enterFrameDue = this.now() + 1 / 12;
    if (event.type === 'enter-frame' || event.type === 'replay' || event.type === 'leave') this.enterFrameDue = null;
    if (event.type === 'replay') {
      for (const id of domains) this.positions[id] = P050_AUDIO_CLOCKS[id].entryFrame;
      for (const track of this.tracks.values()) track.replay();
      this.spanishSelected = false; this.spanishLoading = false; this.failure = null;
    }
    for (const effect of result.effects) {
      if (effect.type === 'audio:start') void this.playDomain(domainFor(effect.spriteId), effect.frame,
        event.type === 'choose' || event.type === 'close-wrong');
      if (effect.type === 'host:cleanup') this.options.onCleanup?.();
    }
    this.publish(); return result;
  }
  send(event: P050Event): P050Transition {
    if (this.closed || !this.ready && !['replay', 'leave', 'pause'].includes(event.type) ||
        this.spanishSelected && !['replay', 'leave'].includes(event.type))
      return {accepted: false, reason: 'page unavailable or Spanish Audio selected', state: this.state, effects: []};
    this.tick(); return this.apply(event);
  }
  play() {
    if (this.spanishSelected) {void this.startSpanish(); return;}
    this.send({type: 'play', epoch: this.state.epoch});
  }
  pause() {
    if (this.spanishSelected) {this.hold(); this.spanishLoading = false; this.publish(); return;}
    this.send({type: 'pause', epoch: this.state.epoch});
  }
  replay() {return this.send({type: 'replay', epoch: this.state.epoch}).accepted;}
  tick() {
    if (this.closed || this.ticking || this.spanishSelected) return;
    this.ticking = true;
    try {
      if (this.enterFrameDue !== null && this.now() >= this.enterFrameDue)
        this.apply({type: 'enter-frame', epoch: this.state.epoch});
      const a = this.anchor;
      if (!a) return;
      const audio = this.tracks.get(a.domain)!.snapshot();
      if (audio.epoch !== a.transportEpoch || !['playing', 'buffer-ended'].includes(audio.phase)) {
        this.failed('P050_AUDIO_CLOCK_INTERRUPTED'); return;
      }
      const position = this.position(); if (position === null) return;
      const s = this.state, frame = Math.floor(position + 1e-8);
      if (s.scoreAnimation) {
        const scoreFrame = s.scoreAnimation.endFrame === 20 && frame >= 3 ? frame + 8 : frame;
        if (scoreFrame > s.scoreAnimation.frame) this.apply({type: 'advance-score', epoch: s.epoch,
          token: s.scoreAnimation.token, frame: Math.min(scoreFrame, s.scoreAnimation.endFrame)});
      }
      if (a.domain === 'main' && frame > s.mainFrame)
        this.apply({type: 'advance-main', epoch: s.epoch, frame: Math.min(662, frame)});
      else if (s.feedback && frame > s.feedback.frame) {
        const last = s.phase === 'wrong-feedback' ? 23 : s.feedback.endFrame;
        this.apply({type: 'advance-feedback', epoch: s.epoch, token: s.feedback.token, frame: Math.min(last, frame)});
      }
      if (audio.phase === 'buffer-ended' && this.state.audioOwner)
        this.apply({type: 'audio-complete', epoch: this.state.epoch, owner: this.state.audioOwner});
    } finally {this.ticking = false;}
  }
  async startSpanish() {
    if (!this.ready || this.closed || this.spanishLoading || this.state.startRequested) return false;
    this.tick();
    if (!this.spanishSelected) {
      const pause = reduceP050(this.state, {type: 'pause', epoch: this.state.epoch});
      this.hold(); if (pause.accepted) this.state = pause.state;
      this.spanishSelected = true;
    }
    const ticket = ++this.ticket, epoch = this.state.epoch;
    const controller = new AbortController(); this.saAbort = controller;
    this.spanishLoading = true; this.publish();
    try {
      // Called only by an explicit user control. Locale never enters this path.
      if (!this.options.makeTransport) await this.context('sa').resume();
      if (!this.live(ticket, epoch)) return false;
      const track = this.track('sa');
      if (!this.spanishPrepared) {
        const bytes = await this.options.load('sa', controller.signal);
        if (!this.live(ticket, epoch) || controller.signal.aborted) return false;
        const prepared = await track.prepare(bytes);
        if (!this.live(ticket, epoch) || controller.signal.aborted) return false;
        if (!prepared.accepted) throw Error(prepared.reason);
        this.spanishPrepared = true;
      }
      if (track.snapshot().phase === 'buffer-ended') track.replay();
      this.owner = 'sa';
      const result = await track.play({activation: 'user', reducedMotion: false});
      if (!this.live(ticket, epoch)) return false;
      this.spanishLoading = false; this.failure = result.accepted ? null : result.reason;
      this.publish(); return result.accepted;
    } catch (error) {
      if (this.live(ticket, epoch)) {this.spanishLoading = false; this.failure = String(error); this.publish();}
      return false;
    }
  }
  returnMain() {
    if (!this.spanishSelected || this.closed) return false;
    this.hold(); this.tracks.get('sa')?.replay();
    this.spanishSelected = false; this.spanishLoading = false; this.publish(); return true;
  }
  setVolume(value: number) {
    if (this.closed || !Number.isFinite(value) || value < 0 || value > 1) return false;
    this.volume = value;
    for (const track of this.tracks.values()) track.setVolume(value);
    this.publish(); return true;
  }
  async close() {
    if (this.closed) return;
    this.apply({type: 'leave', epoch: this.state.epoch});
    this.closed = true; this.ready = false; this.abort.abort(); this.saAbort?.abort();
    for (const unsubscribe of this.subscriptions) unsubscribe();
    await Promise.all([...this.tracks.values()].map(track => track.close()));
    await Promise.all(Object.values(this.contexts).filter(c => c.state !== 'closed').map(c => c.close()));
  }
}
