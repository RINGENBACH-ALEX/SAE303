// Catalogue des fichiers téléchargeables (page Méthode et endpoints /donnees/).
// Chaque fichier existe en JSON et en CSV, générés au build à partir de src/data :
// ce qu'on télécharge est exactement ce que les graphiques utilisent.
import { stations, txAnnuelles, quotidiennes, controle } from "./donnees";
import txExtremes from "../data/tx-extremes.json";
import { moisChauds, decennies, records, communes } from "./etude.js";

type Ligne = Record<string, string | number | null>;

export const fichiers: {
  nom: string;
  titre: string;
  description: string;
  colonnes: string;
  lignes: Ligne[];
}[] = [
  {
    nom: "mois-chauds",
    titre: "Mois sélectionnés comme les plus chauds",
    description: "Les mois arrivés en tête chaque année selon la moyenne des températures maximales. Les résultats du carnet d’analyse donnent 21 mois comptés par station pour 20 années, car les mois à égalité sont tous conservés. Les autres mois ne figurent pas dans ce fichier.",
    colonnes: "station, annee, mois, tx (moyenne mensuelle des TX, °C)",
    lignes: moisChauds,
  },
  {
    nom: "decennies",
    titre: "Comparaison des décennies",
    description: "Pour chaque station et chaque période de dix ans : la moyenne des maximales et le nombre d’années dépassant la moyenne 2003–2022 de cette station. Résultats repris de la synthèse du carnet d’analyse, sans les recalculer à partir de valeurs déjà arrondies.",
    colonnes: "station, periode, total, chaudes, moyenne (°C)",
    lignes: decennies,
  },
  {
    nom: "records",
    titre: "Écarts entre records quotidiens annuels",
    description: "Les deux records de chaque année et leur différence, avec les dates où ils ont été atteints. Nous comparons les mêmes journées disponibles dans les deux stations, en écartant février 2015 des deux côtés. Les records peuvent dater de jours différents.",
    colonnes: "annee, mulhouse (°C), meyenheim (°C), ecart (°C), joursCommuns, datesMulhouse, datesMeyenheim",
    lignes: records,
  },
  {
    nom: "tx-annuelles",
    titre: "Moyennes annuelles des températures maximales",
    description:
      "Une ligne par station et par année, avec la moyenne des températures maximales. Les nombres de mois et de jours utilisés sont indiqués pour vérifier sur combien de mesures repose le calcul.",
    colonnes:
      "station, annee, moisDisponibles, joursUtilises, txMoyenne (°C), reference (moyenne 2003–2022 de la station, °C), anomalie (°C)",
    lignes: txAnnuelles,
  },
  {
    nom: "tx-extremes",
    titre: "Températures maximales les plus hautes et les plus basses de chaque année",
    description:
      "Pour chaque station et chaque année : la plus élevée et la plus basse des températures maximales de la journée, leurs dates et le nombre de jours disponibles. La valeur basse ne représente pas une température minimale nocturne.",
    colonnes: "station, annee, indicateur, tx (°C), dates (JJ/MM/AAAA), joursMesures",
    lignes: txExtremes,
  },
  {
    nom: "tx-quotidiennes",
    titre: "Températures maximales quotidiennes",
    description:
      "Les températures maximales mesurées chaque jour dans les deux stations, de 2003 à 2022. Une case vide indique une mesure manquante, notamment à Mulhouse en février 2015. Ce fichier permet de retrouver les journées utilisées pour comparer les records.",
    colonnes: "date, mulhouse (°C), colmar (°C, station Colmar-Meyenheim)",
    lignes: quotidiennes,
  },
  {
    nom: "stations",
    titre: "Les deux stations",
    description: "Les numéros Météo-France, le nom de la série de mesures, la commune, la position et l’altitude des deux stations.",
    colonnes: "slug, station, numero, serie, commune, latitude, longitude, altitude (m)",
    lignes: stations,
  },
  {
    nom: "controle",
    titre: "Vérification des mesures disponibles",
    description: "Pour chaque station et chaque source : combien de lignes sont attendues, présentes, sans température ou associées au code qualité 1 de Météo-France.",
    colonnes: "station, source, attendues, presentes, manquantes, qualite1",
    lignes: controle,
  },
];

export const geojson = { nom: "haut-rhin", titre: "Communes du Haut-Rhin (GeoJSON, fond de la carte)", donnees: communes };

const cellule = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function versCSV(lignes: Ligne[]) {
  const colonnes = Object.keys(lignes[0]);
  // Les températures ont deux décimales ; les effectifs restent des entiers.
  const temperatures = new Set(["tx", "txMoyenne", "reference", "anomalie", "mulhouse", "colmar", "meyenheim", "ecart", "moyenne"]);
  return [colonnes.join(","), ...lignes.map((l) => colonnes.map((c) => {
    const valeur = l[c];
    return cellule(temperatures.has(c) && typeof valeur === "number" ? valeur.toFixed(2) : valeur);
  }).join(","))].join("\n") + "\n";
}
