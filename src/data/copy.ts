// SPDX-License-Identifier: AGPL-3.0-only
// Landing + blog chrome copy, per language (L3-04). The EN strings are the locked copy
// from docs/content.md — moving them here must not change a byte. FR uses typographic
// apostrophes (U+2019). Tokens {appVersion} {tools} {installInstance} {version} are filled
// by fill().

export type Lang = 'en' | 'fr';

interface LandingLine {
  claim: string;
  body: string;
  link: string;
  href: string;
}

interface LandingCopy {
  metaTitle: string;
  metaDescription: string;
  pill: string;
  heroH1: string;
  heroLead: string;
  heroCopy: string;
  heroDemo: string;
  copyConfig: string;
  heroSpec: string;
  srWhy: string;
  lines: LandingLine[];
  installTitle: string;
  installSteps: string[];
  installCaption: string;
  quickstartLink: string;
  quickstartHref: string;
  endTitle: string;
  endCopy: string;
  closeoutLink: string;
  closeoutHref: string;
  agentsTitle: string;
  agentsCopy: string;
  agentsLinkA: string;
  agentsLinkB: string;
  agentsFootnote: string;
  limitsTitle: string;
  limitsClose: string;
  finalTitle: string;
  finalNote: string;
}

interface BlogCopy {
  title: string;
  metaTitle: string;
  metaDescription: string;
  lead: string;
  empty: string;
  footnote: string;
  prev: string;
  tagLink: string;
  tocLabel: string;
}

export const LANDING: Record<Lang, LandingCopy> = {
  en: {
    metaTitle: 'Klui — a kanban for projects that end',
    metaDescription:
      'Klui is a fast, self-hosted board where a link is the invite, agents read and write through MCP, and every project closes with a summary you can hand over.',
    pill: 'v{appVersion} — close-out summaries, {tools} MCP tools',
    heroH1: 'A kanban for projects that end.',
    heroLead:
      'Klui is a fast, self-hosted board where a link is the invite, agents read and write through MCP, and every project closes with a summary you can hand over.',
    heroCopy: 'Copy the install command',
    heroDemo: 'Open the live demo board',
    copyConfig: 'Copy the config',
    heroSpec: 'v{version} · AGPL-3.0 · self-hosted · {tools} MCP tools',
    srWhy: 'Why Klui',
    lines: [
      {
        claim: 'No account to join.',
        body: 'A teammate, a client, a stranger: send the link, they pick a display name, they work. Nothing to install, nothing to verify.',
        link: 'Read the permissions model',
        href: '/docs/v2/permissions',
      },
      {
        claim: 'Agents are participants, not integrations.',
        body: 'Per-board keys, {tools} MCP tools, and the same permissions a human has. The setup block is on the page.',
        link: 'Read the MCP reference',
        href: '/docs/v2/mcp',
      },
      {
        claim: 'The project has an end.',
        body: 'Closing a board freezes it and writes a summary from the event log: what got done, by whom, and what is left.',
        link: 'See a close-out summary',
        href: '/docs/v2/features/close-out',
      },
    ],
    installTitle: 'Three commands, one container.',
    installSteps: [
      'Clone the repository, copy the example environment file, start the stack. The compose file brings Postgres 16 with it; the first account created becomes the instance admin.',
      'Set <code>KLUI_PUBLIC_URL</code> in <code>.env</code> to the absolute URL the instance is reachable at — it is required in production.',
      '<code>docker compose down</code> keeps the data volume; <code>down -v</code> deletes it.',
    ],
    installCaption: 'Tested on a {installInstance} instance. Postgres 16 is included.',
    quickstartLink: 'Full quickstart',
    quickstartHref: '/docs/v2/quickstart',
    endTitle: 'The project ends, and the summary writes itself.',
    endCopy:
      'Closing a board freezes it and generates the summary from the event log in the same transaction — computed once, never hand-edited, never regenerated on read. It is a document you can paste into a report, also served as markdown at <code>/boards/:id/summary.md</code>.',
    closeoutLink: 'Read the close-out spec',
    closeoutHref: '/docs/v2/features/close-out',
    agentsTitle: 'Point an agent at the board.',
    agentsCopy:
      'Create a per-board agent key in the setup panel: it can read and write that one board and nothing else, with the same permissions a human link holder has. The key is shown once at creation and can be revoked at any time. The config block below is what a human pastes into their client.',
    agentsLinkA: 'MCP reference',
    agentsLinkB: 'Setup panel',
    agentsFootnote: '{tools} tools · JSON-RPC 2.0 · POST /mcp',
    limitsTitle: 'What it does not do',
    limitsClose: 'If one of these is a blocker, Klui is not the right tool yet.',
    finalTitle: 'Run it in five minutes.',
    finalNote: 'No account, no licence key, no telemetry unless you turn it on.',
  },
  fr: {
    metaTitle: 'Klui — un kanban pour les projets qui se terminent',
    metaDescription:
      'Klui est un tableau auto-hébergé et rapide : un lien suffit pour inviter, les agents lisent et écrivent via MCP, et chaque projet se clôture par un résumé prêt à transmettre.',
    pill: 'v{appVersion} — résumés de clôture, {tools} outils MCP',
    heroH1: 'Un kanban pour les projets qui se terminent.',
    heroLead:
      'Klui est un tableau auto-hébergé et rapide : un lien suffit pour inviter, les agents lisent et écrivent via MCP, et chaque projet se termine par un résumé que vous pouvez transmettre.',
    heroCopy: 'Copier la commande d’installation',
    heroDemo: 'Ouvrir le tableau de démo',
    copyConfig: 'Copier la configuration',
    heroSpec: 'v{version} · AGPL-3.0 · auto-hébergé · {tools} outils MCP',
    srWhy: 'Pourquoi Klui',
    lines: [
      {
        claim: 'Pas de compte à créer.',
        body: 'Un collègue, un client, un inconnu : envoyez le lien, la personne choisit un nom d’affichage et travaille. Rien à installer, rien à vérifier.',
        link: 'Lire le modèle de permissions',
        href: '/docs/v2/permissions',
      },
      {
        claim: 'Les agents sont des participants, pas des intégrations.',
        body: 'Des clés par tableau, {tools} outils MCP, et les mêmes permissions qu’un humain. Le bloc de configuration est sur la page.',
        link: 'Lire la référence MCP',
        href: '/docs/v2/mcp',
      },
      {
        claim: 'Le projet a une fin.',
        body: 'Clôturer un tableau le fige et écrit un résumé à partir du journal d’événements : ce qui a été fait, par qui, et ce qui reste.',
        link: 'Voir un résumé de clôture',
        href: '/docs/v2/features/close-out',
      },
    ],
    installTitle: 'Trois commandes, un conteneur.',
    installSteps: [
      'Clonez le dépôt, copiez le fichier d’exemple d’environnement, démarrez la pile. Le fichier compose embarque Postgres 16 ; le premier compte créé devient l’administrateur de l’instance.',
      'Renseignez <code>KLUI_PUBLIC_URL</code> dans <code>.env</code> avec l’URL absolue à laquelle l’instance est joignable — elle est requise en production.',
      '<code>docker compose down</code> conserve le volume de données ; <code>down -v</code> le supprime.',
    ],
    installCaption: 'Testé sur une instance {installInstance}. Postgres 16 est inclus.',
    quickstartLink: 'Guide de démarrage complet',
    quickstartHref: '/fr/docs/v2/quickstart',
    endTitle: 'Le projet se termine, et le résumé s’écrit tout seul.',
    endCopy:
      'Clôturer un tableau le fige et génère le résumé à partir du journal d’événements dans la même transaction — calculé une fois, jamais modifié à la main, jamais régénéré à la lecture. C’est un document que vous pouvez coller dans un rapport, aussi servi en markdown à <code>/boards/:id/summary.md</code>.',
    closeoutLink: 'Lire la spec de clôture',
    closeoutHref: '/docs/v2/features/close-out',
    agentsTitle: 'Pointez un agent vers le tableau.',
    agentsCopy:
      'Créez une clé d’agent par tableau dans le panneau de configuration : elle peut lire et écrire ce tableau uniquement, avec les mêmes permissions qu’un détenteur de lien humain. La clé n’est affichée qu’une fois à la création et peut être révoquée à tout moment. Le bloc de configuration ci-dessous est ce qu’un humain colle dans son client.',
    agentsLinkA: 'Référence MCP',
    agentsLinkB: 'Panneau de configuration',
    agentsFootnote: '{tools} outils · JSON-RPC 2.0 · POST /mcp',
    limitsTitle: 'Ce que Klui ne fait pas',
    limitsClose: 'Si l’un de ces points bloque, Klui n’est pas encore le bon outil.',
    finalTitle: 'Lancez-le en cinq minutes.',
    finalNote: 'Pas de compte, pas de clé de licence, aucune télémétrie sauf si vous l’activez.',
  },
};

export const BLOG: Record<Lang, BlogCopy> = {
  en: {
    title: 'Changelog',
    metaTitle: 'Changelog — Klui',
    metaDescription:
      'Release notes for Klui: what changed, what broke, and what is still missing. Generated from commits, written by a human.',
    lead: 'One post per release. The lists are generated from conventional commits; the opening paragraph is written by a human. Each post names the commit range it covers.',
    empty: 'No releases yet. The first release note appears with 2.0.',
    footnote: 'App releases on GitHub',
    prev: 'Previous:',
    tagLink: 'app tag v{version} on GitHub',
    tocLabel: 'On this page',
  },
  fr: {
    title: 'Journal des versions',
    metaTitle: 'Journal des versions — Klui',
    metaDescription:
      'Notes de version de Klui : ce qui a changé, ce qui a cassé, ce qui manque encore. Listes générées depuis les commits, texte écrit par un humain.',
    lead: 'Une publication par version. Les listes sont générées depuis les commits conventionnels ; le paragraphe d’ouverture est écrit par un humain. Chaque publication nomme la plage de commits couverte.',
    empty: 'Aucune version publiée pour l’instant. La première note paraîtra avec la 2.0.',
    footnote: 'Versions de l’application sur GitHub',
    prev: 'Précédent :',
    tagLink: 'tag v{version} de l’application sur GitHub',
    tocLabel: 'Sur cette page',
  },
};

export const NAV: Record<
  Lang,
  { docs: string; changelog: string; github: string; deploy: string }
> = {
  en: { docs: 'Docs', changelog: 'Changelog', github: 'GitHub', deploy: 'Deploy' },
  fr: { docs: 'Docs', changelog: 'Journal', github: 'GitHub', deploy: 'Déployer' },
};

export const FOOTER: Record<
  Lang,
  { docs: string; changelog: string; github: string; licence: string; privacy: string }
> = {
  en: {
    docs: 'Docs',
    changelog: 'Changelog',
    github: 'GitHub',
    licence: 'Licence',
    privacy: 'Privacy',
  },
  fr: {
    docs: 'Docs',
    changelog: 'Journal',
    github: 'GitHub',
    licence: 'Licence',
    privacy: 'Confidentialité',
  },
};

const TOKENS: Record<string, string> = {
  appVersion: '',
  tools: '',
  installInstance: '',
  version: '',
};

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) =>
    String(values[key] ?? TOKENS[key] ?? ''),
  );
}
