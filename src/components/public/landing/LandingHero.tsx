'use client';

import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export function LandingHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const { scrollYProgress: mockupProgress } = useScroll({
    target: mockupRef,
    offset: ['start 0.8', 'end start'],
  });

  // Parallax transformations
  const backgroundY = useTransform(sectionProgress, [0, 1], ['0%', '50%']);
  const contentOpacity = useTransform(sectionProgress, [0, 0.5], [1, 0]);
  // 이미지가 프레임 안에서 스크롤되는 효과 (이미지 높이 200% 기준 -50% 이동)
  const imageY = useTransform(mockupProgress, [0, 1], ['0%', '-40%']);

  const scrollToDemo = () => {
    const productSection = document.getElementById('product-preview');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-linear-to-b from-blue-50 to-white dark:from-background-dark dark:to-gray-900">
      {/* Hero Content Area */}
      <div
        ref={sectionRef}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      >
        {/* Background decorative elements with parallax */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ y: backgroundY }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
        </motion.div>

        <motion.div
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center"
          style={{ opacity: contentOpacity }}
        >
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in-down">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🚀 현재 베타 테스트 중!
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in-down [animation-delay:200ms]">
            블로그를 더{' '}
            <span className="bg-linear-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              쉽고 빠르게
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto animate-fade-in-down [animation-delay:400ms]">
            복잡한 설정 없이 5분만에 시작하는
            <br />
            나만의 블로그 플랫폼
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-down [animation-delay:600ms]">
            <Button
              asChild
              size="lg"
              className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Link href={process.env.NEXT_PUBLIC_APP_URL || ''}>무료로 시작하기</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToDemo}
              className="text-base px-8 shadow-sm"
            >
              데모 보기
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Hero Image Mockup - Separate section for scroll effect */}
      <div
        ref={mockupRef}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-20 animate-fade-in-down [animation-delay:800ms]"
      >
        <div className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 ml-4 px-4 py-1 bg-white dark:bg-gray-900 rounded text-xs text-gray-500 dark:text-gray-400">
              myblog.pagelet.kr
            </div>
          </div>
          {/* Actual Screenshot - scrolls within the frame */}
          <div className="aspect-16/10 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
            <motion.div
              className="absolute inset-x-0 top-0 h-[300%] md:h-[2700px]"
              style={{ y: imageY }}
            >
              <Image
                src="https://assets.pagelet.kr/resource/blog_main_screencapture.png"
                alt="Pagelet Blog Interface"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                className="object-contain object-top"
                priority
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
