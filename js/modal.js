// Singleton Esc-listener: één document-keydown handler die ALLE geregistreerde
// modals afhandelt. Voorkomt listener-leak bij meerdere bindModalClose-calls
// (bv. fase 3 klant-modal + fase 4 voorzieningen-modal).
const registeredModals = new Set();
let globalEscHandler = null;

function ensureGlobalEscHandler() {
  if (globalEscHandler) return;
  globalEscHandler = (e) => {
    if (e.key !== 'Escape') return;
    registeredModals.forEach(modal => {
      if (modal.classList.contains('modal-open')) {
        closeModal(modal);
      }
    });
  };
  document.addEventListener('keydown', globalEscHandler);
}

export function openModal(modalElement) {
  modalElement.classList.add('modal-open');
  modalElement.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  const firstInput = modalElement.querySelector('input, select, textarea');
  if (firstInput && firstInput.focus) firstInput.focus();
}

export function closeModal(modalElement) {
  modalElement.classList.remove('modal-open');
  modalElement.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

export function bindModalClose(modalElement) {
  const backdrop = modalElement.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => closeModal(modalElement));
  }
  modalElement.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(modalElement));
  });
  registeredModals.add(modalElement);
  ensureGlobalEscHandler();
}

// Test helper — verwijdert globale listener en cleared de modal-set zodat
// tests met meerdere bindModalClose-calls niet ophopen.
export function _resetForTests() {
  if (globalEscHandler) {
    document.removeEventListener('keydown', globalEscHandler);
    globalEscHandler = null;
  }
  registeredModals.clear();
}
