// Découpage typographique uniquement : les mots et les phrases sont conservés.
export function aererTexte(texte) {
  if (texte.trim().split(/\s+/).length < 52) return [texte];
  const phrases = texte.split(/(?<=[.!?])\s+(?=[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ])/u);
  const paragraphes = [];
  let courant = '';
  for (let i = 0; i < phrases.length; i++) {
    courant += (courant ? ' ' : '') + phrases[i];
    const reste = phrases.slice(i + 1).join(' ').trim().split(/\s+/).length;
    if (courant.trim().split(/\s+/).length >= 27 && reste >= 16) {
      paragraphes.push(courant);
      courant = '';
    }
  }
  if (courant) paragraphes.push(courant);
  return paragraphes;
}
