// SPDX-License-Identifier: AGPL-3.0-only
// The release pill (Hero.astro): the pill must link to the release post for the
// documented version in the page's language, and fall back to the blog index when
// the post is missing, in another language, or a draft.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickReleasePost } from '../src/data/release-post.ts';

const post = (lang, version, draft = false) => ({
  data: { draft, lang, version },
  slug: `${lang}-${version}`,
});

test('an EN post is picked on the EN page', () => {
  const posts = [post('en', '2.0.0'), post('fr', '2.0.0')];
  assert.equal(pickReleasePost(posts, 'en', '2.0.0')?.slug, 'en-2.0.0');
});

test('an FR post is picked on the FR page', () => {
  const posts = [post('en', '2.0.0'), post('fr', '2.0.0')];
  assert.equal(pickReleasePost(posts, 'fr', '2.0.0')?.slug, 'fr-2.0.0');
});

test('an EN-only release falls back to null on the FR page', () => {
  const posts = [post('en', '2.0.0')];
  assert.equal(pickReleasePost(posts, 'fr', '2.0.0'), null);
});

test('a draft post is never the release note', () => {
  const posts = [post('en', '2.0.0', true)];
  assert.equal(pickReleasePost(posts, 'en', '2.0.0'), null);
});

test('a version mismatch is never the release note', () => {
  const posts = [post('en', '1.9.0')];
  assert.equal(pickReleasePost(posts, 'en', '2.0.0'), null);
});
