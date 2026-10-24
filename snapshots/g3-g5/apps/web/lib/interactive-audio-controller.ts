import type {SourceAudioMedia} from '../../../packages/demos/src/source-pcm-audio';

export type InteractiveAudioState = Readonly<{assetId: string; status: 'playing' | 'paused'}> | null;
/** One user-triggered asset, with pause position retained until stop/replacement. */
export function createInteractiveAudioController(
  createMedia: (source: string) => SourceAudioMedia,
  onState: (state: InteractiveAudioState) => void,
) {
  let active: {assetId: string; media: SourceAudioMedia; revision: number; status: 'playing' | 'paused'} | null = null;
  const stop = (assetId?: string) => {
    if (!active || (assetId !== undefined && active.assetId !== assetId)) return false;
    const old = active; active = null; old.revision++;
    old.media.pause(); old.media.currentTime = 0; old.media.dispose?.(); onState(null); return true;
  };
  const start = (current: NonNullable<typeof active>) => {
    const revision = ++current.revision; current.status = 'playing';
    onState({assetId: current.assetId, status: 'playing'});
    const failed = () => {if (active === current && current.revision === revision) stop(current.assetId);};
    try {void current.media.play().catch(failed);} catch {failed();}
  };
  return {
    play(assetId: string, source: string, volume: number) {
      stop();
      const current = {assetId, media: createMedia(source), revision: 0, status: 'playing' as const};
      current.media.volume = volume; active = current;
      const done = () => {if (active === current) stop(assetId);};
      current.media.addEventListener('ended', done, {once: true});
      current.media.addEventListener('error', done, {once: true});
      start(current); return true;
    },
    pause(assetId: string) {
      if (!active || active.assetId !== assetId || active.status !== 'playing') return false;
      active.revision++; active.status = 'paused'; active.media.pause();
      // Anchor the paused position: WebKit may otherwise publish an older
      // backend clock after the pause event and resume from that earlier time.
      active.media.currentTime = active.media.currentTime;
      onState({assetId, status: 'paused'}); return true;
    },
    resume(assetId: string) {
      if (!active || active.assetId !== assetId || active.status !== 'paused') return false;
      start(active); return true;
    },
    setVolume(volume: number) {if (active) active.media.volume = volume;},
    stop,
  };
}
