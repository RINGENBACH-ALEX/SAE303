// Prépare les fichiers de données du site à partir des fichiers bruts de Météo-France.
// Reprend pas à pas les calculs du notebook Observable (SAE 303 — Gr 06).
//
// Les fichiers bruts ne sont PAS dans le dépôt. Pour relancer le script :
//   1. télécharger SH_TX_metropole.zip (jeu LSH) et SQR_TX_metropole.zip (jeu SQR) sur data.gouv.fr ;
//   2. en extraire SH_MTX268224006.csv, SH_MTX268205001.csv, SQR_MTX268224006.csv, SQR_MTX268205001.csv
//      dans un même dossier, avec le contour departement-68-haut-rhin.geojson (france-geojson) ;
//   3. node scripts/preparer-donnees.mjs <dossier>
//
// Sortie : src/data/*.json — seulement les colonnes utiles, dénominateurs gardés, deux décimales.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dossier = process.argv[2];
if (!dossier) {
  console.error("Usage : node scripts/preparer-donnees.mjs <dossier des fichiers bruts>");
  process.exit(1);
}
const sortie = new URL("../src/data/", import.meta.url);
mkdirSync(sortie, { recursive: true });

const DEBUT = 2003;
const FIN = 2022;
const arrondi = (x) => (x === null ? null : Math.round(x * 100) / 100);
const somme = (tab, f) => tab.reduce((s, d) => s + f(d), 0);
const joursDuMois = (annee, mois) => new Date(Date.UTC(annee, mois, 0)).getUTCDate();

// Coordonnées et altitude : en-tête des fichiers et liste des stations de Météo-France
const stations = [
  {
    slug: "mulhouse",
    station: "Mulhouse",
    numero: "68224006",
    serie: "MTX268224006",
    commune: "Mulhouse",
    latitude: 47.75,
    longitude: 7.288833,
    altitude: 245,
  },
  {
    slug: "colmar-meyenheim",
    station: "Colmar-Meyenheim",
    numero: "68205001",
    serie: "MTX268205001",
    commune: "Oberentzen",
    latitude: 47.928667,
    longitude: 7.407667,
    altitude: 207,
  },
];

// Lecture d'un CSV Météo-France : on retire les lignes de commentaire (« # ») et les lignes vides
function lireCSV(fichier) {
  const lignes = readFileSync(join(dossier, fichier), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
  const entetes = lignes.shift().split(";");
  return lignes.map((l) => Object.fromEntries(l.split(";").map((v, i) => [entetes[i], v.trim()])));
}
const nombre = (v) => (v === "" || v === undefined || !Number.isFinite(Number(v.replace(",", "."))) ? null : Number(v.replace(",", ".")));

// ---------------------------------------------------------------------------
// 1. Séries mensuelles homogénéisées (SH_TX) → moyennes annuelles pondérées
// ---------------------------------------------------------------------------
const annuelles = [];
const controle = [];

for (const s of stations) {
  const mensuel = lireCSV(`SH_${s.serie}.csv`)
    .map((l) => ({
      annee: Number(l.YYYYMM.slice(0, 4)),
      mois: Number(l.YYYYMM.slice(4, 6)),
      tx: nombre(l.VALEUR),
      qualite: Number(l.Q_HOM),
    }))
    .filter((d) => d.annee >= DEBUT && d.annee <= FIN);

  controle.push({
    station: s.station,
    source: "SH_TX",
    attendues: (FIN - DEBUT + 1) * 12,
    presentes: mensuel.length,
    manquantes: mensuel.filter((d) => d.tx === null).length,
    qualite1: mensuel.filter((d) => d.qualite === 1).length,
  });

  const valides = mensuel.filter((d) => d.qualite === 1 && d.tx !== null);
  for (let annee = DEBUT; annee <= FIN; annee++) {
    const mois = valides.filter((d) => d.annee === annee);
    const jours = somme(mois, (d) => joursDuMois(annee, d.mois));
    const complete = mois.length === 12 && new Set(mois.map((d) => d.mois)).size === 12;
    annuelles.push({
      station: s.station,
      annee,
      moisDisponibles: mois.length,
      joursUtilises: jours,
      txMoyenne: complete ? somme(mois, (d) => d.tx * joursDuMois(annee, d.mois)) / jours : null,
    });
  }
}

// Référence propre à chaque station = moyenne de ses 20 TX annuelles ; anomalie = TX − référence
for (const s of stations) {
  const lignes = annuelles.filter((d) => d.station === s.station && d.txMoyenne !== null);
  const reference = somme(lignes, (d) => d.txMoyenne) / lignes.length;
  for (const d of lignes) {
    d.reference = reference;
    d.anomalie = d.txMoyenne - reference;
  }
}

// ---------------------------------------------------------------------------
// 2. Séries quotidiennes de référence (SQR_TX) → jours communs aux deux stations
// ---------------------------------------------------------------------------
const quotidien = new Map(); // date → { mulhouse, colmar }
for (const s of stations) {
  const jours = lireCSV(`SQR_${s.serie}.csv`)
    .map((l) => ({
      date: `${l.AAAAMMJJ.slice(0, 4)}-${l.AAAAMMJJ.slice(4, 6)}-${l.AAAAMMJJ.slice(6, 8)}`,
      annee: Number(l.AAAAMMJJ.slice(0, 4)),
      tx: nombre(l.VALEUR),
      qualite: Number(l.Q_SQR),
    }))
    .filter((d) => d.annee >= DEBUT && d.annee <= FIN);

  const attendues = Math.round((Date.UTC(FIN + 1, 0, 1) - Date.UTC(DEBUT, 0, 1)) / 864e5);
  controle.push({
    station: s.station,
    source: "SQR_TX",
    attendues,
    presentes: jours.length,
    manquantes: jours.filter((d) => d.tx === null).length,
    qualite1: jours.filter((d) => d.qualite === 1).length,
  });

  const cle = s.slug === "mulhouse" ? "mulhouse" : "colmar";
  for (const d of jours) {
    if (!quotidien.has(d.date)) quotidien.set(d.date, { date: d.date, mulhouse: null, colmar: null });
    quotidien.get(d.date)[cle] = d.qualite === 1 ? d.tx : null;
  }
}
const quotidiennes = [...quotidien.values()].sort((a, b) => a.date.localeCompare(b.date));

// ---------------------------------------------------------------------------
// 3. Contour du Haut-Rhin, coordonnées arrondies (≈ 100 m), suffisant à cette échelle
// ---------------------------------------------------------------------------
const geo = JSON.parse(readFileSync(join(dossier, "departement-68-haut-rhin.geojson"), "utf8"));
const arrondirCoord = (c) => (typeof c[0] === "number" ? [Math.round(c[0] * 1e3) / 1e3, Math.round(c[1] * 1e3) / 1e3] : c.map(arrondirCoord));
const hautRhin = {
  type: "FeatureCollection",
  features: (geo.type === "FeatureCollection" ? geo.features : [geo]).map((f) => ({
    type: "Feature",
    properties: { code: f.properties.code, nom: f.properties.nom },
    geometry: { type: f.geometry.type, coordinates: arrondirCoord(f.geometry.coordinates) },
  })),
};

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------
const ecrire = (nom, donnees) => {
  writeFileSync(new URL(nom, sortie), JSON.stringify(donnees, null, nom.includes("quotidiennes") || nom.includes("haut-rhin") ? 0 : 1) + "\n");
  console.log(`src/data/${nom}`, Array.isArray(donnees) ? `${donnees.length} lignes` : "");
};

ecrire("stations.json", stations);
ecrire(
  "tx-annuelles.json",
  annuelles.map((d) => ({
    station: d.station,
    annee: d.annee,
    moisDisponibles: d.moisDisponibles,
    joursUtilises: d.joursUtilises,
    txMoyenne: arrondi(d.txMoyenne),
    reference: arrondi(d.reference ?? null),
    anomalie: arrondi(d.anomalie ?? null),
  })),
);
ecrire("tx-quotidiennes.json", quotidiennes);
ecrire("controle.json", controle);
ecrire("haut-rhin.json", hautRhin);
