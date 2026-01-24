'use client';

import { Button } from '@/components/ui/button';
import { CircleCheck } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  '완전 무료',
  '제한 없는 글 작성',
  '빠른 피드백 반영',
  '정식 출시 후 프리미엄 혜택',
];

export function BetaCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-cyan-600 dark:from-blue-900 dark:to-cyan-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Emoji Icon */}
        <div className="text-6xl mb-6 animate-bounce">🎉</div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          지금 베타 테스터가 되어보세요!
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Pagelet의 첫 번째 사용자가 되어 다양한 혜택을 누리세요. 지금 가입하면 정식 출시 후에도 프리미엄 기능을 무료로 사용할 수 있습니다.
        </p>

        {/* Benefits Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-white bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 animate-fade-in-down"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CircleCheck className="w-6 h-6 flex-shrink-0" />
              <span className="text-left font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          asChild
          size="lg"
          className="text-base px-10 bg-white text-primary hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all animate-pulse"
        >
          <Link href="/signup">지금 무료로 시작하기</Link>
        </Button>
      </div>
    </section>
  );
}
