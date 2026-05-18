import { describe, it, expect } from 'vitest';
import { calcPercentage, isLegenVereist, calcLedigingAdvies, pctKleur } from '../js/validation.js';

describe('calcPercentage', () => {
  it('returns 0 when max is 0', () => {
    expect(calcPercentage(50, 0)).toBe(0);
  });
  it('returns rounded percentage', () => {
    expect(calcPercentage(12, 80)).toBe(15);
    expect(calcPercentage(180, 400)).toBe(45);
    expect(calcPercentage(64, 80)).toBe(80);
  });
  it('returns 0 for null/undefined input', () => {
    expect(calcPercentage(null, 80)).toBe(0);
    expect(calcPercentage(undefined, 80)).toBe(0);
  });
});

describe('isLegenVereist', () => {
  it('returns true when olielaag pct >= 80', () => {
    expect(isLegenVereist(80, 'olielaag')).toBe(true);
    expect(isLegenVereist(85, 'olielaag')).toBe(true);
    expect(isLegenVereist(79, 'olielaag')).toBe(false);
  });
  it('returns true when sliblaag pct >= 50', () => {
    expect(isLegenVereist(50, 'sliblaag')).toBe(true);
    expect(isLegenVereist(49, 'sliblaag')).toBe(false);
  });
  it('returns true when slibvolume pct >= 50', () => {
    expect(isLegenVereist(50, 'slibvolume')).toBe(true);
  });
});

describe('calcLedigingAdvies', () => {
  it('returns true if any meting overschrijdt grens', () => {
    expect(calcLedigingAdvies({ olielaag: 80, sliblaag: 0, slibvolume: 0 })).toBe(true);
    expect(calcLedigingAdvies({ olielaag: 0, sliblaag: 50, slibvolume: 0 })).toBe(true);
    expect(calcLedigingAdvies({ olielaag: 0, sliblaag: 0, slibvolume: 50 })).toBe(true);
  });
  it('returns false when all under grens', () => {
    expect(calcLedigingAdvies({ olielaag: 79, sliblaag: 49, slibvolume: 49 })).toBe(false);
  });
});

describe('pctKleur', () => {
  it('returns groen onder grens-10', () => {
    expect(pctKleur(15, 'olielaag')).toBe('groen');
    expect(pctKleur(40, 'sliblaag')).toBe('groen');
  });
  it('returns oranje tussen grens-10 en grens', () => {
    expect(pctKleur(75, 'olielaag')).toBe('oranje');
    expect(pctKleur(45, 'sliblaag')).toBe('oranje');
  });
  it('returns rood op of boven grens', () => {
    expect(pctKleur(80, 'olielaag')).toBe('rood');
    expect(pctKleur(50, 'sliblaag')).toBe('rood');
  });
});

describe('pctKleur edge cases', () => {
  it('returns groen bij onbekend type met warning', () => {
    const orig = console.warn;
    let warned = false;
    console.warn = () => { warned = true; };
    expect(pctKleur(75, 'onbekend')).toBe('groen');
    expect(warned).toBe(true);
    console.warn = orig;
  });
});
