// Données préfiltrées (produites par scripts/preparer-donnees.mjs) et chiffres
// calculés pour le récit : les textes du site citent ces valeurs, jamais des
// nombres recopiés à la main.
import stations from "../data/stations.json";
import txAnnuellesBrutes from "../data/tx-annuelles.json";
import txQuotidiennes from "../data/tx-quotidiennes.json";
import controle from "../data/controle.json";
import hautRhin from "../data/haut-rhin.json";
import type { Station } from "./palette";

export { stations, txQuotidiennes, controle, hautRhin };

export type Annuelle = {
  station: Station;
  annee: number;
  moisDisponibles: number;
  joursUtilises: number;
  txMoyenne: number;
  reference: number;
  anomalie: number;
};
export type Quotidienne = { date: string; mulhouse: number | null; colmar: number | null };

export const txAnnuelles = txAnnuellesBrutes as Annuelle[];
export const quotidiennes = txQuotidiennes as Quotidienne[];

export const DEBUT = 2003;
export const FIN = 2022;
export const annees = Array.from({ length: FIN - DEBUT + 1 }, (_, i) => DEBUT + i);

export * from "./format";

// ---------------------------------------------------------------------------
// Accès
// ---------------------------------------------------------------------------
export const serieDe = (station: Station) => txAnnuelles.filter((d) => d.station === station);
export const stationParSlug = (slug: string) => stations.find((s) => s.slug === slug);
export const cleQuotidienne = (station: Station) => (station === "Mulhouse" ? "mulhouse" : "colmar");

const moyenne = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const arrondi = (x: number) => Math.round(x * 100) / 100;

// Années la plus fraîche et la plus chaude d'une station
export function reperes(station: Station) {
  const serie = serieDe(station);
  const min = serie.reduce((a, b) => (b.txMoyenne < a.txMoyenne ? b : a));
  const max = serie.reduce((a, b) => (b.txMoyenne > a.txMoyenne ? b : a));
  return { min, max, amplitude: arrondi(max.txMoyenne - min.txMoyenne), reference: serie[0].reference };
}

// Écart annuel Mulhouse − Colmar-Meyenheim (jointure sur l'année)
export const ecarts = annees.map((annee) => {
  const m = txAnnuelles.find((d) => d.annee === annee && d.station === "Mulhouse")!;
  const c = txAnnuelles.find((d) => d.annee === annee && d.station === "Colmar-Meyenheim")!;
  return { annee, mulhouse: m.txMoyenne, colmar: c.txMoyenne, ecart: arrondi(m.txMoyenne - c.txMoyenne) };
});
export const ecartsResume = {
  anneesMulhouseFraiche: ecarts.filter((d) => d.ecart < 0).length,
  min: ecarts.reduce((a, b) => (Math.abs(b.ecart) < Math.abs(a.ecart) ? b : a)),
  max: ecarts.reduce((a, b) => (Math.abs(b.ecart) > Math.abs(a.ecart) ? b : a)),
  moyen: arrondi(moyenne(ecarts.map((d) => d.ecart))),
};

// Corrélation des anomalies des deux stations (les courbes bougent-elles ensemble ?)
function correlation(a: number[], b: number[]) {
  const ma = moyenne(a);
  const mb = moyenne(b);
  const cov = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0);
  const va = a.reduce((s, x) => s + (x - ma) ** 2, 0);
  const vb = b.reduce((s, x) => s + (x - mb) ** 2, 0);
  return cov / Math.sqrt(va * vb);
}
export const correlationAnomalies = arrondi(
  correlation(
    serieDe("Mulhouse").map((d) => d.anomalie),
    serieDe("Colmar-Meyenheim").map((d) => d.anomalie),
  ),
);
export const anneesMemeSigne = annees.filter((annee) => {
  const [m, c] = (["Mulhouse", "Colmar-Meyenheim"] as const).map(
    (s) => txAnnuelles.find((d) => d.annee === annee && d.station === s)!.anomalie,
  );
  return Math.sign(m) === Math.sign(c);
}).length;

// Deux décennies comparées : moyenne des TX annuelles et journées à 30 °C ou plus
// (sur les jours renseignés aux deux stations, le dénominateur est conservé)
export const decennies = [
  { libelle: "2003–2012", debut: 2003, fin: 2012 },
  { libelle: "2013–2022", debut: 2013, fin: 2022 },
].map((p) => {
  const jours = quotidiennes.filter((d) => {
    const a = Number(d.date.slice(0, 4));
    return a >= p.debut && a <= p.fin && d.mulhouse !== null && d.colmar !== null;
  });
  const parStation = (station: Station) => {
    const cle = cleQuotidienne(station);
    return {
      station,
      txMoyenne: arrondi(
        moyenne(serieDe(station).filter((d) => d.annee >= p.debut && d.annee <= p.fin).map((d) => d.txMoyenne)),
      ),
      jours30: jours.filter((d) => (d[cle] as number) >= 30).length,
      joursTotal: jours.length,
    };
  };
  return { ...p, mulhouse: parStation("Mulhouse"), colmar: parStation("Colmar-Meyenheim") };
});
export const hausseDecennie = (station: Station) => {
  const k = station === "Mulhouse" ? "mulhouse" : "colmar";
  return arrondi(decennies[1][k].txMoyenne - decennies[0][k].txMoyenne);
};

// Journées d'une année (pour la route B et son rendu de repli au build)
export const joursDe = (annee: number) => quotidiennes.filter((d) => d.date.startsWith(String(annee)));

// Journées renseignées aux deux stations (dénominateur des comparaisons quotidiennes)
export const joursCommuns = quotidiennes.filter((d) => d.mulhouse !== null && d.colmar !== null).length;

// Jour le plus chaud de la période sur les jours communs
export const jourRecord = quotidiennes
  .filter((d) => d.mulhouse !== null && d.colmar !== null)
  .reduce((a, b) => (Math.max(b.mulhouse!, b.colmar!) > Math.max(a.mulhouse!, a.colmar!) ? b : a));
