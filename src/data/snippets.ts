// SPDX-License-Identifier: AGPL-3.0-only
// The install snippet exists once, here, and is imported by the landing and the quickstart.
// Trap: two copies drift within one release.

import { LINKS } from './links.ts';

/** The three install commands, byte-identical wherever they render. */
export const INSTALL_COMMANDS = `git clone ${LINKS.github}.git klui
cd klui && cp .env.example .env
docker compose up -d`;

/** MCP client config block. The key is a placeholder, never a token-shaped literal. */
export const MCP_CONFIG = JSON.stringify(
  {
    mcpServers: {
      klui: {
        type: 'http',
        url: 'https://app.example.com/mcp',
        headers: { Authorization: 'Bearer kb_YOUR_KEY' },
      },
    },
  },
  null,
  2,
);
