// Formats français (virgule décimale, signe moins typographique).
const nf = (min: number, max = min) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: min, maximumFractionDigits: max });
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const deg = (x: number, d = 1) => `${nf(d).format(x)} °C`;
export const degSigne = (x: number, d = 2) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${nf(d).format(Math.abs(x))} °C`;
export const entier = (x: number) => nf(0).format(x);
export const pct = (x: number, d = 0) => `${nf(d).format(x)} %`;

// Graduations des axes
export const virgule = (d: number) => nf1.format(d);
export const signe = (d: number) => (d > 0 ? `+${virgule(d)}` : d < 0 ? `−${virgule(-d)}` : "0");
export const annee = (d: number) => String(d);
export const moisCourt = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
