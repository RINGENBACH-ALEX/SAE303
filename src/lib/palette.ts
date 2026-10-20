// Palette de DONNÉES, distincte de la palette de charte (src/styles/global.css).
// Ce sont les couleurs du notebook Observable :
// - stations : Okabe-Ito, vermillon #D55E00 pour Mulhouse, bleu #0072B2 pour Colmar-Meyenheim
//   (lisibles par les daltoniens) ;
// - moyennes annuelles : schéma séquentiel YlOrRd ;
// - anomalies sur la carte : divergente #2166AC → #F7F7F7 → #B2182B, centrée sur 0.

export const STATIONS = ["Mulhouse", "Colmar-Meyenheim"] as const;
export type Station = (typeof STATIONS)[number];

export const couleurStation: Record<Station, string> = {
  Mulhouse: "#D55E00",
  "Colmar-Meyenheim": "#0072B2",
};

// Variantes plus foncées pour le TEXTE (contraste ≥ 4,5:1 sur le fond de page)
export const couleurTexteStation: Record<Station, string> = {
  Mulhouse: "#A84A00",
  "Colmar-Meyenheim": "#00649C",
};

export const divergente = ["#2166AC", "#F7F7F7", "#B2182B"];
