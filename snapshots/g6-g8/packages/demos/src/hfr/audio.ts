// HFR runtime · WebAudio engine. Streamed narration follows Flash semantics:
// while a timeline with a sound stream plays, its playhead follows the audio
// clock (frames are skipped when late and held when early).
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AudioSink, MovieClip } from "./display";
import type { StreamInfo } from "./types";

export class AudioEngine implements AudioSink {
  private closed = false;
  private enabled = true;
  private wantedRunning = false;
  private eventGeneration = 0;
  // Natural completion is distinct from an explicit stop/seek. While the
  // source timeline still asks for its final frame, release audio sync instead
  // of creating another source for the same short tail.
  private completedStreams = new Map<MovieClip, { stream: StreamInfo; frame: number; resumeFrame?: number; targetFrame?: number }>();
  onStateChange?: () => void;
  ctx: AudioContext; gain: GainNode; buffers = new Map<string, AudioBuffer>(); active = new Map<MovieClip, { src: AudioBufferSourceNode; startedAt: number; offset: number; stream: StreamInfo; endTime: number; endFrame: number; resumeFrame?: number }>();
  events = new Map<string, AudioBufferSourceNode[]>(); muted = false; volume = 1;
  constructor(public baseUrl: string, public fps: number) {
    this.ctx = new AudioContext(); this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination);
    this.ctx.onstatechange = () => {
      if (this.closed) return;
      // A late resume must not undo a newer pause. Never auto-resume from this event.
      if (!this.wantedRunning && this.ctx.state === "running") void this.ctx.suspend().catch(() => undefined);
      this.notify();
    };
  }
  async preload(srcs: string[]): Promise<void> {
    await Promise.all([...new Set(srcs)].map(async (s) => {
      if (this.closed || this.buffers.has(s)) return;
      try {
        const response = await fetch(this.baseUrl + s);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (this.closed) return;
        const decoded = await this.ctx.decodeAudioData(bytes);
        if (!this.closed) this.buffers.set(s, decoded);
      } catch (cause) {
        throw new Error(`HFR audio could not load required media ${s}`, { cause });
      }
    }));
  }
  resume(): Promise<void> { if (this.closed) return Promise.resolve(); this.wantedRunning = true; return this.ctx.resume(); }
  suspend(): Promise<void> { if (this.closed) return Promise.resolve(); this.wantedRunning = false; return this.ctx.suspend(); }
  /** Host narration intent is independent from authored Sound.stop/stopAll. */
  setEnabled(enabled: boolean): void { if (this.closed) return; this.enabled = enabled; if (!enabled) this.stopAll(); }
  private notify(): void { if (!this.closed) this.onStateChange?.(); }
  setMuted(m: boolean): void { this.muted = m; this.gain.gain.value = m ? 0 : this.volume; }
  setVolume(v: number): void { this.volume = Math.max(0, Math.min(1, v / 100)); if (!this.muted) this.gain.gain.value = this.volume; }
  timeOfFrame(st: StreamInfo, frame: number): number | null {
    let best: number | null = null;
    for (const [f, s] of st.frames) { if (f <= frame) best = s; else break; }
    if (best === null) return null;
    return best / st.rate;
  }
  frameOfTime(st: StreamInfo, t: number): number {
    const samples = t * st.rate; let f = st.frames[0][0];
    for (const [fr, s] of st.frames) { if (s <= samples) f = fr; else break; }
    return f;
  }
  // A missing indexed source-frame interval breaks audio-clock authority.
  // Zero-sample blocks within a consecutive run (e.g. source frame8) do not.
  private streamRun(st: StreamInfo, frame: number): { endFrame: number; endTime: number; resumeFrame?: number } | null {
    let first = st.frames[0][0];
    for (let i = 0; i < st.frames.length; i++) {
      const current = st.frames[i], next = st.frames[i + 1];
      if (!next || next[0] !== current[0] + 1) {
        if (frame >= first && frame <= current[0]) return { endFrame: current[0], endTime: next ? next[1] / st.rate : Infinity, resumeFrame: next?.[0] };
        if (next) first = next[0];
      }
    }
    return null;
  }
  streamFrame(clip: MovieClip, st: StreamInfo, frame: number): number | null {
    if (this.closed || !this.enabled) return null;
    const buf = this.buffers.get(st.src); if (!buf || this.ctx.state !== "running") return null;
    const completed = this.completedStreams.get(clip);
    if (completed?.stream === st) {
      if (frame >= completed.frame && (completed.resumeFrame === undefined || frame < completed.resumeFrame)) {
        return completed.targetFrame !== undefined && frame < completed.targetFrame ? completed.targetFrame : null;
      }
      this.completedStreams.delete(clip); // a real rewind or the next authored run
    }
    const first = st.frames[0][0], last = st.frames[st.frames.length - 1][0];
    let a = this.active.get(clip);
    if (a) {
      const t = a.offset + (this.ctx.currentTime - a.startedAt);
      if (t >= a.endTime) {
        this.active.delete(clip);
        this.completedStreams.set(clip, { stream: a.stream, frame, resumeFrame: a.resumeFrame, targetFrame: a.resumeFrame === undefined ? undefined : a.endFrame });
        try { a.src.stop(); } catch { /* already ended */ }
        this.notify();
        return a.resumeFrame === undefined ? null : Math.max(frame, a.endFrame);
      }
      const expected = Math.min(a.endFrame, this.frameOfTime(st, t));
      if (Math.abs(expected - frame) <= 3 || expected > frame) return Math.max(frame, expected);
      this.streamStop(clip); a = undefined; // the timeline jumped: re-seek below
    }
    if (frame < first || frame > last) return null;
    const run = this.streamRun(st, frame); if (!run) return null;
    const off = this.timeOfFrame(st, frame) ?? 0, endTime = Math.min(buf.duration, run.endTime);
    if (off >= endTime) return null;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.connect(this.gain);
    if (run.resumeFrame === undefined) src.start(0, off); else src.start(0, off, endTime - off);
    this.active.set(clip, { src, startedAt: this.ctx.currentTime, offset: off, stream: st, endTime, endFrame: run.endFrame, resumeFrame: run.resumeFrame });
    src.onended = () => { if (!this.closed && this.active.get(clip)?.src === src) {this.active.delete(clip); this.completedStreams.set(clip, { stream: st, frame: clip.frame, resumeFrame: run.resumeFrame, targetFrame: run.resumeFrame === undefined ? undefined : run.endFrame }); this.notify();} };
    this.notify();
    return frame + 1;
  }
  streamStop(clip: MovieClip): void { this.completedStreams.delete(clip); const a = this.active.get(clip); if (a) { this.active.delete(clip); try { a.src.stop(); } catch { /* already stopped */ } this.notify(); } }
  playEvent(src: string, info: any): void {
    if (this.closed || !this.enabled) return;
    const buf = this.buffers.get(src);
    if (info?.stop) { for (const s of this.events.get(src) ?? []) try { s.stop(); } catch { /* */ } this.events.set(src, []); return; }
    if (!buf) {
      const generation = this.eventGeneration;
      void this.preload([src]).then(() => {
        if (!this.closed && this.enabled && generation === this.eventGeneration && this.buffers.has(src)) this.playEvent(src, info);
      });
      return;
    }
    if (info?.noMultiple && (this.events.get(src)?.length ?? 0) > 0) return;
    const s = this.ctx.createBufferSource(); s.buffer = buf; if (info?.loops > 1) { s.loop = true; setTimeout(() => { try { s.stop(); } catch { /* */ } }, buf.duration * info.loops * 1000); }
    s.connect(this.gain); s.start();
    const list = this.events.get(src) ?? []; list.push(s); this.events.set(src, list);
    s.onended = () => {
      if (this.closed || !this.events.get(src)?.includes(s)) return;
      const remaining = this.events.get(src)!.filter((x) => x !== s);
      if (remaining.length) this.events.set(src, remaining); else this.events.delete(src);
      this.notify();
    };
    this.notify();
  }
  stopAll(): void { this.eventGeneration++; this.completedStreams.clear(); for (const c of [...this.active.keys()]) this.streamStop(c); for (const l of this.events.values()) for (const s of l) try { s.stop(); } catch { /* */ } this.events.clear(); this.notify(); }
  close(): void { if (this.closed) return; this.closed = true; this.wantedRunning = false; this.ctx.onstatechange = null; this.onStateChange = undefined; this.stopAll(); void this.ctx.close(); }
}
