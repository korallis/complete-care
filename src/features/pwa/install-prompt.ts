/**
 * PWA Install Prompt utilities.
 *
 * Captures the `beforeinstallprompt` event and provides helpers
 * for showing a custom "Add to Home Screen" banner.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;

/**
 * Initialise the install prompt listener.
 * Call this once on app mount (client-side only).
 */
export function initInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    // Notify the app that install is available
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

/**
 * Check if the PWA install prompt is available.
 */
export function canInstall(): boolean {
  return deferredPrompt !== null && !isInstalled;
}

/**
 * Check if the app is already installed (running in standalone mode).
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    isInstalled ||
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone: boolean }).standalone === true)
  );
}

/**
 * Show the install prompt and return the user's choice.
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome;
  } catch {
    return 'unavailable';
  }
}
