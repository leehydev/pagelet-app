'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { motion, MotionValue, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

const products = [
  {
    id: 'editor',
    title: 'Editor with Tiptap',
    caption: '강력한 직관적인 에디터로 쉽게 글을 작성하세요',
    screenshot: 'https://assets.pagelet.kr/resource/admin_editor_screencapture.png',
  },
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    caption: '깔끔한 관리자 대시보드로 콘텐츠를 관리하세요',
    screenshot: 'https://assets.pagelet.kr/resource/admin_banner_screencapture.png',
  },
  {
    id: 'blog',
    title: 'Public Blog Page',
    caption: '아름다운 블로그 페이지로 독자를 만나세요',
    screenshot: 'https://assets.pagelet.kr/resource/blog_post_screencapture.png',
  },
];

interface ProductCardProps {
  product: (typeof products)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
}

function ProductCard({ product, index, scrollYProgress }: ProductCardProps) {
  // useTransform을 컴포넌트 최상위에서 호출
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -50 * (index + 1)]);

  return (
    <motion.div
      style={{ y: cardY }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <Dialog>
        <DialogTrigger asChild>
          <div className="group cursor-pointer">
            {/* Screenshot Card */}
            <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {/* Browser Chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              {/* Screenshot Content */}
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-50 dark:bg-gray-900">
                <Image
                  src={product.screenshot}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-full text-sm font-medium text-gray-900 dark:text-white">
                    클릭하여 확대
                  </div>
                </div>
              </div>
            </div>
            {/* Caption */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {product.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{product.caption}</p>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden h-full">
          <div className="relative w-full h-full overflow-y-auto">
            <Image
              src={product.screenshot}
              alt={product.title}
              width={1920}
              height={1080}
              className="w-full h-auto"
              quality={100}
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={ref}
      id="product-preview"
      className="relative py-20 bg-gray-50 dark:bg-background-dark"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Product Preview
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            강력한 직관적인 툴로 완성된 블로그 플랫폼을 직접 경험하세요
          </p>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
