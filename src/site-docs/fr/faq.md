---
title: 'FAQ'
description: 'Réponses aux questions que les exploitants posent vraiment : liens anonymes, clés d’agent, clôture, export, rétention, propriété des données.'
---

# FAQ

Les réponses d’abord, les détails derrière les liens.

## Quelqu’un peut-il travailler sur un tableau sans compte ?

Oui. Envoyez le lien du tableau, la personne choisit un nom d’affichage et travaille.
Le lien lisible n’accorde que la lecture ; un rôle de lien `edit` permet à toute personne
possédant l’URL de créer, modifier, déplacer et terminer des cartes — pas de suppression,
pas de structure de colonnes, pas d’export. Un identifiant d’écriture révocable est un
lien d’écriture séparé. Voir [liens et participation anonyme](/docs/v2/features/links-and-anonymous).

## Comment les agents obtiennent-ils l’accès ?

Des clés d’agent par tableau, limitées à ce tableau, avec les mêmes permissions qu’un
détenteur de lien humain. Le bloc de configuration est un config MCP standard avec une
clé bearer ; la clé n’est affichée qu’une fois à la création. Voir la [référence MCP](/docs/v2/mcp)
et [agents](/docs/v2/features/agents).

## Que se passe-t-il quand le projet se termine ?

Clôturer un tableau le fige et génère un résumé à partir du journal d’événements : ce qui
a été fait, par qui, ce qui reste, et le rythme du travail. Le résumé est calculé, jamais
modifié à la main, et est aussi servi en markdown à `/boards/:id/summary.md`. Voir
[clôture](/docs/v2/features/close-out).

## Puis-je reconstruire le tableau ailleurs ?

Oui. Le tableau s’exporte en markdown et se réimporte ; un export permet de reconstruire
le tableau ailleurs. Voir [import et export](/docs/v2/features/import-export).

## Combien de temps les événements sont-ils conservés ?

365 jours par défaut, configurable avec `KLUI_RETENTION_EVENTS_DAYS`. Les événements
référencés par un résumé de clôture sont exemptés de rétention. Voir
[déploiement](/docs/v2/deployment) et [architecture](/docs/v2/architecture).

## À qui appartiennent les données d’une instance auto-hébergée ?

À la personne qui exploite l’instance. Le site que vous lisez ne collecte rien d’autre
qu’une mesure d’audience optionnelle et sans cookie (voir [confidentialité](/legal/confidentialite)) ;
les données d’une instance Klui auto-hébergée sont sous le contrôle de son exploitant,
pas de ce site.

## Existe-t-il une version hébergée ?

Pas encore. La voie principale est l’auto-hébergement ; il n’y a pas de page de tarifs
parce qu’il n’y a rien à acheter. Quand une offre hébergée existera, ses conditions
seront publiées ici.
