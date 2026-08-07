import 'server-only';

import {cookies} from 'next/headers';

import {
  EXECUTIVE_PREVIEW_COOKIE_NAME,
  getExecutivePreviewConfig,
  verifyExecutivePreviewSession,
} from './executive-preview-access';

export async function hasExecutivePreviewSession() {
  const config = getExecutivePreviewConfig();
  if (!config) return false;
  const cookieStore = await cookies();
  return verifyExecutivePreviewSession(
    cookieStore.get(EXECUTIVE_PREVIEW_COOKIE_NAME)?.value,
    config,
  );
}
