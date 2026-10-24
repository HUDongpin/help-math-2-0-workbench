export type CalibrationAudioState = Readonly<{
  status: 'idle' | 'loading' | 'playing' | 'blocked';
  activeId: string | null;
}>;

export interface CalibrationAudioElement {
  volume: number;
  preload: string;
  onended: ((event: Event) => void) | null;
  onerror: ((event: Event | string) => unknown) | null;
  play(): Promise<void>;
  pause(): void;
  removeAttribute(name: string): void;
  load(): void;
}

export const IDLE_CALIBRATION_AUDIO: CalibrationAudioState = Object.freeze({
  status: 'idle', activeId: null,
});

const safeVolume = (value: number) => Number.isFinite(value)
  ? Math.max(0, Math.min(1, value)) : 0;

// A single browser-audio owner for an explicitly admitted engineering session.
// It has no source-trigger, language-acceptance, or reviewer authority.
export function createCalibrationAudioPlayer(
  createAudio: (url: string) => CalibrationAudioElement,
  onState: (state: CalibrationAudioState) => void,
) {
  let current: CalibrationAudioElement | null = null;
  let generation = 0;
  let destroyed = false;

  function release() {
    generation += 1;
    const previous = current;
    current = null;
    if (previous) {
      previous.onended = null;
      previous.onerror = null;
      previous.pause();
      previous.removeAttribute('src');
      previous.load();
    }
  }

  return {
    stop() {
      release();
      if (!destroyed) onState(IDLE_CALIBRATION_AUDIO);
    },
    setVolume(value: number) {
      if (current) current.volume = safeVolume(value);
    },
    play(asset: {id: string; url: string}, volume: number) {
      if (destroyed) return;
      release();
      const version = generation;
      try {
        const audio = createAudio(asset.url);
        current = audio;
        audio.preload = 'auto';
        audio.volume = safeVolume(volume);
        const ownsSession = () => !destroyed && version === generation && current === audio;
        const failed = () => {
          if (!ownsSession()) return;
          release();
          onState({status: 'blocked', activeId: null});
        };
        audio.onerror = failed;
        audio.onended = () => {
          if (!ownsSession()) return;
          release();
          onState(IDLE_CALIBRATION_AUDIO);
        };
        onState({status: 'loading', activeId: asset.id});
        void audio.play().then(() => {
          if (ownsSession()) onState({status: 'playing', activeId: asset.id});
        }, failed);
      } catch {
        if (!destroyed && version === generation) {
          release();
          onState({status: 'blocked', activeId: null});
        }
      }
    },
    destroy() {
      destroyed = true;
      release();
    },
  };
}
