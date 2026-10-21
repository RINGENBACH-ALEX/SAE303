// Résultats validés du notebook, sans réestimer les moyennes depuis des arrondis.
import moisChauds from '../data/mois-chauds.json';
import decennies from '../data/decennies.json';
import records from '../data/records.json';
import anomalies from '../data/tx-annuelles.json';
import communes from '../data/communes-haut-rhin.json';

export { moisChauds, decennies, anomalies, communes, records };
export const nomsMois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
export const annees = Array.from({ length: 20 }, (_, i) => 2003 + i);
export function frequencesMois(donnees) {
  return [6, 7, 8].map(mois => ({ mois, nombre: donnees.filter(d => d.mois === mois).length }));
}

export const amplitudeRecords = Math.max(0.5, Math.ceil(Math.max(...records.map(d => Math.abs(d.ecart))) * 2) / 2);
export const amplitudeCarte = Math.max(0.5, Math.ceil(Math.max(...anomalies.map(d => Math.abs(d.anomalie))) * 2) / 2);

export function preparerCommunesCarte(fond, donnees, annee) {
  const codes = { Mulhouse: '68224', 'Colmar-Meyenheim': '68241' };
  return donnees.filter(d => d.annee === Number(annee)).map(d => {
    const commune = fond.features.find(f => f.properties.code === codes[d.station]);
    if (!commune) throw new Error(`Commune introuvable : ${d.station}`);
    return { ...commune, properties: { ...commune.properties, ...d } };
  });
}
