// Route B : les filtres des graphiques, côté navigateur (même principe que la carte
// GeoJSON côté client du TP7 : un <select> → on recalcule les options → Plot.plot).
// Chargé à la demande : Plot n'est téléchargé que lorsque le lecteur approche d'un
// graphique filtrable. Avant cela, le rendu du build sert de repli sans JavaScript.
import * as Plot from "@observablehq/plot";
import { barresAnnuelles, evolutionStation, comparaisonCourbes, anomaliesStations, carteAnomalies, pointsAnnee } from "../lib/graphiques";
import { nettoyerAria, type Chart } from "../lib/commun";
import type { Station } from "../lib/palette";

const fabriques: Record<string, (valeur: string) => Chart> = {
  barres: (v) => barresAnnuelles(v as Station),
  evolution: (v) => evolutionStation(v as Station),
  anomalies: (v) => anomaliesStations(v),
  carte: (v) => carteAnomalies(Number(v)),
  comparaison: () => comparaisonCourbes(),
};

// Tableau de la carte (notebook : Inputs.table(pointsAnnee)) mis à jour avec l'année
function remplirTableau(figure: HTMLElement, annee: number) {
  const corps = figure.querySelector<HTMLTableSectionElement>("[data-tableau-annee]");
  if (!corps) return;
  corps.replaceChildren(
    ...pointsAnnee(annee).map((p) => {
      const ligne = document.createElement("tr");
      const entete = document.createElement("th");
      entete.scope = "row";
      entete.textContent = p.station;
      ligne.append(entete);
      for (const v of [String(p.annee), p.txMoyenne.toFixed(2), p.reference.toFixed(2), p.anomalie.toFixed(2)]) {
        const cellule = document.createElement("td");
        cellule.textContent = v;
        ligne.append(cellule);
      }
      return ligne;
    }),
  );
}

export function brancher(figure: HTMLElement) {
  if (figure.dataset.branche) return;
  figure.dataset.branche = "oui";
  const type = figure.dataset.graphique!;
  // Pas de filtre : le paramètre est fixé par la page (data-valeur)
  const select = figure.querySelector<HTMLSelectElement>("select[data-filtre]");
  const valeur = () => select?.value ?? figure.dataset.valeur ?? "";
  const zone = figure.querySelector<HTMLElement>("[role=img]")!;
  const titre = figure.querySelector<HTMLElement>("[data-titre]")!;
  const sousTitre = figure.querySelector<HTMLElement>("[data-sous-titre]")!;
  const statut = figure.querySelector<HTMLElement>("[data-statut]");

  function rendre(annoncer: boolean) {
    const chart = fabriques[type](valeur());
    zone.replaceChildren(nettoyerAria(Plot.plot(chart.options) as unknown as Element));
    zone.setAttribute("aria-label", chart.label);
    titre.textContent = chart.titre;
    sousTitre.textContent = chart.sousTitre;
    if (type === "carte") remplirTableau(figure, Number(valeur()));
    if (select && statut && annoncer) statut.textContent = `Graphique mis à jour : ${select.selectedOptions[0].textContent}`;
  }

  select?.addEventListener("change", () => rendre(true));
  // Remplace le rendu du build (sans infobulles) par la version interactive
  rendre(false);
}
