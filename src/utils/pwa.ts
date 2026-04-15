/**
 * PWA helpers — service worker registration, install prompt capture,
 * standalone-launch detection.
 */

import { trackPwaInstall, trackPwaLaunch } from './analytics';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS
  if ((window.navigator as unknown as { standalone?: boolean }).standalone) return true;
  // Other platforms
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}

export async function promptInstall(source: 'banner' | 'footer'): Promise<boolean> {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  deferredPrompt = null;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    const accepted = choice.outcome === 'accepted';
    if (accepted) trackPwaInstall({ source });
    window.dispatchEvent(new CustomEvent('imgpress:pwa-installable', { detail: { canInstall: false } }));
    return accepted;
  } catch {
    return false;
  }
}

export function initPwa(): void {
  if (typeof window === 'undefined') return;

  // Standalone launch tracking — fire once per session.
  if (isStandalone()) {
    trackPwaLaunch({ source: 'standalone' });
  } else {
    trackPwaLaunch({ source: 'browser' });
  }

  // Capture the install prompt so we can fire it from our own UI.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('imgpress:pwa-installable', { detail: { canInstall: true } }));
  });

  // The browser's own install action also fires an event we should track.
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    trackPwaInstall({ source: 'browser' });
    window.dispatchEvent(new CustomEvent('imgpress:pwa-installable', { detail: { canInstall: false } }));
  });

  // Register the service worker after page load to avoid blocking critical
  // path. Production-only; dev server has its own caching strategy.
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail — SW is a progressive enhancement.
      });
    });
  }
}
