import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rat-Ing',
    short_name: 'Rat-Ing',
    description: 'Pagina para guardar y calificar las cosas que vemos y jugamos de gordos',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff6f5',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}