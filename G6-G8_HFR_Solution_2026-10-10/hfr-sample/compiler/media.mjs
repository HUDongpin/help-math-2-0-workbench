// hfr-compile: media conversion (bitmaps → PNG/JPEG, sounds → MP3/WAV).
import { deflateSync, inflateSync } from "node:zlib";

// ---------------------------------------------------------------- PNG
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePng(width, height, rgba, channels = 4) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = channels === 4 ? 6 : 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * channels + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * channels + 1)] = 0; rgba.copy ? rgba.copy(raw, y * (width * channels + 1) + 1, y * width * channels, (y + 1) * width * channels) : raw.set(rgba.subarray(y * width * channels, (y + 1) * width * channels), y * (width * channels + 1) + 1); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- JPEG
function stripErroneousHeader(d) {
  // Some Flash JPEGs start with FFD9 FFD8; drop every misplaced EOI/SOI pair.
  let out = Buffer.from(d);
  if (out[0] === 0xff && out[1] === 0xd9 && out[2] === 0xff && out[3] === 0xd8) out = out.subarray(4);
  return out;
}
function cleanJpeg(d) {
  d = stripErroneousHeader(d);
  // Remove embedded "FFD9 FFD8" sequences between table and image segments.
  const parts = []; let last = 0;
  for (let i = 2; i < d.length - 3; i++) if (d[i] === 0xff && d[i + 1] === 0xd9 && d[i + 2] === 0xff && d[i + 3] === 0xd8) { parts.push(d.subarray(last, i)); last = i + 4; i += 3; }
  if (!parts.length) return d;
  parts.push(d.subarray(last)); return Buffer.concat(parts);
}
export function jpegSize(d) {
  let i = 2;
  while (i < d.length) {
    if (d[i] !== 0xff) { i++; continue; }
    const m = d[i + 1]; if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const len = d.readUInt16BE(i + 2);
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { height: d.readUInt16BE(i + 5), width: d.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}
// Returns { files: [{name, data}], width, height, alphaFile? }
export function convertBitmap(id, bm, jpegTables) {
  if (bm.format === "jpeg-tables") {
    let tables = jpegTables ? stripErroneousHeader(jpegTables) : Buffer.alloc(0);
    if (tables.length >= 2 && tables[tables.length - 2] === 0xff && tables[tables.length - 1] === 0xd9) tables = tables.subarray(0, tables.length - 2);
    let img = stripErroneousHeader(bm.data); if (img[0] === 0xff && img[1] === 0xd8) img = img.subarray(2);
    const jpg = tables.length ? Buffer.concat([tables, img]) : Buffer.concat([Buffer.from([0xff, 0xd8]), img]);
    const sz = jpegSize(jpg) ?? { width: 0, height: 0 };
    return { files: [{ name: `b${id}.jpg`, data: jpg }], src: `b${id}.jpg`, ...sz };
  }
  if (bm.format === "jpeg" || bm.format === "jpeg-alpha") {
    const d = bm.data;
    if (d[0] === 0x89 && d[1] === 0x50) return { files: [{ name: `b${id}.png`, data: d }], src: `b${id}.png`, width: d.readUInt32BE(16), height: d.readUInt32BE(20) };
    const jpg = cleanJpeg(d); const sz = jpegSize(jpg) ?? { width: 0, height: 0 };
    const out = { files: [{ name: `b${id}.jpg`, data: jpg }], src: `b${id}.jpg`, ...sz };
    if (bm.format === "jpeg-alpha" && bm.alpha?.length && sz.width) {
      const a = inflateSync(bm.alpha);
      out.files.push({ name: `b${id}.alpha.png`, data: encodePng(sz.width, sz.height, a.subarray(0, sz.width * sz.height), 1) });
      out.alpha = `b${id}.alpha.png`;
    }
    return out;
  }
  if (bm.format === "lossless") {
    const raw = inflateSync(bm.data); const { width: w, height: h, bitmapFormat: f } = bm; const rgba = Buffer.alloc(w * h * 4);
    if (f === 3) {
      const n = bm.colorTableSize + 1; const csz = bm.alpha ? 4 : 3; const stride = (w + 3) & ~3;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ci = raw[n * csz + y * stride + x]; const o = (y * w + x) * 4; const c = ci * csz;
        if (ci < n) { rgba[o] = raw[c]; rgba[o + 1] = raw[c + 1]; rgba[o + 2] = raw[c + 2]; rgba[o + 3] = bm.alpha ? raw[c + 3] : 255; }
        if (bm.alpha && rgba[o + 3] && rgba[o + 3] < 255) for (let k = 0; k < 3; k++) rgba[o + k] = Math.min(255, Math.round((rgba[o + k] * 255) / rgba[o + 3]));
      }
    } else if (f === 4) {
      const stride = (w * 2 + 3) & ~3;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = raw.readUInt16BE(y * stride + x * 2); const o = (y * w + x) * 4; rgba[o] = ((v >> 10) & 31) * 255 / 31; rgba[o + 1] = ((v >> 5) & 31) * 255 / 31; rgba[o + 2] = (v & 31) * 255 / 31; rgba[o + 3] = 255; }
    } else if (f === 5) {
      for (let i = 0; i < w * h; i++) {
        const a = bm.alpha ? raw[i * 4] : 255; const o = i * 4;
        let r = raw[i * 4 + 1], g = raw[i * 4 + 2], b = raw[i * 4 + 3];
        if (bm.alpha && a && a < 255) { r = Math.min(255, Math.round((r * 255) / a)); g = Math.min(255, Math.round((g * 255) / a)); b = Math.min(255, Math.round((b * 255) / a)); }
        rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = a;
      }
    } else throw new Error("lossless format " + f);
    return { files: [{ name: `b${id}.png`, data: encodePng(w, h, rgba) }], src: `b${id}.png`, width: w, height: h };
  }
  throw new Error("bitmap format " + bm.format);
}

// ---------------------------------------------------------------- sound
const RATES = [5512.5, 11025, 22050, 44100];
const STEP = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
const IDX = { 2: [-1, 2], 3: [-1, -1, 2, 4], 4: [-1, -1, -1, -1, 2, 4, 6, 8], 5: [-1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16] };
export function decodeAdpcm(data, stereo) {
  let pos = 0, bit = 0;
  const ub = (n) => { let v = 0; for (let i = 0; i < n; i++) { if (pos >= data.length) return v; v = v * 2 + ((data[pos] >> (7 - bit)) & 1); if (++bit === 8) { bit = 0; pos++; } } return v; };
  const bits = ub(2) + 2; const ch = stereo ? 2 : 1; const out = [];
  const totalBits = data.length * 8;
  while (pos * 8 + bit + 22 * ch <= totalBits) {
    const st = [];
    for (let c = 0; c < ch; c++) { let s = ub(16); if (s & 0x8000) s -= 0x10000; st.push({ s, i: ub(6) }); out.push(s); }
    for (let n = 1; n < 4096 && pos * 8 + bit + bits * ch <= totalBits; n++) {
      for (let c = 0; c < ch; c++) {
        const code = ub(bits); const sign = 1 << (bits - 1); const s = st[c];
        let step = STEP[s.i]; let diff = step >> (bits - 1);
        for (let k = bits - 2, sh = 0; k >= 0; k--, sh++) if (code & (1 << k)) diff += step >> sh;
        s.s += code & sign ? -diff : diff; s.s = Math.max(-32768, Math.min(32767, s.s));
        s.i = Math.max(0, Math.min(88, s.i + IDX[bits][code & (sign - 1)]));
        out.push(s.s);
      }
    }
  }
  return Int16Array.from(out);
}
export function wav(samples, rate, channels) {
  const data = Buffer.alloc(samples.length * 2); for (let i = 0; i < samples.length; i++) data.writeInt16LE(samples[i], i * 2);
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22); h.writeUInt32LE(Math.round(rate), 24); h.writeUInt32LE(Math.round(rate) * channels * 2, 28); h.writeUInt16LE(channels * 2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
function pcmToInt16(data, size16, format) {
  if (size16) { const s = new Int16Array(data.length >> 1); for (let i = 0; i < s.length; i++) s[i] = format === 0 ? data.readInt16LE(i * 2) : data.readInt16LE(i * 2); return s; }
  return Int16Array.from(data, (b) => (b - 128) << 8);
}
// Streamed sound → one file plus a frame→sample map.
export function convertStream(st, name) {
  const rate = RATES[st.rate]; const ch = st.stereo ? 2 : 1; const frames = []; let samples = 0;
  if (st.format === 2) {
    const parts = [];
    for (const b of st.blocks) { const n = b.data.readUInt16LE(0); frames.push([b.frame, samples]); samples += n; if (b.data.length > 4) parts.push(b.data.subarray(4)); }
    if (!parts.length) return null;
    return { file: { name: `${name}.mp3`, data: Buffer.concat(parts) }, rate, frames, samples };
  }
  const chunks = [];
  for (const b of st.blocks) {
    const pcm = st.format === 1 ? decodeAdpcm(b.data, st.stereo) : pcmToInt16(b.data, st.size16, st.format);
    frames.push([b.frame, samples]); samples += pcm.length / ch; chunks.push(pcm);
  }
  if (!samples) return null;
  const all = new Int16Array(chunks.reduce((a, c) => a + c.length, 0)); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  return { file: { name: `${name}.wav`, data: wav(all, rate, ch) }, rate, frames, samples };
}
export function convertEventSound(id, snd) {
  const rate = RATES[snd.rate];
  if (snd.format === 2) return { name: `s${id}.mp3`, data: snd.data.subarray(2) };
  const pcm = snd.format === 1 ? decodeAdpcm(snd.data, snd.stereo) : pcmToInt16(snd.data, snd.size16, snd.format);
  return { name: `s${id}.wav`, data: wav(pcm, rate, snd.stereo ? 2 : 1) };
}
