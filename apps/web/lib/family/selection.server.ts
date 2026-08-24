import 'server-only';

import {cookies} from 'next/headers';

import {familyChildSelectionSchema} from './schemas';

export const FAMILY_SELECTED_CHILD_COOKIE =
  'help_math_family_selected_child';

export async function readSelectedFamilyChildId() {
  const value = (await cookies()).get(FAMILY_SELECTED_CHILD_COOKIE)?.value;
  const parsed = familyChildSelectionSchema.safeParse({childId: value});
  return parsed.success ? parsed.data.childId : undefined;
}

export async function storeSelectedFamilyChildId(childId: string) {
  (await cookies()).set(FAMILY_SELECTED_CHILD_COOKIE, childId, {
    httpOnly: true,
    maxAge: 8 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSelectedFamilyChildId() {
  (await cookies()).set(FAMILY_SELECTED_CHILD_COOKIE, '', {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
