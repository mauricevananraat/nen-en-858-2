import { describe, it, expect, beforeEach } from 'vitest';
import { openModal, closeModal, bindModalClose } from '../js/modal.js';

function makeModal() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="modal" aria-hidden="true">
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <button type="button" data-modal-close>×</button>
        <input type="text" id="first-field">
      </div>
    </div>
  `;
  return div.firstElementChild;
}

describe('openModal / closeModal', () => {
  let modal;
  beforeEach(() => {
    modal = makeModal();
    document.body.appendChild(modal);
  });

  it('openModal voegt modal-open class toe en zet aria-hidden=false', () => {
    openModal(modal);
    expect(modal.classList.contains('modal-open')).toBe(true);
    expect(modal.getAttribute('aria-hidden')).toBe('false');
  });

  it('closeModal verwijdert modal-open en zet aria-hidden=true', () => {
    openModal(modal);
    closeModal(modal);
    expect(modal.classList.contains('modal-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
  });

  it('openModal voegt no-scroll toe aan body', () => {
    openModal(modal);
    expect(document.body.classList.contains('no-scroll')).toBe(true);
    closeModal(modal);
    expect(document.body.classList.contains('no-scroll')).toBe(false);
  });
});

describe('bindModalClose', () => {
  let modal;
  beforeEach(() => {
    modal = makeModal();
    document.body.appendChild(modal);
    bindModalClose(modal);
  });

  it('sluit modal bij click op backdrop', () => {
    openModal(modal);
    modal.querySelector('.modal-backdrop').click();
    expect(modal.classList.contains('modal-open')).toBe(false);
  });

  it('sluit modal bij click op [data-modal-close] knop', () => {
    openModal(modal);
    modal.querySelector('[data-modal-close]').click();
    expect(modal.classList.contains('modal-open')).toBe(false);
  });

  it('sluit modal bij Escape-toets', () => {
    openModal(modal);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.classList.contains('modal-open')).toBe(false);
  });
});
