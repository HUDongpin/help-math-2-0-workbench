import 'server-only';

export class FamilyDatabaseConfigurationError extends Error {
  constructor() {
    super('The Family Portal database is not configured.');
    this.name = 'FamilyDatabaseConfigurationError';
  }
}

export function requireFamilySupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) throw new FamilyDatabaseConfigurationError();
  try {
    return new URL(value).toString().replace(/\/$/u, '');
  } catch {
    throw new FamilyDatabaseConfigurationError();
  }
}

export function requireFamilySupabasePublishableKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!value) throw new FamilyDatabaseConfigurationError();
  return value;
}
