import { LandingHero } from '@/components/public/landing/LandingHero';
import { FeaturesSection } from '@/components/public/landing/FeaturesSection';
import { ProductPreview } from '@/components/public/landing/ProductPreview';
import { HowItWorks } from '@/components/public/landing/HowItWorks';
import { BetaCTA } from '@/components/public/landing/BetaCTA';
import { LandingFooter } from '@/components/public/landing/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagelet - 블로그를 더 쉽고 빠르게',
  description: '복잡한 설정 없이 5분만에 시작하는 나만의 블로그 플랫폼. 현재 베타 테스트 중, 무료로 시작하세요.',
  keywords: ['블로그', '블로그 플랫폼', 'Pagelet', '베타', '무료 블로그'],
  openGraph: {
    title: 'Pagelet - 블로그를 더 쉽고 빠르게',
    description: '복잡한 설정 없이 5분만에 시작하는 나만의 블로그 플랫폼',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      <LandingHero />
      <FeaturesSection />
      <ProductPreview />
      <HowItWorks />
      <BetaCTA />
      <LandingFooter />
    </div>
  );
}
