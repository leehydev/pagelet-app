'use client';

import { Pencil, Palette, Zap, Smartphone, Search, Folder } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Pencil,
    title: '강력한 에디터',
    description: '마크다운, 이미지, 유튜브 임베드를 지원하는 Tiptap 기반 에디터',
  },
  {
    icon: Palette,
    title: '테마 커스터마이징',
    description: '폰트 선택 및 커스텀 로고 적용 기능 지원',
  },
  {
    icon: Zap,
    title: '빠른 성능',
    description: 'Next.js 기반의 초고속 로딩과 최적화',
  },
  {
    icon: Smartphone,
    title: '완벽한 반응형',
    description: '모바일, 태블릿, 데스크톱 모든 기기 최적화',
  },
  {
    icon: Search,
    title: 'SEO 최적화',
    description: '검색 엔진 노출을 위한 메타 태그 자동 생성',
  },
  {
    icon: Folder,
    title: '카테고리 관리',
    description: '체계적인 글 분류와 관리 시스템',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pagelet의 주요 기능
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            블로그 운영에 필요한 모든 기능을 제공합니다
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
