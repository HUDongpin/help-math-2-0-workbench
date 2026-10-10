// HFR runtime · WebAudio engine. Streamed narration follows Flash semantics:
// while a timeline with a sound stream plays, its playhead follows the audio
// clock (frames are skipped when late and held when early).
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AudioSink, MovieClip } from "./display";
import type { StreamInfo } from "./types";

export class AudioEngine implements AudioSink {
  ctx: AudioContext; gain: GainNode; buffers = new Map<string, AudioBuffer>(); active = new Map<MovieClip, { src: AudioBufferSourceNode; startedAt: number; offset: number; stream: StreamInfo }>();
  events = new Map<string, AudioBufferSourceNode[]>(); muted = false; volume = 1;
  constructor(public baseUrl: string, public fps: number) { this.ctx = new AudioContext(); this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination); }
  async preload(srcs: string[]): Promise<void> {
    await Promise.all(srcs.map(async (s) => { if (this.buffers.has(s)) return; try { const r = await fetch(this.baseUrl + s); this.buffers.set(s, await this.ctx.decodeAudioData(await r.arrayBuffer())); } catch { /* undecodable: silent */ } }));
  }
  resume(): Promise<void> { return this.ctx.resume(); }
  suspend(): Promise<void> { return this.ctx.suspend(); }
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
  streamFrame(clip: MovieClip, st: StreamInfo, frame: number): number | null {
    const buf = this.buffers.get(st.src); if (!buf || this.ctx.state !== "running") return null;
    const first = st.frames[0][0], last = st.frames[st.frames.length - 1][0];
    let a = this.active.get(clip);
    if (a) {
      const t = a.offset + (this.ctx.currentTime - a.startedAt);
      if (t >= buf.duration) { this.streamStop(clip); return null; }
      const expected = this.frameOfTime(st, t);
      if (Math.abs(expected - frame) <= 3 || expected > frame) return Math.max(frame, expected);
      this.streamStop(clip); a = undefined; // the timeline jumped: re-seek below
    }
    if (frame < first || frame > last) return null;
    const off = this.timeOfFrame(st, frame) ?? 0;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.connect(this.gain); src.start(0, off);
    this.active.set(clip, { src, startedAt: this.ctx.currentTime, offset: off, stream: st });
    return frame + 1;
  }
  streamStop(clip: MovieClip): void { const a = this.active.get(clip); if (a) { try { a.src.stop(); } catch { /* already stopped */ } this.active.delete(clip); } }
  playEvent(src: string, info: any): void {
    const buf = this.buffers.get(src);
    if (info?.stop) { for (const s of this.events.get(src) ?? []) try { s.stop(); } catch { /* */ } this.events.set(src, []); return; }
    if (!buf) { this.preload([src]).then(() => this.buffers.has(src) && this.playEvent(src, info)); return; }
    if (info?.noMultiple && (this.events.get(src)?.length ?? 0) > 0) return;
    const s = this.ctx.createBufferSource(); s.buffer = buf; if (info?.loops > 1) { s.loop = true; setTimeout(() => { try { s.stop(); } catch { /* */ } }, buf.duration * info.loops * 1000); }
    s.connect(this.gain); s.start();
    const list = this.events.get(src) ?? []; list.push(s); this.events.set(src, list);
    s.onended = () => this.events.set(src, (this.events.get(src) ?? []).filter((x) => x !== s));
  }
  stopAll(): void { for (const c of [...this.active.keys()]) this.streamStop(c); for (const l of this.events.values()) for (const s of l) try { s.stop(); } catch { /* */ } this.events.clear(); }
  close(): void { this.stopAll(); this.ctx.close(); }
}
