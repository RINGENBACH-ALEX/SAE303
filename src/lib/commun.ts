// Types et utilitaires partagés par les graphiques (build et navigateur).
import type * as Plot from "@observablehq/plot";

// Route d'export : A = au build, B = chez le lecteur, C = une page par valeur
export type Route = "A" | "B" | "C";

export interface Chart {
  titre: string;
  sousTitre: string; // la phrase-clé : ce que le graphique montre
  label: string; // alternative textuelle (aria-label)
  legende?: string; // figcaption : comment lire, limites
  source: string;
  route: Route;
  options: Plot.PlotOptions;
  largeurMin?: number; // en dessous, le graphique défile horizontalement (petits écrans)
}

// Plot nomme ses groupes de marques avec aria-label sur des <g> sans rôle, ce que
// les contrôles d'accessibilité refusent. Le graphique entier est déjà une image
// nommée (role="img") : on déplace ces noms techniques dans data-mark.
export function nettoyerAria(racine: Element) {
  racine.querySelectorAll("g[aria-label]").forEach((g) => {
    g.setAttribute("data-mark", g.getAttribute("aria-label")!);
    g.removeAttribute("aria-label");
  });
  return racine;
}
