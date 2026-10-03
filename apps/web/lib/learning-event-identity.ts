import type {HelpMathLearningEvent} from './learning-event-schema';

export const LEARNING_IDENTITY_HEADER = 'x-helpmath-learning-identity';
export const LEARNING_IDENTITY_LIFETIME_MS = 180 * 24 * 60 * 60 * 1_000;
export const LEARNING_IDENTITY_RETRY_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;
export interface LearningIdentityBinding {
  readonly token: string;
  readonly expiresAt: number;
}

/** One transaction selects the browser identity and pins each event before any delivery. */
export async function bindLearningEventIdentities(
  eventIds: readonly string[],
  candidate?: LearningIdentityBinding,
  factory: IDBFactory = indexedDB,
  nowMs = Date.now(),
): Promise<ReadonlyMap<string, LearningIdentityBinding>> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open('helpmath-learning-identities-v1', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('browser');
      request.result.createObjectStore('events');
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(['browser', 'events'], 'readwrite');
      const browser = transaction.objectStore('browser');
      const events = transaction.objectStore('events');
      const bindings = new Map<string, LearningIdentityBinding>();
      transaction.onabort = () => reject(transaction.error ?? new Error('Identity transaction aborted'));
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve(bindings);
      const currentRequest = browser.get('current');
      currentRequest.onsuccess = () => {
        const current = currentRequest.result as LearningIdentityBinding | undefined;
        const selected = current && current.expiresAt > nowMs ? current : candidate;
        if (selected && selected.expiresAt > nowMs && selected !== current) browser.put(selected, 'current');
        for (const eventId of eventIds) {
          const request = events.get(eventId);
          request.onsuccess = () => {
            const existing = request.result as LearningIdentityBinding | undefined;
            if (existing) bindings.set(eventId, existing);
            else if (selected && selected.expiresAt > nowMs) {
              events.put({...selected, retainUntil: nowMs + LEARNING_IDENTITY_RETRY_RETENTION_MS}, eventId);
              bindings.set(eventId, selected);
            }
          };
        }
        // Keep acknowledged/retried UUID bindings until no retained outbox event
        // can need them. A concurrent late retry must not mint another actor.
        const cursor = events.openCursor();
        cursor.onsuccess = () => {
          const entry = cursor.result;
          if (!entry) return;
          if ((entry.value as {retainUntil: number}).retainUntil < nowMs) entry.delete();
          entry.continue();
        };
      };
    });
  } finally {
    database.close();
  }
}

export async function postLearningEventsWithIdentity(
  events: readonly HelpMathLearningEvent[],
  options: {
    signal?: AbortSignal;
    keepalive: boolean;
    fetchImpl?: typeof fetch;
    bind?: typeof bindLearningEventIdentities;
  },
): Promise<{response: Response; eventIds: readonly string[]}> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const bind = options.bind ?? bindLearningEventIdentities;
  const ids = events.map(event => event.eventId);
  const post = (batch: readonly HelpMathLearningEvent[], token?: string) => fetchImpl('/api/learning-events', {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json', ...(token ? {[LEARNING_IDENTITY_HEADER]: token} : {})},
    body: JSON.stringify({schemaVersion: 1, events: batch}),
    cache: 'no-store', credentials: 'same-origin', keepalive: options.keepalive, signal: options.signal,
  });
  let bindings = await bind(ids);
  if (bindings.size !== ids.length) {
    const response = await post(events);
    if (response.status !== 202) return {response, eventIds: ids};
    const body = await response.json() as {identity?: LearningIdentityBinding};
    const identity = body.identity;
    if (!identity || typeof identity.token !== 'string' || identity.token.length > 256 ||
        !Number.isSafeInteger(identity.expiresAt) || identity.expiresAt <= Date.now()) {
      throw new Error('Invalid learning identity handshake');
    }
    bindings = await bind(ids, identity);
  }
  const binding = bindings.get(ids[0]!);
  if (!binding || bindings.size !== ids.length) throw new Error('Learning identity was not persisted');
  // Old queued events keep their actor across the browser identity's rotation.
  const batch = events.filter(event => bindings.get(event.eventId)?.token === binding.token);
  return {response: await post(batch, binding.token), eventIds: batch.map(event => event.eventId)};
}
