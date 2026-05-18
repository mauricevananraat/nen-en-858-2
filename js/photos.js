import { setField, getField } from './state.js';

// Crop foto's naar 1:1 (vierkant) via center-crop.
// Reden: rapport-foto's moeten uniform zijn voor nette weergave naast elkaar.
export function compressDataUrl(dataUrl, maxSize = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    let settled = false;
    const fallback = () => { if (!settled) { settled = true; resolve(dataUrl); } };

    img.onload = () => {
      settled = true;
      if (!img.width || !img.height) {
        resolve(dataUrl);
        return;
      }
      // Center-crop naar vierkant: kleinste dimensie als zijde
      const cropSize = Math.min(img.width, img.height);
      const sx = (img.width - cropSize) / 2;
      const sy = (img.height - cropSize) / 2;
      const targetSize = Math.min(cropSize, maxSize);

      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = fallback;
    setTimeout(fallback, 5000);
    img.src = dataUrl;
  });
}

export function initPhotoSlots(container, state) {
  container.querySelectorAll('.photo-slot').forEach(slot => {
    const key = slot.dataset.photoKey;
    const max = parseInt(slot.dataset.max, 10);
    const label = slot.dataset.label;
    renderSlot(slot, state, key, max, label);
  });
}

function renderSlot(slot, state, key, max, label) {
  const photos = state.fotos[key] || [];
  slot.innerHTML = `
    <div class="photo-label">📷 ${label} <span class="photo-count">(${photos.length}/${max})</span></div>
    <div class="photo-bar">
      ${photos.map((p, i) => `
        <div class="photo-thumb" data-idx="${i}">
          <img src="${p.dataurl}" alt="">
          <button type="button" class="photo-remove" data-idx="${i}">×</button>
        </div>
      `).join('')}
      ${photos.length < max ? `
        <label class="photo-add photo-add-camera" title="Foto maken met camera">
          📷
          <input type="file" accept="image/*" capture="environment" style="display:none">
        </label>
        <label class="photo-add photo-add-upload" title="Foto's uploaden uit galerij/bestanden">
          🖼️
          <input type="file" accept="image/*" multiple style="display:none">
        </label>
      ` : ''}
    </div>
  `;

  // capture-attribuut + multiple samen werken niet op iOS Safari (file-picker negeert capture).
  // Daarom twee aparte inputs: camera (capture, geen multiple) + upload (multiple, geen capture).
  // Beide gebruiken dezelfde verwerking via handleFiles.
  const handleFiles = async (files) => {
    const remaining = max - photos.length;
    for (const file of files.slice(0, remaining)) {
      const reader = new FileReader();
      const dataUrl = await new Promise(res => {
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
      });
      const compressed = await compressDataUrl(dataUrl);
      photos.push({ dataurl: compressed, bijschrift: '' });
    }
    setField(state, `fotos.${key}`, photos);
    renderSlot(slot, state, key, max, label);
  };

  slot.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => handleFiles(Array.from(e.target.files)));
  });

  slot.querySelectorAll('.photo-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      photos.splice(idx, 1);
      setField(state, `fotos.${key}`, photos);
      renderSlot(slot, state, key, max, label);
    });
  });
}
