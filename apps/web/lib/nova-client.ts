'use client';

import type {TutorFrameSnapshot} from './tutor-integration';

export const NOVA_CLIENT_LIMITS = Object.freeze({
  historyMessages: 8,
  historyMessageCharacters: 800,
  historyTotalCharacters: 4_800,
  frameBytes: 18 * 1024,
  frameDataUrlCharacters: 25_000,
});

// Leave room inside the 32 KiB route envelope for a full bounded history,
// current question, and canonical page context.
const NOVA_PREPARED_FRAME_BYTES = 14 * 1024;
const NOVA_PREPARED_FRAME_DATA_URL_CHARACTERS = 19_500;

export interface NovaConversationEntry {
  readonly role: 'user' | 'assistant';
  readonly text: string;
}

/**
 * Keep the newest useful turns while independently enforcing the server's
 * closed history contract. The UI can display a longer answer, but no single
 * history turn, history array, or cumulative request can exceed these limits.
 */
export function boundedNovaHistory(
  conversation: readonly NovaConversationEntry[],
): NovaConversationEntry[] {
  const bounded: NovaConversationEntry[] = [];
  let remainingCharacters = NOVA_CLIENT_LIMITS.historyTotalCharacters;

  for (
    let index = conversation.length - 1;
    index >= 0 && bounded.length < NOVA_CLIENT_LIMITS.historyMessages;
    index -= 1
  ) {
    if (remainingCharacters <= 0) break;
    const entry = conversation[index];
    const normalized = entry.text.trim();
    if (!normalized) continue;
    const text = normalized.slice(
      0,
      Math.min(
        NOVA_CLIENT_LIMITS.historyMessageCharacters,
        remainingCharacters,
      ),
    );
    if (!text) continue;
    bounded.unshift({role: entry.role, text});
    remainingCharacters -= text.length;
  }

  return bounded;
}

export function novaFrameDataUrlByteLength(dataUrl: string) {
  const match = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    dataUrl,
  );
  if (!match) return null;
  const base64 = match[1];
  if (base64.length % 4 !== 0) return null;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

export function novaFrameFitsRequest(dataUrl: string) {
  const bytes = novaFrameDataUrlByteLength(dataUrl);
  return bytes !== null &&
    bytes > 0 &&
    bytes <= NOVA_CLIENT_LIMITS.frameBytes &&
    dataUrl.length <= NOVA_CLIENT_LIMITS.frameDataUrlCharacters;
}

function loadFrameImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('frame-decode-failed'));
    image.src = dataUrl;
  });
}

/**
 * Convert the local lesson canvas snapshot to a compact JPEG before it can be
 * attached. This function never opens a camera, file picker, or media stream.
 */
export async function prepareNovaFrame(
  frame: TutorFrameSnapshot,
): Promise<TutorFrameSnapshot | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return null;
  }

  let image: HTMLImageElement;
  try {
    image = await loadFrameImage(frame.dataUrl);
  } catch {
    return null;
  }

  const sourceWidth = image.naturalWidth || frame.width;
  const sourceHeight = image.naturalHeight || frame.height;
  if (!sourceWidth || !sourceHeight) return null;

  const initialScale = Math.min(1, 480 / sourceWidth, 360 / sourceHeight);
  let width = Math.max(1, Math.round(sourceWidth * initialScale));
  let height = Math.max(1, Math.round(sourceHeight * initialScale));
  let quality = 0.72;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const drawing = canvas.getContext('2d');
    if (!drawing) return null;
    drawing.fillStyle = '#ffffff';
    drawing.fillRect(0, 0, width, height);
    drawing.drawImage(image, 0, 0, width, height);

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    } catch {
      return null;
    }
    const bytes = novaFrameDataUrlByteLength(dataUrl);
    if (
      novaFrameFitsRequest(dataUrl) &&
      bytes !== null &&
      bytes <= NOVA_PREPARED_FRAME_BYTES &&
      dataUrl.length <= NOVA_PREPARED_FRAME_DATA_URL_CHARACTERS
    ) {
      return Object.freeze({
        animationId: frame.animationId,
        dataUrl,
        width,
        height,
      });
    }

    if (quality > 0.38) {
      quality = Math.max(0.38, quality - 0.1);
    } else {
      width = Math.max(48, Math.round(width * 0.78));
      height = Math.max(32, Math.round(height * 0.78));
      quality = 0.56;
    }
  }

  return null;
}
