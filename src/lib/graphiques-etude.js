import * as Plot from '@observablehq/plot';
import { preparerCommunesCarte, nomsMois } from './etude.js';

const sourceSH = 'Météo-France, SH_TX, 2003–2022';
const nombre = v => v.toFixed(2).replace('.', ',');
const signe = v => `${v > 0 ? '+' : ''}${nombre(v)}`;

// Même contrat que les fabriques Plot du projet : titres dans ChartCard,
// options partagées par le rendu SVG au build et les interactions du navigateur.
/** @returns {import('./commun').Chart} */
export function graphiqueMois(donnees, { station, width = 650, maximum = 10 } = {}) {
  return {
    titre: `${station} : les mois les plus souvent chauds`,
    sousTitre: 'Nombre d’années où le mois arrive en tête · 2003–2022',
    label: `${station} : ${donnees.map(d => `${nomsMois[d.mois - 1]} ${d.nombre} années`).join(', ')}. Deux mois peuvent arriver en tête la même année : 21 mois sont donc comptés pour 20 années.`,
    legende: `Si deux mois sont à égalité, les deux sont comptés : cela donne 21 mois pour 20 années. ${station === 'Mulhouse' ? 'Juillet et août sont à égalité en 2004.' : 'Juin et août sont à égalité en 2017.'} Les deux graphiques utilisent la même échelle pour comparer les nombres d’années.`,
    source: sourceSH, route: 'A',
    options: {
      width, height: 340, marginLeft: 60, marginTop: 25,
      x: { type: 'band', domain: [6, 7, 8], label: null, tickFormat: m => nomsMois[m - 1], tickSize: 0, tickPadding: 6 },
      y: { label: 'Nombre d’années', domain: [0, maximum], grid: true, zero: true, ticks: 5 },
      marks: [Plot.ruleY([0]), Plot.ruleX(donnees, { x: 'mois', y: 'nombre', strokeWidth: 2 }),
        Plot.dot(donnees, { x: 'mois', y: 'nombre', r: 6, title: d => `${nomsMois[d.mois - 1]} : ${d.nombre} années` }),
        Plot.text(donnees, { x: 'mois', y: 'nombre', text: d => String(d.nombre), dy: -15, fontWeight: 'bold' })]
    }
  };
}

/** @returns {import('./commun').Chart} */
export function graphiqueDecennies(donnees, { width = 800 } = {}) {
  const mobile = width < 540;
  // Sur un écran étroit, waffleY étire ses cellules. Les dix points conservent
  // les mêmes groupes et couleurs avec un rayon fixe, donc de vrais cercles.
  const ronds = donnees.flatMap(d => Array.from({ length: d.total }, (_, i) => ({
    ...d, colonne: i % 5, ligne: Math.floor(i / 5), couleur: i < d.chaudes ? '#ea580c' : '#e2e8f0'
  })));
  return {
    titre: 'Les années plus chaudes sont-elles plus nombreuses après 2012 ?',
    sousTitre: 'Un rond = une année · Orange : plus chaude que la moyenne 2003–2022 de sa station',
    label: `Dans chaque station, les années au-dessus de la référence passent de 2 sur 10 à 7 sur 10. ${donnees.map(d => `${d.station}, ${d.periode} : ${nombre(d.moyenne)} °C`).join(' ; ')}. Les ronds ne sont pas chronologiques.`,
    legende: 'Chaque année est comparée à la moyenne 2003–2022 de sa station, appelée référence. Cette moyenne reste la même pour les deux périodes de dix ans. Orange : au-dessus ; gris : égale ou en dessous. Les ronds ne sont pas rangés par date. La différence d’environ 0,98 °C concerne les moyennes des deux périodes, pas une hausse annuelle ni une prévision.',
    source: sourceSH, route: 'A',
    options: {
      width, height: mobile ? 360 : 480, marginLeft: mobile ? 68 : 110, marginRight: 15, marginTop: 40, marginBottom: 85, axis: null,
      ...(mobile ? { x: { domain: [-0.5, 4.5] }, y: { domain: [-1.5, 2.5] } } : {}),
      fx: { domain: ['Mulhouse', 'Colmar-Meyenheim'], padding: 0.15 },
      fy: { domain: ['2003–2012', '2013–2022'], padding: 0.45 },
      marks: [
        Plot.axisFx({ anchor: 'top', label: null, tickSize: 0, fontSize: mobile ? 10 : 14, fontWeight: 'bold' }),
        Plot.axisFy({ anchor: 'left', label: null, tickSize: 0, fontSize: mobile ? 10 : 13, fontWeight: 'bold' }),
        ...(mobile ? [Plot.dot(ronds, { fx: 'station', fy: 'periode', x: 'colonne', y: 'ligne', fill: 'couleur', r: 8 })] : [
          Plot.waffleY(donnees, { fx: 'station', fy: 'periode', y: 'total', unit: 1, multiple: 5, gap: 5, rx: '100%', fill: '#e2e8f0' }),
          Plot.waffleY(donnees, { fx: 'station', fy: 'periode', y: 'chaudes', unit: 1, multiple: 5, gap: 5, rx: '100%', fill: '#ea580c' })
        ]),
        Plot.text(donnees, { fx: 'station', fy: 'periode', text: d => `${d.chaudes} années sur ${d.total}`, frameAnchor: 'bottom', lineAnchor: 'top', dy: 10, fill: '#9a3412', fontSize: mobile ? 13 : 22, fontWeight: 'bold' }),
        Plot.text(donnees, { fx: 'station', fy: 'periode', text: d => mobile ? `${nombre(d.moyenne)} °C` : `Moyenne des TX : ${nombre(d.moyenne)} °C`, frameAnchor: 'bottom', lineAnchor: 'top', dy: 39, fontSize: mobile ? 11 : 12 })
      ]
    }
  };
}

/** @returns {import('./commun').Chart} */
export function graphiqueRecords(donnees, { debut, fin, amplitude, width = 900 } = {}) {
  const mobile = width < 540;
  return {
    titre: `Comparaison des records annuels · ${debut}–${fin}`,
    sousTitre: 'À gauche, le record est plus élevé à Colmar-Meyenheim ; à droite, à Mulhouse',
    label: `Écarts de records de ${debut} à ${fin}, Mulhouse moins Colmar-Meyenheim. ${donnees.map(d => `${d.annee} : ${signe(d.ecart)} °C`).join(' ; ')}. Valeurs et dates accessibles dans le tableau.`,
    legende: 'Une barre représente une année. Plus elle est longue, plus les deux records sont éloignés : rouge à droite si celui de Mulhouse est plus élevé, bleu à gauche si celui de Colmar-Meyenheim est plus élevé. Seuls les jours utilisables dans les deux stations sont pris en compte ; février 2015 est écarté des deux côtés. Les records peuvent dater de jours différents. Les deux graphiques gardent la même échelle.',
    source: 'Météo-France, SQR_TX, 2003–2022 ; dates communes valides', route: 'B',
    options: {
      width, height: 380, marginLeft: mobile ? 44 : 65, marginBottom: 55,
      x: { label: 'Écart Mulhouse − Colmar-Meyenheim (°C)', domain: [-amplitude, amplitude], ticks: mobile ? 5 : 10, tickFormat: d => d === 0 ? '0' : `${d > 0 ? '+' : ''}${d.toFixed(1).replace('.', ',')}`, grid: true },
      y: { label: 'Année', domain: Array.from({ length: fin - debut + 1 }, (_, i) => debut + i), tickFormat: String, tickSize: 0 },
      color: { domain: ['Record supérieur à Mulhouse', 'Record supérieur à Colmar-Meyenheim'], range: ['#dc4c46', '#2878b5'], legend: true, label: null },
      marks: [Plot.barX(donnees, { x: 'ecart', y: 'annee', fill: d => d.ecart >= 0 ? 'Record supérieur à Mulhouse' : 'Record supérieur à Colmar-Meyenheim', insetTop: 3, insetBottom: 3, tip: true,
        title: d => `${d.annee}\nMulhouse : ${nombre(d.mulhouse)} °C (${d.datesMulhouse})\nColmar-Meyenheim : ${nombre(d.meyenheim)} °C (${d.datesMeyenheim})\nÉcart : ${signe(d.ecart)} °C` }),
        Plot.ruleX([0], { stroke: '#334155', strokeWidth: 2 })]
    }
  };
}

/** @returns {import('./commun').Chart} */
export function graphiqueCarte(fond, anomalies, { annee = 2022, amplitude, palette = 'RdBu', width = 600 } = {}) {
  const valeurs = anomalies.filter(d => d.annee === Number(annee));
  const colorees = preparerCommunesCarte(fond, anomalies, annee);
  return {
    titre: `Anomalies des TX en ${annee}`,
    sousTitre: valeurs.map(d => `${d.station} : ${signe(d.anomalie)} °C`).join(' · '),
    label: `Carte des communes du Haut-Rhin en ${annee}. ${valeurs.map(d => `${d.station} : moyenne des TX ${nombre(d.txMoyenne)} °C ; anomalie ${signe(d.anomalie)} °C`).join('. ')}. La couleur représente la station, pas une moyenne communale.`,
    legende: 'Bleu : année plus fraîche que la moyenne 2003–2022 de la station ; rouge : plus chaude. Les couleurs gardent le même sens lorsque vous changez l’année. La couleur montre le résultat de la station, pas une moyenne de toute la commune. Gris : communes sans mesures dans cette étude. La station Colmar-Meyenheim se trouve à Oberentzen.',
    source: 'Météo-France, SH_TX ; communes du Haut-Rhin : france-geojson (Grégoire David)', route: 'B',
    options: {
      width, height: 520, projection: { type: 'mercator', domain: fond },
      color: { type: 'quantize', n: 5, scheme: palette, reverse: true, domain: [-amplitude, amplitude], legend: true, label: 'Écart à la moyenne 2003–2022 (°C)' },
      marks: [Plot.geo(fond, { fill: '#e8edf2', stroke: 'white', strokeWidth: 0.4 }),
        Plot.geo(colorees, { fill: d => d.properties.anomalie, stroke: '#334155', strokeWidth: 1, tip: true,
          title: d => { const p = d.properties; return `${p.station} — ${p.annee}\nMoyenne des TX : ${nombre(p.txMoyenne)} °C\nAnomalie : ${signe(p.anomalie)} °C`; } })]
    }
  };
}
