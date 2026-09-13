import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://questchase.agency'),
  title: 'QuestChase — Complete your quests. Follow the clues. Solve the case.',
  description:
    'A gamified productivity application designed as a premium cinematic detective mystery. Real-life tasks fuel your casework, earn XP & Gold, reveal forensic clues, and solve murder cases.',
  keywords: [
    'QuestChase',
    'Gamified Productivity',
    'Detective RPG',
    'Murder Mystery To-Do',
    'Habit Tracker',
    'Productivity Game',
  ],
  authors: [{ name: 'QuestChase Bureau' }],
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/logo.png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'QuestChase — Complete your quests. Follow the clues. Solve the case.',
    description:
      'Real-life tasks fuel your casework, earn XP & Gold, reveal forensic clues, and solve murder cases.',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'QuestChase Detective Mystery RPG Logo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-noir text-parchment antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
