import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from 'react-hot-toast';
import PWAInstall from '@/components/pwa-install';

const playfair = Playfair_Display({ subsets:['latin'], variable:'--font-playfair', display:'swap' });
const dmSans   = DM_Sans({ subsets:['latin'], variable:'--font-dm-sans', display:'swap', axes:['opsz'] });
const mono     = JetBrains_Mono({ subsets:['latin'], variable:'--font-mono', display:'swap' });

export const metadata: Metadata = {
  title: { default:'Scholr — AI Attendance Tracker', template:'%s · Scholr' },
  description: 'Track college attendance with AI-powered timetable parsing. Never fall below 75% again.',
  keywords: ['attendance tracker','college attendance','AI timetable','75% attendance','student app'],
  authors: [{ name:'Scholr' }],
  creator: 'Scholr',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Scholr',
    startupImage: '/splash.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Scholr',
    title: 'Scholr — AI Attendance Tracker for College Students',
    description: 'Upload your timetable photo. AI extracts your schedule. Track attendance, get 75% alerts, add notes.',
    images: [{ url:'/icon-512.png', width:512, height:512, alt:'Scholr' }],
  },
  twitter: {
    card: 'summary',
    title: 'Scholr — Never miss the 75% line',
    description: 'AI-powered attendance tracker for college students.',
    images: ['/icon-512.png'],
  },
  icons: {
    icon: [
      { url:'/favicon.png', sizes:'32x32', type:'image/png' },
      { url:'/icon-192.png', sizes:'192x192', type:'image/png' },
    ],
    apple: [
      { url:'/icon-152.png', sizes:'152x152', type:'image/png' },
      { url:'/icon-192.png', sizes:'192x192', type:'image/png' },
    ],
    shortcut: '/favicon.png',
  },
  robots: { index:true, follow:true },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${mono.variable}`}>
      <head>
        {/* PWA iOS meta tags */}
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Scholr"/>
        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#7c3aed"/>
        <meta name="msapplication-TileImage" content="/icon-144.png"/>
      </head>
      <body className="font-dm antialiased min-h-screen">
        <SessionProvider>
          {children}
          <PWAInstall/>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15,15,30,0.95)',
                color: '#f0f0ff',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                fontFamily: 'DM Sans, sans-serif',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
              success: { iconTheme:{ primary:'#4ade80', secondary:'rgba(15,15,30,0.95)' } },
              error:   { iconTheme:{ primary:'#f87171', secondary:'rgba(15,15,30,0.95)' } },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
