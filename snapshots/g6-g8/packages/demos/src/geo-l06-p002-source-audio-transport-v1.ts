import {GEO_L06_P002_AUDIO_CLOCK, geoL06P002AudioAtFrame} from
  './geo-l06-p002-audio-clock-v1';

const STREAM_URL = '/flash-assets/g678-local/shared-geo001-l06-p002/source-stream.mp3' +
  `?sha256=${GEO_L06_P002_AUDIO_CLOCK.sourceMp3Sha256}`;

/** Local user-started transport for the intact source MP3. The schedule is
 * source-derived, not a claim of original-runtime audible synchronization. */
export class GeoL06P002SourceAudioTransport {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private volume = 1;
  private buffer: AudioBuffer | null = null;
  private abort: AbortController | null = null;
  private token = 0;
  private sources = new Set<AudioBufferSourceNode>();

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw Error('GEO_P002_AUDIO_VOLUME_INVALID');
    }
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
  }

  stop(): void {
    this.token += 1;
    this.abort?.abort();
    this.abort = null;
    for (const source of this.sources) {
      try { source.stop(); } catch { /* An ended source may already be stopped. */ }
    }
    this.sources.clear();
  }

  async startAt(frame: number): Promise<boolean> {
    geoL06P002AudioAtFrame(frame); // Validate the one-indexed source frame.
    this.stop();
    const token = this.token;
    const context = this.context ?? new AudioContext({sampleRate: GEO_L06_P002_AUDIO_CLOCK.sampleRate});
    this.context = context;
    if (!this.gain) {
      this.gain = context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(context.destination);
    }
    if (context.sampleRate !== GEO_L06_P002_AUDIO_CLOCK.sampleRate) {
      throw Error('GEO_P002_AUDIO_RATE_UNSUPPORTED');
    }
    try {
      await context.resume();
      if (token !== this.token) return false;
      if (!this.buffer) {
        const abort = new AbortController();
        this.abort = abort;
        const response = await fetch(STREAM_URL, {signal: abort.signal, cache: 'no-store'});
        if (!response.ok) throw Error(`GEO_P002_AUDIO_FETCH_${response.status}`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== 496600) throw Error('GEO_P002_AUDIO_SIZE_DRIFT');
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
          .map(value => value.toString(16).padStart(2, '0')).join('');
        if (hash !== GEO_L06_P002_AUDIO_CLOCK.sourceMp3Sha256) {
          throw Error('GEO_P002_AUDIO_HASH_DRIFT');
        }
        if (token !== this.token) return false;
        const decoded = await context.decodeAudioData(bytes);
        if (decoded.numberOfChannels !== 1 ||
            decoded.sampleRate !== GEO_L06_P002_AUDIO_CLOCK.sampleRate ||
            decoded.length !== GEO_L06_P002_AUDIO_CLOCK.decodedSamples) {
          throw Error('GEO_P002_AUDIO_DECODE_DRIFT');
        }
        if (token !== this.token) return false;
        this.buffer = decoded;
        this.abort = null;
      }
      const origin = context.currentTime;
      for (const segment of GEO_L06_P002_AUDIO_CLOCK.segments) {
        const sourceFrame = Math.max(frame, segment.firstFrame);
        if (sourceFrame >= segment.endFrame) continue;
        const position = geoL06P002AudioAtFrame(sourceFrame);
        if (position?.segment !== segment) throw Error('GEO_P002_AUDIO_SEGMENT_DRIFT');
        const source = context.createBufferSource();
        source.buffer = this.buffer;
        source.connect(this.gain);
        source.onended = () => this.sources.delete(source);
        this.sources.add(source);
        source.start(origin + (sourceFrame - frame) / 12,
          position.decodedSample / GEO_L06_P002_AUDIO_CLOCK.sampleRate,
          (segment.endDecodedSample - position.decodedSample) /
            GEO_L06_P002_AUDIO_CLOCK.sampleRate);
      }
      return true;
    } catch (error) {
      if (token !== this.token) return false;
      this.stop();
      throw error;
    }
  }

  close(): void {
    this.stop();
    const context = this.context;
    this.context = null;
    this.gain = null;
    this.buffer = null;
    if (context) void context.close();
  }
}
