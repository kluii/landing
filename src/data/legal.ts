// SPDX-License-Identifier: AGPL-3.0-only
// Legal placeholders. A production build fails while any value still matches {{...}}.
// No placeholder may be replaced by an invented value (docs/legal.md §2).

export const LEGAL = {
  operator: '{{OPERATOR}}',
  legalForm: '{{LEGAL_FORM}}',
  address: '{{ADDRESS}}',
  contact: '{{CONTACT}}',
  registration: '{{REGISTRATION}}',
  publicationDirector: '{{DIRECTOR}}',
  hostName: '{{HOST_NAME}}',
  hostAddress: '{{HOST_ADDRESS}}',
  hostPhone: '{{HOST_PHONE}}',
  region: '{{HOSTING_REGION}}',
  updatedAt: '{{UPDATED_AT}}',
} as const;

export type LegalField = keyof typeof LEGAL;

const PLACEHOLDER = /^\{\{.*\}\}$/;

export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER.test(value);
}

/** Env overrides win over the placeholders (LEGAL_OPERATOR, LEGAL_CONTACT, LEGAL_REGION). */
export function legalValue(field: LegalField): string {
  const envKey = `LEGAL_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  const fromEnv = env[envKey];
  return typeof fromEnv === 'string' && fromEnv !== '' ? fromEnv : LEGAL[field];
}
