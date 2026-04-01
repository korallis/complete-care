import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Complete Care',
    template: '%s | Complete Care',
  },
  description:
    'UK care management platform for domiciliary care, supported living, and children\'s residential homes.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200'
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'white',
                  border: '1px solid oklch(0.91 0.005 160)',
                  borderRadius: '10px',
                  color: 'oklch(0.18 0.02 160)',
                  fontSize: '13px',
                  boxShadow: '0 4px 20px -4px oklch(0.3 0.04 160 / 0.15)',
                },
                classNames: {
                  success: 'border-l-4 !border-l-green-500',
                  error: 'border-l-4 !border-l-red-500',
                  warning: 'border-l-4 !border-l-amber-500',
                  info: 'border-l-4 !border-l-blue-500',
                },
              }}
            />
          </AuthSessionProvider>
      </body>
    </html>
  );
}
