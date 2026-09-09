import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WAVON Athlete Attendance',
    short_name: 'WAVON',
    description: 'ระบบติดตามสถิติการฝึกซ้อมและเช็คชื่อนักกีฬารายสโมสร',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F1115',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
