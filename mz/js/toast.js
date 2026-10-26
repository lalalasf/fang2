(function (global) {
  const TOAST_CONTAINER_ID = 'globalToastContainer';
  const TOAST_STYLE_ID = 'globalToastStyle';

  function ensureStyles() {
    if (document.getElementById(TOAST_STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = TOAST_STYLE_ID;
    style.textContent = `
      #${TOAST_CONTAINER_ID} {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        pointer-events: none;
      }

      #${TOAST_CONTAINER_ID} .toast {
        position: relative;
        overflow: hidden;
        padding: 12px 20px;
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 320px;
        word-break: break-word;
        opacity: 0;
        transform: translateY(-12px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: auto;
      }

      #${TOAST_CONTAINER_ID} .toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      #${TOAST_CONTAINER_ID} .toast.success {
        background-color: #28a745;
      }

      #${TOAST_CONTAINER_ID} .toast.error {
        background-color: #dc3545;
      }

      #${TOAST_CONTAINER_ID} .toast.info {
        background-color: #17a2b8;
      }

      #${TOAST_CONTAINER_ID} .toast.warning {
        background-color: #f59e0b;
      }

      #${TOAST_CONTAINER_ID} .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        border-radius: 0 0 8px 8px;
        background-color: rgba(255, 255, 255, 0.5);
      }
    `;

    document.head.appendChild(style);
  }

  function ensureContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
    return container;
  }

  function removeToast(toastElement) {
    if (!toastElement) {
      return;
    }

    toastElement.classList.remove('show');

    let removed = false;
    const cleanup = () => {
      if (removed) {
        return;
      }
      removed = true;
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    };

    toastElement.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 350);
  }

  function showToast(message, type = 'info', duration = 3000) {
    ensureStyles();
    const container = ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;
    toast.textContent = String(message ?? '');

    const progressDiv = document.createElement('div');
    progressDiv.className = 'toast-progress';
    toast.appendChild(progressDiv);

    container.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add('show');

    const timer = setTimeout(() => {
      removeToast(toast);
    }, duration);

    const startTime = Date.now();
    const updateProgress = () => {
      if (!toast.isConnected) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      progressDiv.style.width = `${100 - progress}%`;

      if (progress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();

    toast.addEventListener('click', function () {
      clearTimeout(timer);
      removeToast(toast);
    });

    return timer;
  }

  global.showToast = showToast;
  global.removeToast = removeToast;
})(window);
