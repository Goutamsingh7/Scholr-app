import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from 'react-hot-toast';

const playfair = Playfair_Display({ subsets:['latin'], variable:'--font-playfair', display:'swap' });
const dmSans   = DM_Sans({ subsets:['latin'], variable:'--font-dm-sans', display:'swap', axes:['opsz'] });
const mono     = JetBrains_Mono({ subsets:['latin'], variable:'--font-mono', display:'swap' });

export const metadata: Metadata = {
  title: { default:'Scholr — AI Attendance Tracker', template:'%s · Scholr' },
  description: 'Track college attendance with AI-powered timetable parsing. Never fall below 75% again. Built for Indian college students.',
  keywords: ['attendance tracker','college attendance','AI timetable','75% attendance','student app','Indian college'],
  authors: [{ name:'Scholr' }],
  creator: 'Scholr',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Scholr',
    title: 'Scholr — AI Attendance Tracker for College Students',
    description: 'Upload your timetable photo. AI extracts your schedule. Track attendance, get 75% alerts, add notes — all in one beautiful app.',
    images: [{ url:'/og-image.png', width:1200, height:630, alt:'Scholr Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scholr — Never miss the 75% line',
    description: 'AI-powered attendance tracker for college students.',
  },
  robots: { index:true, follow:true },
};

export const viewport: Viewport = {
  themeColor: '#05050e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${mono.variable}`}>
      <body className="font-dm antialiased min-h-screen">
        <SessionProvider>
          {children}
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
