import type { MetadataRoute } from 'next';

/**
 * Next.js metadata-based manifest generation.
 * Supplements the static /public/manifest.json for dynamic values.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Complete Care',
    short_name: 'CompleteCare',
    description:
      "UK care management platform for domiciliary care, supported living, and children's residential homes.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'any',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
