import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
// import { Suspense } from 'react';
import './globals.css';
import { RootProviders } from './providers/root-providers';
import { ErrorBoundaryWrapper } from '@/components/common/ErrorBoundaryWrapper';
// import NavigationTracker from '@/components/common/NavigationTracker';

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
  icons: {
    icon: '/images/favicon.ico',
  },
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
    <html lang="ko" suppressHydrationWarning className="h-full">
      <head>
        {/* 카카오맵 지도 퍼가기 스크립트 - 클라이언트 사이드 로드 */}
        <Script
          src="https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen h-full flex flex-col`}
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
