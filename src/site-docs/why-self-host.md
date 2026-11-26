---
title: 'Why self-host'
description: 'One image, one compose file, AGPL-3.0, every feature included. No licence key, no feature gate, your data on your machine.'
sidebar:
  order: 92
generated: false
---

# Why self-host

Klui ships as one container image with Postgres included in the compose file. Every
feature — anonymous link participation, agent keys over MCP, close-out summaries,
markdown export and import — is included. There is no licence key and no feature gate,
because the code is AGPL-3.0: you can read it, run it, modify it, and redistribute it
under the same terms.

Your boards live on your machine, under your backup policy, with the retention you
configure (`KLUI_RETENTION_EVENTS_DAYS`, <!--@claim:retentionDays--> days by default). The hosted tier, when it
exists, will be announced in the changelog; self-hosting is never the second-class path.

See the [quickstart](/docs/v2/quickstart) to run it, and
[deployment](/docs/v2/deployment) for backup, restore and upgrades.
