import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getCurrentSession } from '../src/server/helpers/auth';
import { logoutAction } from './actions/auth.actions';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'WAVON Athlete Attendance — ระบบเช็คชื่อและสถิตินักกีฬา',
  description: 'ระบบติดตามสถิติการฝึกซ้อมและเช็คชื่อนักกีฬารายสโมสร (Sleek UI)',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WAVON Attendance',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1115',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  return (
    <html lang="th" className="h-full bg-[#F8FAFC]">
      <body className="min-h-full bg-[#F8FAFC] text-zinc-900 antialiased font-sans">
        <AppShell session={session} logoutAction={logoutAction}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
