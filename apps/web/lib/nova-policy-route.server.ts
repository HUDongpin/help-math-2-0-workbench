import 'server-only';

import {z} from 'zod';

import {readAuthSession} from './clerk-auth-session.server';
import {readNovaBoundedUtf8Body} from './nova-bounded-body.server';
import {
  listNovaSettings,
  setNovaClassPolicy,
  setNovaSchoolPolicy,
} from './nova-class-policy.server';
import {isSameOriginNovaRequest} from './nova-route-support.server';

const updateSchema = z.object({
  enabled: z.boolean(),
  version: z.number().int().positive(),
}).strict();

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {'cache-control': 'private, no-store, max-age=0'},
  });
}

type Scope = 'school' | 'class';

export async function readNovaPolicyRoute(scope: Scope, id: string) {
  const session = await readAuthSession();
  if (session.status !== 'signed-in') return response({error: 'SIGN_IN_REQUIRED'}, 401);
  try {
    const settings = await listNovaSettings(session);
    const item = scope === 'school'
      ? settings.schools.find((school) => school.id === id)
      : settings.classes.find((classroom) => classroom.id === id);
    return item ? response(item) : response({error: 'NOT_ALLOWED'}, 403);
  } catch {
    return response({error: 'POLICY_UNAVAILABLE'}, 503);
  }
}

export async function updateNovaPolicyRoute(
  scope: Scope,
  id: string,
  request: Request,
) {
  if (!isSameOriginNovaRequest(request)) {
    return response({error: 'ORIGIN_DENIED'}, 403);
  }
  const session = await readAuthSession();
  if (session.status !== 'signed-in') return response({error: 'SIGN_IN_REQUIRED'}, 401);
  if (request.headers.get('content-type')?.split(';', 1)[0]?.trim()
      !== 'application/json') {
    return response({error: 'INVALID_INPUT'}, 400);
  }
  let input: unknown;
  try {
    const body = await readNovaBoundedUtf8Body(request.body, 1024);
    input = JSON.parse(body.text);
  } catch {
    return response({error: 'INVALID_INPUT'}, 400);
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return response({error: 'INVALID_INPUT'}, 400);
  try {
    const version = scope === 'school'
      ? await setNovaSchoolPolicy({
          schoolId: id,
          session,
          ...parsed.data,
        })
      : await setNovaClassPolicy({
          classId: id,
          session,
          ...parsed.data,
        });
    return version === null
      ? response({error: 'NOT_ALLOWED_OR_STALE'}, 409)
      : response({enabled: parsed.data.enabled, version});
  } catch {
    return response({error: 'POLICY_UNAVAILABLE'}, 503);
  }
}
