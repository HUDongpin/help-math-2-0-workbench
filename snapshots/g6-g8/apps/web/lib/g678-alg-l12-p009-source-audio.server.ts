import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB04.swf`;
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const AUDIO_PATH = 'migrations/shared-alg001-l12-p009/audit/source-stream.mp3';
const AUDIO_SHA = '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e';
const AUDIO_BYTES = 162890;
const BLOCKS_PATH = 'migrations/shared-alg001-l12-p009/audit/source-stream-blocks.json';
const BLOCKS_SHA = 'cc20000fdef998ecd62aac8454f8f1edf0e9ad8c5595140e9899354256036c4a';
const ANALYSIS_PATH = 'migrations/shared-alg001-l12-p009/audio-analysis-v1/analysis.json';
const ANALYSIS_SHA = '6547b52ae7e12e7ff7b2bb0ff190ab233a552dc68eda056869df015d26c883fd';

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Analysis = Readonly<{
  schemaVersion: number; kind: string; animationId: string; inputs: readonly Pin[];
  source: Readonly<{sha256: string; mainFrameCount: number; blockCount: number;
    streamHead: Readonly<{timelineId: string}>}>;
  encoded: Readonly<{bytes: number; sha256: string}>;
  claimBoundary: Readonly<{technicalDecodeOnly: boolean; productAudioEnabled: boolean;
    registered: boolean; synchronizationAccepted: boolean; listeningAccepted: boolean; published: boolean}>;
}>;

function readPinned(file: string, size: number, sha256: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P009 audio physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size))
    throw Error('P009 audio ordinary bounded file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
      before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs ||
      before.mode !== after.mode || before.nlink !== after.nlink || bytes.length !== size ||
      createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw Error('P009 audio source or evidence drift');
  return bytes;
}

/** Exact extracted stream for the private local candidate. Delivery and technical
 * decode establish no playback schedule, original Flash behavior or listening acceptance. */
export function algL12P009SourceAudio(): {bytes: Buffer; sha256: string} {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT || !lstatSync(SOURCE_ROOT).isDirectory())
    throw Error('P009 local audio source required');
  readPinned(SOURCE_PATH, 165405, SOURCE_SHA);
  const root = getWorkspaceRoot();
  readPinned(path.join(root, BLOCKS_PATH), 236488, BLOCKS_SHA);
  const analysis = JSON.parse(readPinned(path.join(root, ANALYSIS_PATH), 11426, ANALYSIS_SHA).toString('utf8')) as Analysis;
  const requiredInputs: readonly Pin[] = [
    {path: SOURCE_PATH, bytes: 165405, sha256: SOURCE_SHA},
    {path: BLOCKS_PATH, bytes: 236488, sha256: BLOCKS_SHA},
    {path: AUDIO_PATH, bytes: AUDIO_BYTES, sha256: AUDIO_SHA},
  ];
  if (analysis.schemaVersion !== 1 || analysis.kind !== 'p009-embedded-stream-technical-analysis-v1' ||
      analysis.animationId !== 'shared-alg001-l12-p009' || analysis.source?.sha256 !== SOURCE_SHA ||
      analysis.source?.mainFrameCount !== 394 || analysis.source?.blockCount !== 393 ||
      analysis.source?.streamHead?.timelineId !== 'sprite-62' ||
      analysis.encoded?.sha256 !== AUDIO_SHA || analysis.encoded?.bytes !== AUDIO_BYTES ||
      !Array.isArray(analysis.inputs) || requiredInputs.some(pin =>
        analysis.inputs.filter(input => input.path === pin.path && input.bytes === pin.bytes && input.sha256 === pin.sha256).length !== 1) ||
      analysis.claimBoundary?.technicalDecodeOnly !== true || analysis.claimBoundary?.productAudioEnabled !== false ||
      analysis.claimBoundary?.registered !== false || analysis.claimBoundary?.synchronizationAccepted !== false ||
      analysis.claimBoundary?.listeningAccepted !== false || analysis.claimBoundary?.published !== false)
    throw Error('P009 audio analysis association required');
  return {bytes: readPinned(path.join(root, AUDIO_PATH), AUDIO_BYTES, AUDIO_SHA), sha256: AUDIO_SHA};
}
