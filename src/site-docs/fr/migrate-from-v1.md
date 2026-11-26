---
title: 'Migrer depuis la v1'
description: 'Comment déplacer un tableau v1 vers la v2 : exporter depuis l’ancienne instance, importer dans la nouvelle. La doc v1 est gelée à /docs/v1.'
---

# Migrer depuis la v1

La documentation de la ligne précédente est gelée à [/docs/v1](/docs/v1) et n’est plus
mise à jour ; elle documente la v1 telle qu’elle était, ce qui est exactement ce qu’une
migration demande.

## Déplacer un tableau

1. Sur l’instance v1, exportez le tableau en markdown (v1 : menu du tableau → export).
2. Sur l’instance v2, créez un tableau et importez le fichier markdown.
   Voir [import et export](/docs/v2/features/import-export) pour le format exact et ce
   qui est conservé (cartes, colonnes, étiquettes, commentaires ; pas les pièces
   jointes — la v2 n’en a pas, voir [limites](/fr/docs/v2/limits)).
3. Recréez les liens que vous voulez partager : en v2, le lien lisible n’accorde que la
   lecture ; passez le rôle du lien à `edit` si les détenteurs du lien doivent écrire,
   ou émettez des liens d’écriture. Voir [liens et participation anonyme](/docs/v2/features/links-and-anonymous).

## Ce qui a changé en 2.0

- Les agents sont des participants de premier plan : des clés par tableau via MCP ([référence MCP](/docs/v2/mcp)).
- Clôturer un tableau le fige et écrit un résumé à partir du journal d’événements
  ([clôture](/docs/v2/features/close-out)).
- La participation anonyme est explicite : un lien plus un nom d’affichage, avec la
  portée d’écriture indiquée sur le tableau ([permissions](/docs/v2/permissions)).
