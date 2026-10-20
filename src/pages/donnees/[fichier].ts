// Fichiers de données téléchargeables, générés au build : /donnees/tx-annuelles.csv, .json…
import type { APIRoute, GetStaticPaths } from "astro";
import { fichiers, geojson, versCSV } from "../../lib/fichiers";

export const getStaticPaths = (() => [
  ...fichiers.flatMap((f) => [
    { params: { fichier: `${f.nom}.csv` }, props: { corps: versCSV(f.lignes), type: "text/csv; charset=utf-8" } },
    { params: { fichier: `${f.nom}.json` }, props: { corps: JSON.stringify(f.lignes), type: "application/json" } },
  ]),
  {
    params: { fichier: `${geojson.nom}.geojson` },
    props: { corps: JSON.stringify(geojson.donnees), type: "application/geo+json" },
  },
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.corps, { headers: { "Content-Type": props.type } });
