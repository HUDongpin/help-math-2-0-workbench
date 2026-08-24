import 'server-only';

import {matchesFamilyCronBearer} from './cron-auth';

export function isAuthorizedFamilyCronRequest(
  authorizationHeader: string | null,
  configuredSecret = process.env.CRON_SECRET,
) {
  return matchesFamilyCronBearer(authorizationHeader, configuredSecret);
}
