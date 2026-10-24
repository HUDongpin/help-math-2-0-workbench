import {isDeepStrictEqual as exact} from 'node:util';
import path from 'node:path';
import {resolveG678HistoricalEvidencePath} from '../../../lib/g678-life-root-binding-v1.mjs';
import {readJsonPin, readPin, uniquePins, verifyLegacyPageHostPromotions} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Transition = Readonly<{original: Pin; snapshot: Pin; current?: Pin}>;
type Host = Readonly<{schemaVersion: number; kind: string; files: readonly Pin[];
  replacedRoutes: readonly string[]; legacyInputTransitions?: readonly Transition[];
  historicalRoutes?: readonly Transition[]; legacyPageHostPromotions?: readonly Transition[]}>;
function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`G678_ACTIVE_HOST_PIN_INVALID: ${reason}`);
}

/** Resolve historical bytes only through the exact active host manifest.
 * This verifies the requested snapshot and its current file, not the whole
 * host or any page's admission. Callers retain their original strict readers.
 * No current bytes are ever returned under an older hash. */
export function activeHostPins(root: string) {
  const index = readJsonPin(root, G678_ADMISSION_INDEX) as
    {schemaVersion: number; kind: string; host: Pin};
  demand(index.schemaVersion === 1 && index.kind === 'g678-admission-index-v1', 'active index');
  const host = readJsonPin(root, index.host) as Host;
  demand(host.schemaVersion === 1 && host.kind === 'g678-admission-host-v1' &&
    Array.isArray(host.files) && host.files.length > 0 &&
    exact(uniquePins(host.files), host.files), 'active host membership');
  const promotions = verifyLegacyPageHostPromotions(root, host);
  const retained: Pin[] = [G678_ADMISSION_INDEX, index.host];
  function resolve(pin: Pin): Pin {
    // Historical authorities may store the previous physical workspace address.
    // Resolve custody only for manifest lookup; retain the recorded pin itself.
    const physical = path.isAbsolute(pin.path) && path.resolve(pin.path) === pin.path
      ? resolveG678HistoricalEvidencePath(pin.path, root) : null;
    const lookup = physical?.startsWith(root + path.sep)
      ? {...pin, path: path.relative(root, physical)} : pin;
    const current = host.files.filter(file => file.path === lookup.path);
    if (current.length === 0) return pin;
    demand(current.length === 1, 'unique current file');
    if (exact(current[0], lookup)) return pin;
    const promotion = promotions.get(lookup.path);
    const transitions = [...(host.legacyInputTransitions ?? []), ...(promotion ? [promotion] : [])]
      .filter(t => exact(t.original, lookup));
    const historical = (host.historicalRoutes ?? []).filter(t => exact(t.original, lookup));
    demand(transitions.length + historical.length === 1, `one exact transition: ${pin.path}`);
    const transition = (transitions[0] ?? historical[0])!;
    if (transitions.length) demand(exact(transition.current, current[0]), 'exact current target');
    else demand(host.replacedRoutes.includes(lookup.path), 'explicit historical route');
    demand(transition.snapshot.path !== pin.path && transition.snapshot.bytes === pin.bytes &&
      transition.snapshot.sha256 === pin.sha256, 'exact historical snapshot');
    readPin(root, transition.snapshot);
    readPin(root, current[0]);
    retained.push(transition.snapshot, current[0]!);
    return transition.snapshot;
  }
  return Object.freeze({resolve, expand(pins: readonly Pin[]): readonly Pin[] {
    const physical = pins.map(resolve);
    return Object.freeze(uniquePins([...physical, ...retained]));
  }});
}
