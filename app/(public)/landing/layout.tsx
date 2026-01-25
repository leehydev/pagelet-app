import type { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: '/images/favicon.ico',
  },
  verification: {
    other: {
      'naver-site-verification': 'a1a0e077b45645abecc54a767e6d2eb997f12124',
    },
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
