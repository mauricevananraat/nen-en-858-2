export function calcPercentage(value, max) {
  if (!max || value == null) return 0;
  return Math.round((Number(value) / Number(max)) * 100);
}

const GRENZEN = {
  olielaag: 80,
  sliblaag: 50,
  slibvolume: 50
};

export function isLegenVereist(pct, type) {
  const grens = GRENZEN[type];
  if (grens === undefined) return false;
  return pct >= grens;
}

export function calcLedigingAdvies({ olielaag, sliblaag, slibvolume }) {
  return isLegenVereist(olielaag, 'olielaag')
      || isLegenVereist(sliblaag, 'sliblaag')
      || isLegenVereist(slibvolume, 'slibvolume');
}

export function pctKleur(pct, type) {
  const grens = GRENZEN[type];
  if (grens === undefined) {
    console.warn(`pctKleur: onbekend type "${type}"`);
    return 'groen';
  }
  if (pct >= grens) return 'rood';
  if (pct > grens - 10) return 'oranje';
  return 'groen';
}
