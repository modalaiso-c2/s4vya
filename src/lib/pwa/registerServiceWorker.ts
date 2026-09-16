// Registers the service worker only in the real (published) app.
// Preview / dev contexts must never hold a service worker.

const isPreviewHost = () => {
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('id-preview--') ||
    host.endsWith('.lovableproject.com') ||
    host.includes('sandbox')
  );
};

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV || isPreviewHost()) {
    // Clean up any worker/caches left over from a previous visit
    navigator.serviceWorker.getRegistrations?.().then((regs) => regs.forEach((r) => r.unregister()));
    if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
};
