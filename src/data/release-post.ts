// SPDX-License-Identifier: AGPL-3.0-only
// The announcement pill target: the shipped release note for the documented version
// when it exists, otherwise null — never a dead post URL. Posts are matched per
// language: an EN-only changelog must not become the FR pill's release note.

interface PostLike {
  data: {
    draft: boolean;
    lang: string;
    version: string;
  };
}

export function pickReleasePost<T extends PostLike>(posts: T[], lang: string, version: string): T | null {
  for (const p of posts) {
    if (p.data.draft) continue;
    if (p.data.lang !== lang) continue;
    if (p.data.version !== version) continue;
    return p;
  }
  return null;
}
