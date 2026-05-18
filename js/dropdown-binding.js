import { setField } from './state.js';

const KLANT_VELDEN = ['bedrijfsnaam', 'adres', 'postcode_plaats', 'contactpersoon'];

export function isLocatieFilled(state) {
  return KLANT_VELDEN.some(f => {
    const v = state.locatie[f];
    return typeof v === 'string' && v.trim() !== '';
  });
}

export function applyKlantToState(klant, state) {
  KLANT_VELDEN.forEach(f => setField(state, `locatie.${f}`, klant[f] || ''));
  setField(state, 'opdrachtgever.telefoon', klant.opdrachtgever_telefoon || '');
  if (klant.opdrachtgever_zelfde_als_locatie) {
    KLANT_VELDEN.forEach(f => setField(state, `opdrachtgever.${f}`, klant[f] || ''));
  } else {
    KLANT_VELDEN.forEach(f => setField(state, `opdrachtgever.${f}`, klant[`opdrachtgever_${f}`] || ''));
  }
}
