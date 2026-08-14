export const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1' as const;

const ALLOWED_OPENROUTER_HOSTS = new Set([
  'openrouter.ai',
  'eu.openrouter.ai',
]);

export interface OpenRouterConfig {
  readonly apiKey: string;
  readonly appTitle?: string;
  readonly baseUrl: string;
  readonly httpReferer?: string;
}

export type OpenRouterEnvironment = Readonly<Record<string, string | undefined>>;

/** Carries no key, URL, or upstream response details. */
export class OpenRouterConfigurationError extends Error {
  constructor() {
    super('OpenRouter is not configured');
    this.name = 'OpenRouterConfigurationError';
  }
}

function invalidConfiguration(): never {
  throw new OpenRouterConfigurationError();
}

function readBaseUrl(value: string | undefined) {
  let url: URL;
  try {
    url = new URL(value?.trim() || DEFAULT_OPENROUTER_BASE_URL);
  } catch {
    return invalidConfiguration();
  }
  if (
    url.protocol !== 'https:' ||
    !ALLOWED_OPENROUTER_HOSTS.has(url.hostname) ||
    url.port !== '' ||
    url.username !== '' ||
    url.password !== '' ||
    !['/api/v1', '/api/v1/'].includes(url.pathname) ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    return invalidConfiguration();
  }
  return `${url.origin}/api/v1`;
}

function readHttpReferer(value: string | undefined) {
  if (value === undefined || value.trim() === '') return undefined;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return invalidConfiguration();
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.pathname !== '/'
  ) {
    return invalidConfiguration();
  }
  return url.origin;
}

function readAppTitle(value: string | undefined) {
  if (value === undefined || value.trim() === '') return undefined;
  const title = value.trim();
  if (title.length > 80 || /[\u0000-\u001f\u007f]/.test(title)) {
    return invalidConfiguration();
  }
  return title;
}

/**
 * Shared, server-only OpenRouter configuration for Nova and future governed
 * HELP Math features. Feature-specific models and permissions remain outside
 * this provider credential boundary.
 */
export function readOpenRouterConfig(
  environment: OpenRouterEnvironment = process.env,
): OpenRouterConfig {
  const apiKey = environment.OPENROUTER_API_KEY?.trim();
  if (
    !apiKey ||
    apiKey.length > 320 ||
    !/^sk-or-v1-[A-Za-z0-9_-]{20,}$/.test(apiKey)
  ) {
    return invalidConfiguration();
  }

  const httpReferer = readHttpReferer(environment.OPENROUTER_HTTP_REFERER);
  const appTitle = readAppTitle(environment.OPENROUTER_APP_TITLE);

  return Object.freeze({
    apiKey,
    baseUrl: readBaseUrl(environment.OPENROUTER_BASE_URL),
    ...(httpReferer ? {httpReferer} : {}),
    ...(appTitle ? {appTitle} : {}),
  });
}

export function buildOpenRouterHeaders(config: OpenRouterConfig) {
  return Object.freeze({
    authorization: `Bearer ${config.apiKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
    ...(config.httpReferer ? {'HTTP-Referer': config.httpReferer} : {}),
    ...(config.appTitle ? {'X-OpenRouter-Title': config.appTitle} : {}),
  });
}
