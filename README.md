- URL site WEB : [(à compléter après le déploiement Netlify)](https://lively-profiterole-997d69.netlify.app/)
- URL Notebook Observable : https://observablehq.com/@mmi-montbeliard/sae-303-gr-06
- Nom : Ringenbach
- Prénom : Alex
- Nom binome : Philippon
- Prénom binome : Melvyn

# Remarques :

**Chaleur en Sud-Alsace** : les températures maximales (TX) de deux stations Météo-France du Haut-Rhin, Mulhouse et Colmar-Meyenheim, de 2003 à 2022. Site construit sur la base commune `base-astro-tw-plot` (Astro, TailwindCSS, Observable Plot). La logique des composants vient des TP (PlotFigure, figure accessible, routes paramétriques), mais l'identité graphique est propre au projet.

## Le récit en 4 temps ([src/pages/index.astro](src/pages/index.astro))

| Temps | Titre porteur |
|---|---|
| 01 · Contexte | Deux thermomètres, vingt ans de journées |
| 02 · Exploration | D'une année à l'autre, près de 4 °C d'écart |
| 03 · Révélation | La station de Mulhouse est la plus fraîche, 20 années sur 20 |
| 04 · Conclusion | Une décennie plus chaude d'environ 1 °C, aux deux stations |

Un sommaire suit la lecture (`IntersectionObserver`, comme la page à ancres du TP2). Les nombres cités dans les textes sont calculés au build à partir des données ([src/lib/donnees.ts](src/lib/donnees.ts)), aucun n'est recopié à la main.

## Routes d'export (justifiées sur la page [Méthode](src/pages/methode.astro))

La question qui tranche : est-ce que ça doit bouger chez le lecteur ?

- **A · Au build** : les 7 graphiques du récit ([src/lib/graphiques.ts](src/lib/graphiques.ts), rendus en SVG par [PlotFigure](src/components/PlotFigure.astro) et jsdom). Ils sont identiques pour tous les lecteurs, donc aucun JavaScript n'est envoyé.
- **B · Chez le lecteur** : « Et votre année ? ». Un `<select>` redessine les journées de l'année et la carte des anomalies ([src/scripts/explorer-annee.ts](src/scripts/explorer-annee.ts), [src/lib/graphiques-annee.ts](src/lib/graphiques-annee.ts)). Seule l'année choisie est chargée (`/donnees/quotidien/<année>.json`, environ 10 ko). Plot est importé dynamiquement à l'approche de la section, et le rendu du build (2022) sert de repli sans JavaScript.
- **C · Une page par valeur** : une fiche par station, générée par `getStaticPaths()` ([src/pages/stations/[station].astro](src/pages/stations/[station].astro)).

Chaque figure porte une pastille A, B ou C ([RouteBadge](src/components/RouteBadge.astro)) qui renvoie vers sa justification.

## Données

- [scripts/preparer-donnees.mjs](scripts/preparer-donnees.mjs) refait les calculs du notebook à partir des fichiers bruts Météo-France. Les fichiers bruts ne sont **pas** dans le dépôt : le script prend en argument le dossier où on les a extraits.
- [src/data/](src/data/) contient les fichiers préfiltrés : seulement les colonnes utiles, dénominateurs conservés (mois et jours utilisés, jours communs), deux décimales.
- Les fichiers téléchargeables (CSV et JSON) sont générés au build par un endpoint ([src/pages/donnees/[fichier].ts](src/pages/donnees/[fichier].ts)) à partir de ces mêmes fichiers. On télécharge donc exactement ce que lisent les graphiques.

## Identité graphique

- **Concept « relevé climatologique »** : le site se présente comme un bulletin scientifique imprimé. Il y a un fond de papier millimétré, des filets fins et des angles droits. Les figures sont numérotées « Fig. 01 » avec des rubriques « Lecture / Source », et chaque chapitre s'ouvre sur un grand numéro « § 01 ». En ouverture, un bandeau pleine largeur montre les 40 années-stations colorées.
- **Typographie** : Fraunces pour les titres et les chiffres, IBM Plex Sans pour le texte, IBM Plex Mono pour les mesures, les repères et les axes des graphiques. Les polices sont auto-hébergées avec Fontsource : aucun appel à Google Fonts.
- **Palette de charte** ([src/styles/global.css](src/styles/global.css)) : papier `#f3f1ea`, encre `#15171a`, graphite et vert sapin des Vosges `#23493c`, sans aucune teinte chaude ni bleue. La couleur est réservée aux données.
- **Palette de données** ([src/lib/palette.ts](src/lib/palette.ts)) : stations en Okabe-Ito (vermillon et bleu, lisibles par les daltoniens), anomalies en RdBu divergente, 8 classes de 0,5 °C. Les bandes de l'ouverture reprennent l'idée des « warming stripes ».

## Accessibilité

- `<figure>` nommée par son titre (`aria-labelledby`), `<figcaption>` (lecture et source), SVG en `role="img"` avec un `aria-label` qui donne les valeurs clés. En route B, cet `aria-label` est recalculé à chaque changement d'année.
- Valeurs de chaque graphique dans un tableau (« Voir les valeurs du graphique »).
- Les `aria-label` techniques que Plot pose sur ses `<g>` sont déplacés dans `data-mark` (`nettoyerAria`, [src/lib/commun.ts](src/lib/commun.ts)), car Lighthouse les signale comme attributs ARIA interdits.
- Couleurs de texte des stations assombries pour atteindre un contraste d'au moins 4,5:1. Lien d'évitement, focus visible, `<label>` sur le sélecteur, `aria-live` pour annoncer la mise à jour.
- Sur petit écran, les graphiques larges défilent horizontalement (zone focusable) au lieu de devenir illisibles.
- **Lighthouse** (mobile) : Accessibilité 100, Bonnes pratiques 100, SEO 100 sur toutes les pages. Performance (serveur avec compression, comme Netlify) : 88 pour l'accueil, 93-95 pour les autres pages.

## Lancer le projet

```sh
npm install
npm run dev
```

`jsdom` est fixé en 30.1.2 et `undici` en 8.11.2 (`overrides`) : les versions plus récentes exigent Node ≥ 22.22. Netlify utilise Node 22 (`.nvmrc`).
