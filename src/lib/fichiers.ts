// Catalogue des fichiers téléchargeables (page Méthode et endpoints /donnees/).
// Chaque fichier existe en JSON et en CSV, générés au build à partir de src/data :
// ce qu'on télécharge est exactement ce que les graphiques utilisent.
import { stations, txAnnuelles, quotidiennes, controle, hautRhin } from "./donnees";

type Ligne = Record<string, string | number | null>;

export const fichiers: {
  nom: string;
  titre: string;
  description: string;
  colonnes: string;
  lignes: Ligne[];
}[] = [
  {
    nom: "tx-annuelles",
    titre: "Moyennes annuelles des températures maximales",
    description:
      "Une ligne par station et par année. Le dénominateur (mois et jours utilisés) est conservé pour vérifier le calcul.",
    colonnes:
      "station, annee, moisDisponibles, joursUtilises, txMoyenne (°C), reference (moyenne 2003–2022 de la station, °C), anomalie (°C)",
    lignes: txAnnuelles,
  },
  {
    nom: "tx-quotidiennes",
    titre: "Températures maximales quotidiennes",
    description:
      "Une ligne par jour de 2003 à 2022 ; vide quand la mesure manque (février 2015 à Mulhouse). Sert aux chiffres sur les journées à 30 °C ou plus.",
    colonnes: "date, mulhouse (°C), colmar (°C, station Colmar-Meyenheim)",
    lignes: quotidiennes,
  },
  {
    nom: "stations",
    titre: "Les deux stations",
    description: "Identifiants Météo-France, série, commune, coordonnées et altitude.",
    colonnes: "slug, station, numero, serie, commune, latitude, longitude, altitude (m)",
    lignes: stations,
  },
  {
    nom: "controle",
    titre: "Contrôle de complétude",
    description: "Mesures attendues, présentes, manquantes et de qualité 1, par station et par source.",
    colonnes: "station, source, attendues, presentes, manquantes, qualite1",
    lignes: controle,
  },
];

export const geojson = { nom: "haut-rhin", titre: "Contour du Haut-Rhin (GeoJSON)", donnees: hautRhin };

const cellule = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function versCSV(lignes: Ligne[]) {
  const colonnes = Object.keys(lignes[0]);
  return [colonnes.join(","), ...lignes.map((l) => colonnes.map((c) => cellule(l[c])).join(","))].join("\n") + "\n";
}
