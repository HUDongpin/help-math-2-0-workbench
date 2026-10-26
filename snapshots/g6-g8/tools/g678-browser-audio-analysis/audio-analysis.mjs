// Pure measurements. No browser actions, source-state writes, audio synthesis,
// generated acceptance, or implicit tolerance changes.
export const POLICY = Object.freeze({sampleRate: 48000, edgeTrimMs: 0, minimumWindowMs: 200,
  minCoverage: .98, audibleRMS: .0001, silentRMS: .000001, silentPeak: .00001,
  maxClockDriftMs: 50, minSourceCorrelation: .94, minChunkCorrelation: .85,
  maxSourceResidual: .35, maxAlignmentMs: 250});
const invariant = (ok, text) => { if (!ok) throw Error(text); };

export function pcmChannels(bytes, row) {
  invariant(row.channels === 2 && row.sampleRate === 48000 && row.bitsPerChannel === 32 && row.float === true && row.littleEndian === true,
    'UNSUPPORTED_NATIVE_PCM_FORMAT');
  invariant(Number.isSafeInteger(row.frames) && row.frames > 0 && bytes.length === row.frames * 8, 'PCM_SHAPE_MISMATCH');
  const left = new Float32Array(row.frames), right = new Float32Array(row.frames);
  for (let i = 0; i < row.frames; i++) {
    left[i] = bytes.readFloatLE((row.nonInterleaved ? i : i * 2) * 4);
    right[i] = bytes.readFloatLE((row.nonInterleaved ? i + row.frames : i * 2 + 1) * 4);
    invariant(Number.isFinite(left[i]) && Number.isFinite(right[i]), 'NONFINITE_NATIVE_PCM');
  }
  return {left, right};
}

export function measurePCM(left, right = left) {
  invariant(left.length === right.length && left.length > 0, 'NO_PCM_SAMPLES');
  let square = 0, peak = 0, nonzero = 0;
  for (let i = 0; i < left.length; i++) {
    invariant(Number.isFinite(left[i]) && Number.isFinite(right[i]), 'NONFINITE_PCM');
    for (const value of [left[i], right[i]]) { square += value * value; peak = Math.max(peak, Math.abs(value)); if (value !== 0) nonzero++; }
  }
  return {frames: left.length, rms: Math.sqrt(square / (left.length * 2)), peak, nonzeroSamples: nonzero};
}

// Radix-2 FFT used only to enumerate every full-rate lag in the existing
// bounded alignment interval. Blocks keep working memory independent of cue
// duration; the final metrics still use the original direct correlation.
export function fft(real, imaginary, inverse = false) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imaginary[i], imaginary[j]] = [imaginary[j], imaginary[i]];
    }
  }
  for (let length = 2; length <= n; length *= 2) {
    const angle = (inverse ? 2 : -2) * Math.PI / length;
    const stepReal = Math.cos(angle), stepImaginary = Math.sin(angle), half = length / 2;
    for (let start = 0; start < n; start += length) {
      let wr = 1, wi = 0;
      for (let j = 0; j < half; j++) {
        const a = start + j, b = a + half;
        const br = real[b] * wr - imaginary[b] * wi, bi = real[b] * wi + imaginary[b] * wr;
        real[b] = real[a] - br; imaginary[b] = imaginary[a] - bi;
        real[a] += br; imaginary[a] += bi;
        const next = wr * stepReal - wi * stepImaginary;
        wi = wr * stepImaginary + wi * stepReal; wr = next;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) {real[i] /= n; imaginary[i] /= n;}
}

function fullRateAlignment(reference, captured, maxLag) {
  const blockFrames = 32768, dots = new Float64Array(2 * maxLag + 1);
  let size = 1;
  while (size < 2 * Math.min(blockFrames, reference.length) + 2 * maxLag - 1) size *= 2;
  const ar = new Float64Array(size), ai = new Float64Array(size);
  const br = new Float64Array(size), bi = new Float64Array(size);
  for (let start = 0; start < reference.length; start += blockFrames) {
    const count = Math.min(blockFrames, reference.length - start);
    ar.fill(0); ai.fill(0); br.fill(0); bi.fill(0);
    for (let i = 0; i < count; i++) ar[i] = reference[start + count - 1 - i];
    for (let i = 0; i < count + 2 * maxLag; i++) {
      const index = start - maxLag + i;
      if (index >= 0 && index < captured.length) br[i] = captured[index];
    }
    fft(ar, ai); fft(br, bi);
    for (let i = 0; i < size; i++) {
      const real = ar[i] * br[i] - ai[i] * bi[i];
      ai[i] = ar[i] * bi[i] + ai[i] * br[i]; ar[i] = real;
    }
    fft(ar, ai, true);
    for (let lag = -maxLag; lag <= maxLag; lag++) dots[lag + maxLag] += ar[count - 1 + maxLag + lag];
  }
  const sums = () => ({lo: 0, hi: 0, sum: 0, square: 0});
  const a = sums(), b = sums();
  const move = (signal, state, lo, hi) => {
    const adjust = (first, last, sign) => {
      for (let i = first; i < last; i++) {state.sum += sign * signal[i]; state.square += sign * signal[i] * signal[i];}
    };
    adjust(state.lo, Math.min(state.hi, lo), -1);
    adjust(Math.max(state.lo, hi), state.hi, -1);
    adjust(lo, Math.min(hi, state.lo), 1);
    adjust(Math.max(lo, state.hi), hi, 1);
    state.lo = lo; state.hi = hi;
  };
  // Only lags satisfying the unchanged overlap gate are eligible to match
  // the declared full cue. Keep a diagnostic best lag if none qualifies.
  let best = null, bestAny = null;
  const better = (row, prior) => !prior || row.correlation > prior.correlation + 1e-10 ||
    Math.abs(row.correlation - prior.correlation) <= 1e-10 &&
      (row.frames > prior.frames || row.frames === prior.frames && Math.abs(row.lag) < Math.abs(prior.lag));
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    const lo = Math.max(0, -lag), hi = Math.min(reference.length, captured.length - lag), count = Math.max(0, hi - lo);
    const aLo = Math.min(reference.length, lo), aHi = count ? hi : aLo;
    const bLo = Math.max(0, Math.min(captured.length, lo + lag)), bHi = count ? hi + lag : bLo;
    move(reference, a, aLo, aHi); move(captured, b, bLo, bHi);
    const aa = count ? a.square - a.sum * a.sum / count : 0;
    const bb = count ? b.square - b.sum * b.sum / count : 0;
    const ab = count ? dots[lag + maxLag] - a.sum * b.sum / count : 0;
    const score = count >= 50 && aa > 1e-12 && bb > 1e-12 ? ab / Math.sqrt(aa * bb) : 0;
    const row = {lag, frames: count, correlation: Math.max(-1, Math.min(1, score))};
    if (better(row, bestAny)) bestAny = row;
    if (count / reference.length >= .999 && better(row, best)) best = row;
  }
  return best ?? bestAny;
}

function correlation(a, b, lag, start = 0, length = Infinity) {
  const lo = Math.max(0, -lag, start), hi = Math.min(a.length, b.length - lag, start + length);
  if (hi - lo < 50) return {correlation: 0, residual: Infinity, frames: Math.max(0, hi - lo), gain: 0};
  let aa = 0, bb = 0, ab = 0, sa = 0, sb = 0;
  for (let i = lo; i < hi; i++) { const x = a[i], y = b[i + lag]; aa += x * x; bb += y * y; ab += x * y; sa += x; sb += y; }
  const n = hi - lo; aa -= sa * sa / n; bb -= sb * sb / n; ab -= sa * sb / n;
  if (aa <= 1e-12 || bb <= 1e-12) return {correlation: 0, residual: Infinity, frames: n, gain: 0};
  const gain = ab / aa;
  return {correlation: ab / Math.sqrt(aa * bb), residual: Math.sqrt(Math.max(0, bb - ab * ab / aa) / bb), frames: n, gain};
}

export function matchSourceWaveform(reference, captured, policy = POLICY) {
  invariant(reference.length >= 9600 && captured.length >= 9600, 'SOURCE_MATCH_WINDOW_TOO_SHORT');
  const maxLag = Math.floor(policy.maxAlignmentMs * 48);
  invariant(Number.isSafeInteger(maxLag) && maxLag >= 0, 'INVALID_ALIGNMENT_BOUND');
  // Enumerate every permitted 48 kHz lag. Do not decimate or choose a coarse
  // peak that could exclude the true alignment from a later fine search.
  const fine = fullRateAlignment(reference, captured, maxLag);
  const overall = correlation(reference, captured, fine.lag), chunks = [];
  for (let pos = 0; pos < reference.length; pos += 48000) {
    const len = Math.min(48000, reference.length - pos);
    if (len < 9600) continue;
    let energy = 0; for (let i = pos; i < pos + len; i++) energy += reference[i] ** 2;
    if (Math.sqrt(energy / len) < policy.audibleRMS) continue;
    chunks.push({startSeconds: pos / 48000, ...correlation(reference, captured, fine.lag, pos, len)});
  }
  const overlap = overall.frames / reference.length;
  const passed = overall.correlation >= policy.minSourceCorrelation && overall.residual <= policy.maxSourceResidual &&
    overlap >= .999 && chunks.length > 0 && chunks.every(c => c.correlation >= policy.minChunkCorrelation) && overall.gain > 0;
  return {status: passed ? 'SOURCE_WAVEFORM_MATCH' : 'SOURCE_WAVEFORM_MISMATCH', passed,
    alignmentFrames: fine.lag, alignmentMs: fine.lag / 48, overlap, ...overall, chunks,
    claim: 'captured output waveform matches the pinned decoded cue in the declared window; no human or original-runtime acceptance'};
}

export function toneEnergyFraction(samples, frequency, sampleRate = 48000) {
  invariant(samples.length > 0 && Number.isFinite(frequency) && frequency > 0 && frequency < sampleRate / 2, 'INVALID_TONE_PROBE');
  let real = 0, imag = 0, energy = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i]; real += value * Math.cos(2 * Math.PI * frequency * i / sampleRate);
    imag += value * Math.sin(2 * Math.PI * frequency * i / sampleRate); energy += value * value;
  }
  return energy > 0 ? Math.min(1, 2 * (real * real + imag * imag) / (samples.length * energy)) : 0;
}
