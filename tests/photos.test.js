import { describe, it, expect, beforeEach } from 'vitest';
import { compressDataUrl, initPhotoSlots } from '../js/photos.js';
import { createState } from '../js/state.js';

describe('compressDataUrl', () => {
  it('returns string starting with data:image', async () => {
    // 100x100 rood JPEG als test-input
    const input = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const out = await compressDataUrl(input, 1600, 0.85);
    expect(typeof out).toBe('string');
    expect(out).toMatch(/^data:image\//);
  });
});

describe('initPhotoSlots — twee aparte foto-knoppen (camera + upload)', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
    container.innerHTML = `
      <div class="photo-slot" data-photo-key="overzicht" data-max="2" data-label="Overzichtsfoto's"></div>
    `;
  });

  it('rendert een camera-knop met capture="environment"', () => {
    initPhotoSlots(container, state);
    const camera = container.querySelector('.photo-add-camera input[type="file"]');
    expect(camera).toBeTruthy();
    expect(camera.getAttribute('capture')).toBe('environment');
  });

  it('camera-knop heeft GEEN multiple attribuut (anders negeert iOS de capture)', () => {
    initPhotoSlots(container, state);
    const camera = container.querySelector('.photo-add-camera input[type="file"]');
    expect(camera.hasAttribute('multiple')).toBe(false);
  });

  it('rendert een upload-knop met multiple maar zonder capture', () => {
    initPhotoSlots(container, state);
    const upload = container.querySelector('.photo-add-upload input[type="file"]');
    expect(upload).toBeTruthy();
    expect(upload.hasAttribute('multiple')).toBe(true);
    expect(upload.hasAttribute('capture')).toBe(false);
  });

  it('beide knoppen hebben accept="image/*"', () => {
    initPhotoSlots(container, state);
    const camera = container.querySelector('.photo-add-camera input[type="file"]');
    const upload = container.querySelector('.photo-add-upload input[type="file"]');
    expect(camera.getAttribute('accept')).toBe('image/*');
    expect(upload.getAttribute('accept')).toBe('image/*');
  });

  it('toont GEEN add-knoppen wanneer max bereikt is', () => {
    state.fotos.overzicht = [
      { dataurl: 'data:image/jpeg;base64,a', bijschrift: '' },
      { dataurl: 'data:image/jpeg;base64,b', bijschrift: '' }
    ];
    initPhotoSlots(container, state);
    expect(container.querySelector('.photo-add-camera')).toBeFalsy();
    expect(container.querySelector('.photo-add-upload')).toBeFalsy();
  });
});
