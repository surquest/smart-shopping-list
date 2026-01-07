import { MetadataRoute } from 'next'

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NODE_ENV === 'production' ? '/smart-shopping-list' : '';
  
  return {
    name: 'Smart Shopping List',
    short_name: 'Shopping List',
    description: 'Progressive web app for managing your shopping list',
    start_url: `${basePath}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1976d2',
    orientation: 'portrait',
    icons: [
      {
        src: `${basePath}/icon-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${basePath}/icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
