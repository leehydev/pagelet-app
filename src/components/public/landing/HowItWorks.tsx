'use client';

import { CircleUser, Pencil, Share2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: CircleUser,
    number: '1',
    title: '가입하기',
    description: '이메일로 30초만에 간편하게 가입하세요',
  },
  {
    icon: Pencil,
    number: '2',
    title: '글 작성하기',
    description: '직관적인 에디터로 마음껏 글을 작성하세요',
  },
  {
    icon: Share2,
    number: '3',
    title: '공유하기',
    description: '나만의 URL로 세상에 당신의 이야기를 공유하세요',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
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
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            간단한 3단계로 시작하는 Pagelet
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Step Card */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {/* Icon Circle */}
                  <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 relative"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon className="w-10 h-10 text-primary" />
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-lg">
                      {step.number}
                    </div>
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                    {step.description}
                  </p>
                </motion.div>

                {/* Arrow between steps (desktop only) */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden md:block absolute top-10 -right-4 transform translate-x-1/2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  >
                    <ArrowRight className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
