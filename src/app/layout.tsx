import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Complete Care',
    template: '%s | Complete Care',
  },
  description:
    'UK care management platform for domiciliary care, supported living, complex care, and children\'s residential homes.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200',
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'oklch(0.16 0.01 220 / 0.96)',
              border: '1px solid oklch(0.32 0.03 220 / 0.4)',
              borderRadius: '18px',
              color: 'oklch(0.96 0.01 95)',
              fontSize: '13px',
              boxShadow: '0 24px 60px -24px oklch(0.08 0.02 220 / 0.75)',
              backdropFilter: 'blur(18px)',
            },
            classNames: {
              success: 'border-l-2 !border-l-[oklch(0.72_0.16_165)]',
              error: 'border-l-2 !border-l-[oklch(0.64_0.18_24)]',
              warning: 'border-l-2 !border-l-[oklch(0.8_0.16_86)]',
              info: 'border-l-2 !border-l-[oklch(0.69_0.11_216)]',
            },
          }}
        />
      </body>
    </html>
  );
}
