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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalElement.classList.contains('modal-open')) {
      closeModal(modalElement);
    }
  });
}
