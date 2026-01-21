import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
// import { Suspense } from 'react';
import './globals.css';
import { RootProviders } from './providers/root-providers';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';
// import NavigationTracker from '@/components/NavigationTracker';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pagelet',
  description: 'Pagelet - 멀티 테넌트 플랫폼',
  openGraph: {
    title: 'Pagelet',
    description: 'Pagelet - 멀티 테넌트 플랫폼',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col
        bg-background-light dark:bg-background-dark`}
        suppressHydrationWarning
      >
        <RootProviders>
          {/* 네비게이션 스택 추적 비활성화 (필요시 주석 해제) */}
          {/* <Suspense fallback={null}>
            <NavigationTracker />
          </Suspense> */}
          <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
        </RootProviders>
      </body>
    </html>
  );
}
