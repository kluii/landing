// SPDX-License-Identifier: AGPL-3.0-only
// The two landing variants and their routes (ADR-0015 / S-35). One component tree,
// two pitches: 'cloud' lives on /, 'selfhosted' on /selfhosted, with FR twins.
import type { Lang } from './copy.ts';

export type Variant = 'cloud' | 'selfhosted';

export const VARIANTS: Variant[] = ['cloud', 'selfhosted'];

export const VARIANT_ROUTES: Record<Lang, Record<Variant, string>> = {
  en: { cloud: '/', selfhosted: '/selfhosted' },
  fr: { cloud: '/fr', selfhosted: '/fr/selfhosted' },
};

export interface LandingPaths {
  path: string;
  frPath?: string;
  enPath?: string;
}

/** Canonical path + hreflang twins for one landing route. */
export function landingPaths(lang: Lang, variant: Variant): LandingPaths {
  const otherLang: Lang = lang === 'en' ? 'fr' : 'en';
  const path = VARIANT_ROUTES[lang][variant];
  const twin = VARIANT_ROUTES[otherLang][variant];
  return lang === 'en' ? { path, frPath: twin } : { path, enPath: twin };
}

/** Uniform props for every landing section component, so Landing.astro can render them from one registry. */
export interface SectionProps {
  lang: Lang;
  variant: Variant;
}
