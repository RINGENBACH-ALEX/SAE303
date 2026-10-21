// Les graphiques du notebook Observable (SAE 303 — Gr 06), repris à l'identique :
// mêmes marques, mêmes encodages, mêmes couleurs, mêmes échelles.
// Seule différence : certains reçoivent un paramètre (station, année) piloté par un
// <select>, comme les filtres du TP7.
//
// Module léger, utilisé au build (PlotFigure) ET dans le navigateur (scripts/filtres.ts) :
// il n'importe que les petits fichiers de données.
import * as Plot from "@observablehq/plot";
import stations from "../data/stations.json";
import txAnnuellesBrutes from "../data/tx-annuelles.json";
import hautRhin from "../data/haut-rhin.json";
import txExtremes from "../data/tx-extremes.json";
import { STATIONS, couleurStation, type Station } from "./palette";
import { deg, degSigne } from "./format";
import type { Chart } from "./commun";

export type { Chart, Route } from "./commun";

type Annuelle = { station: string; annee: number; txMoyenne: number; reference: number; anomalie: number };
const txAnnuelles = txAnnuellesBrutes as Annuelle[];
const serie = (station: Station) => txAnnuelles.filter((d) => d.station === station);
const annees = Array.from({ length: 20 }, (_, i) => 2003 + i);

const SOURCE_SH = "Météo-France, séries mensuelles homogénéisées SH_TX (Q_HOM = 1), 2003–2022";

// Domaine vertical commun aux deux stations (notebook : domaineTXCommun)
const valeurs = txAnnuelles.map((d) => d.txMoyenne);
export const domaineTXCommun = [Math.floor(Math.min(...valeurs)), Math.ceil(Math.max(...valeurs))];
// Échelle de la carte : amplitude maximale des anomalies, arrondie (notebook : amplitudeAnomalies)
export const amplitudeAnomalies = Math.ceil(Math.max(...txAnnuelles.map((d) => Math.abs(d.anomalie))));

const extremes = (station: Station) => {
  const s = serie(station);
  return {
    min: s.reduce((a, b) => (b.txMoyenne < a.txMoyenne ? b : a)),
    max: s.reduce((a, b) => (b.txMoyenne > a.txMoyenne ? b : a)),
  };
};

// ---------------------------------------------------------------------------
// Notebook § 1.6 — distributionTX (Mulhouse, YlOrRd) et distributionTXMeyenheim
// (Colmar-Meyenheim, Blues) : un seul graphique, la station choisie par un filtre.
// ---------------------------------------------------------------------------
const schemaBarres: Record<Station, string> = { Mulhouse: "YlOrRd", "Colmar-Meyenheim": "Blues" };

export function barresAnnuelles(station: Station): Chart {
  // txParAnnee.filter(d => d.station === station)
  const data = serie(station).map((d) => ({ annee: d.annee, tx: d.txMoyenne }));
  const { min, max } = extremes(station);
  return {
    // title, subtitle et caption du notebook, à l'identique
    titre: `${station} : évolution des températures maximales`,
    sousTitre: "Moyenne annuelle des TX · 2003–2022",
    label: `Barres horizontales de la moyenne annuelle des températures maximales à ${station}, de 2003 (en haut) à 2022 (en bas), d'autant plus foncées que l'année est chaude. La plus basse : ${min.annee} (${deg(min.txMoyenne, 2)}) ; la plus haute : ${max.annee} (${deg(max.txMoyenne, 2)}).`,
    legende: "Axe tronqué : les barres commencent à 12 °C.",
    source: "Météo-France, SH_TX",
    route: "B",
    largeurMin: 560,
    options: {
      width: 950,
      height: 540,
      marginLeft: 65,
      x: { label: "Moyenne annuelle des TX (°C)", domain: [12, 20], ticks: [12, 16, 20], grid: true, tickSize: 0 },
      y: { label: "Année", domain: annees, ticks: annees, tickFormat: (d: number) => String(d), tickSize: 0 },
      color: { scheme: schemaBarres[station], legend: true, label: "TX moyenne (°C)" },
      marks: [
        Plot.barX(data, {
          y: "annee",
          x1: 12,
          x2: "tx",
          fill: "tx",
          insetTop: 2,
          insetBottom: 2,
          tip: true,
          title: (d: { annee: number; tx: number }) => `${d.annee} : ${d.tx?.toFixed(2)} °C`,
        }),
        Plot.ruleX([12]),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Notebook — graphiqueExtremesMulhouse / graphiqueExtremesMeyenheim : la TX la plus
// élevée et la plus basse de chaque année (filtre : la station). Comme dans le
// notebook, l'échelle de Colmar-Meyenheim couvre les valeurs des deux stations.
// ---------------------------------------------------------------------------
type Extreme = (typeof txExtremes)[number];

export function extremesStation(station: Station): Chart {
  const data = txExtremes.filter((d) => d.station === station);
  const hautes = data.filter((d) => d.indicateur === "TX la plus élevée");
  const basses = data.filter((d) => d.indicateur === "TX la plus basse");
  const record = hautes.reduce((a, b) => (b.tx > a.tx ? b : a));
  const froid = basses.reduce((a, b) => (b.tx < a.tx ? b : a));
  const incomplete = data.find((d) => d.joursMesures < 365);
  return {
    titre: `${station} : les TX extrêmes de chaque année`,
    sousTitre: "2003–2022 · Températures en °C · Dates au survol",
    label: `Tableau coloré de 2003 à 2022 pour ${station} : sur la ligne du haut, la température maximale quotidienne la plus élevée de chaque année ; sur celle du bas, la plus basse. Record : ${deg(record.tx)} le ${record.dates}. Journée la plus froide : ${deg(froid.tx)} le ${froid.dates}.`,
    legende: `Pour chaque année, la plus haute et la plus basse des températures maximales quotidiennes ; couleur du bleu (froid) au rouge (chaud). Les dates s'affichent au survol.${
      incomplete ? ` En ${incomplete.annee}, seuls ${incomplete.joursMesures} jours sont mesurés (février manquant).` : ""
    }`,
    source: "Météo-France, séries quotidiennes de référence SQR_TX (Q_SQR = 1), 2003–2022",
    route: "B",
    largeurMin: 760,
    options: {
      width: 1000,
      height: 280,
      marginLeft: 145,
      marginBottom: 60,
      x: { label: "Année", domain: annees, tickFormat: (d: number) => String(d), tickRotate: -45, tickSize: 0 },
      y: { label: null, domain: ["TX la plus élevée", "TX la plus basse"], tickSize: 0, padding: 0.2 },
      color: {
        type: "linear",
        ...(station === "Colmar-Meyenheim" && {
          domain: [Math.min(...txExtremes.map((d) => d.tx)), Math.max(...txExtremes.map((d) => d.tx))],
        }),
        scheme: "RdYlBu",
        reverse: true,
        legend: true,
        label: "Température maximale quotidienne (°C)",
      },
      marks: [
        Plot.cell(data, {
          x: "annee",
          y: "indicateur",
          fill: "tx",
          inset: 1,
          tip: true,
          title: (d: Extreme) => `${d.annee} — ${d.indicateur}
` + `${d.tx.toFixed(1)} °C
Date(s) : ${d.dates}`,
        }),
        Plot.text(data, {
          x: "annee",
          y: "indicateur",
          text: (d: Extreme) => d.tx.toFixed(1),
          fill: "#111",
          stroke: "white",
          strokeWidth: 2,
          fontSize: 10,
        }),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Notebook § 4.2 — comparaisonCourbesTX
// ---------------------------------------------------------------------------
export function comparaisonCourbes(): Chart {
  const ecarts = annees.map((a) => {
    const [m, c] = STATIONS.map((s) => txAnnuelles.find((d) => d.annee === a && d.station === s)!.txMoyenne);
    return c - m;
  });
  const plusChaude = ecarts.filter((e) => e > 0).length;
  return {
    titre: "Comparaison des moyennes annuelles des TX à Mulhouse et Colmar-Meyenheim",
    sousTitre: `La courbe bleue reste au-dessus de l'orange ${plusChaude} années sur ${annees.length} : la station de la ville est la plus fraîche, de ${deg(Math.min(...ecarts), 2)} à ${deg(Math.max(...ecarts), 2)} selon l'année`,
    label:
      "Comparaison des moyennes annuelles des températures maximales quotidiennes à Mulhouse (orange) et Colmar-Meyenheim (bleu) entre 2003 et 2022, sur les mêmes axes. La courbe de Colmar-Meyenheim est au-dessus chaque année.",
    legende:
      "Les deux courbes partagent les mêmes axes : orange = Mulhouse, bleu = Colmar-Meyenheim. Ces courbes comparent niveaux et variations ; l'axe ne commence pas à zéro.",
    source: `${SOURCE_SH}, Mulhouse 68224006 et Colmar-Meyenheim 68205001 — moyennes pondérées`,
    route: "A",
    largeurMin: 560,
    options: {
      width: 900,
      height: 420,
      marginLeft: 65,
      marginBottom: 50,
      x: { label: "Année", ticks: 10, tickFormat: (a: number) => String(a) },
      y: { label: "Moyenne annuelle des TX (°C)", domain: domaineTXCommun, grid: true, zero: false },
      color: { domain: [...STATIONS], range: STATIONS.map((s) => couleurStation[s]), legend: true, label: "Station" },
      marks: [
        Plot.lineY(txAnnuelles, { x: "annee", y: "txMoyenne", stroke: "station", strokeWidth: 2 }),
        Plot.dot(txAnnuelles, {
          x: "annee",
          y: "txMoyenne",
          fill: "station",
          r: 4,
          tip: true,
          title: (l: Annuelle) => `${l.station} — ${l.annee}\nMoyenne des TX : ${l.txMoyenne.toFixed(2)} °C`,
        }),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Notebook § 4.3 — graphiqueAnomaliesTX (filtre : les stations affichées)
// ---------------------------------------------------------------------------
export const choixStations = ["Les deux stations", ...STATIONS] as const;

export function anomaliesStations(choix: string = choixStations[0]): Chart {
  const visibles = STATIONS.filter((s) => choix === choixStations[0] || s === choix);
  const data = txAnnuelles.filter((d) => visibles.includes(d.station as Station));
  const memeSigne = annees.filter((a) => {
    const [m, c] = STATIONS.map((s) => txAnnuelles.find((d) => d.annee === a && d.station === s)!.anomalie);
    return Math.sign(m) === Math.sign(c);
  }).length;
  return {
    titre: "Évolution des anomalies annuelles de TX, 2003–2022",
    sousTitre: `Une fois le niveau de chaque station retiré, les deux courbes se superposent : ${memeSigne} années sur ${annees.length}, elles sont du même côté de la référence`,
    label: `Évolution des anomalies annuelles de TX à ${visibles.join(" et ")} entre 2003 et 2022, par rapport à la moyenne 2003–2022 propre à chaque station. Creux en 2010, pic en 2022 ; les années récentes sont surtout au-dessus de zéro.`,
    legende:
      "Anomalie = valeur de l'année − référence de la station (moyenne de ses vingt TX annuelles). Une anomalie positive ne signifie pas que la station est plus chaude que l'autre ; ces anomalies ne mesurent pas le réchauffement depuis l'ère préindustrielle.",
    source: `${SOURCE_SH} — anomalies calculées à partir des moyennes annuelles des TX, avec une référence propre à chaque station`,
    route: "B",
    largeurMin: 560,
    options: {
      width: 900,
      height: 420,
      marginLeft: 70,
      marginBottom: 50,
      x: { label: "Année", ticks: 10, tickFormat: (a: number) => String(a) },
      // Axe vertical fixe : changer de station ne déplace pas la référence zéro
      y: { label: "Écart à la référence 2003–2022 (°C)", grid: true, domain: [-2.2, 2.2] },
      color: { domain: [...STATIONS], range: STATIONS.map((s) => couleurStation[s]), legend: true, label: "Station" },
      marks: [
        Plot.ruleY([0], { stroke: "#444", strokeDasharray: "4,4" }),
        Plot.lineY(data, { x: "annee", y: "anomalie", stroke: "station", strokeWidth: 2 }),
        Plot.dot(data, {
          x: "annee",
          y: "anomalie",
          fill: "station",
          r: 4,
          tip: true,
          title: (l: Annuelle) => `${l.station} — ${l.annee}\nÉcart à sa référence : ${l.anomalie.toFixed(2)} °C`,
        }),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Notebook § 4.4 — dessinerCarteAnomalies (filtre : l'année, Inputs.select du notebook)
// ---------------------------------------------------------------------------
export function pointsAnnee(annee: number) {
  return stations.map((s) => ({ ...s, ...txAnnuelles.find((d) => d.station === s.station && d.annee === annee)! }));
}

export function carteAnomalies(annee: number): Chart {
  const points = pointsAnnee(annee);
  return {
    titre: `Anomalies annuelles des TX aux deux stations en ${annee}`,
    sousTitre:
      points.map((p) => `${p.station} ${degSigne(p.anomalie)}`).join(" · ") + " par rapport à leur moyenne 2003–2022",
    label: `Carte du Haut-Rhin : stations Mulhouse et Colmar-Meyenheim colorées selon leur anomalie annuelle de TX en ${annee} par rapport à leur référence 2003–2022. ${points
      .map((p) => `${p.station} : ${degSigne(p.anomalie)} (TX moyenne ${deg(p.txMoyenne, 2)})`)
      .join(" ; ")}. Valeurs exactes dans le tableau.`,
    legende:
      "Bleu : en dessous de la référence ; rouge : au-dessus. L'échelle de couleur reste la même pour toutes les années. Les points ne montrent pas les déplacements des stations et rien n'est extrapolé entre elles.",
    source:
      "Météo-France (SH_TX, 2003–2022), dernières positions connues des stations ; contour du Haut-Rhin : france-geojson (Grégoire David)",
    route: "B",
    options: {
      width: 700,
      height: 500,
      projection: { type: "mercator", domain: hautRhin as any },
      color: {
        type: "diverging",
        domain: [-amplitudeAnomalies, amplitudeAnomalies],
        pivot: 0,
        range: ["#2166AC", "#F7F7F7", "#B2182B"],
        legend: true,
        label: "Écart à la référence de la station (°C)",
      },
      marks: [
        Plot.geo(hautRhin as any, { fill: "#F0F0F0", stroke: "#777", strokeWidth: 1 }),
        Plot.dot(points, {
          x: "longitude",
          y: "latitude",
          fill: "anomalie",
          stroke: "#222",
          r: 9,
          tip: true,
          title: (l: Annuelle) =>
            `${l.station} — ${l.annee}\nMoyenne annuelle des TX : ${l.txMoyenne.toFixed(2)} °C\nAnomalie : ${l.anomalie.toFixed(2)} °C`,
        }),
        Plot.text(points, { x: "longitude", y: "latitude", text: "station", dy: -18, fontSize: 12, fill: "#222" }),
      ],
    } as Plot.PlotOptions,
  };
}
