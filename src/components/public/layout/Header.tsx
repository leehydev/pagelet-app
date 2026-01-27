'use client';

import Image from 'next/image';
import { MobileMenu } from './MobileMenu';
import { PublicCategory } from '@/lib/api/types';
import Link from 'next/link';

interface HeaderProps {
  logoImageUrl: string;
  siteSlug: string;
  siteName: string;
  categories: PublicCategory[];
}

export function Header({ logoImageUrl, siteSlug, siteName, categories = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/t/${siteSlug}`}>
            <div className="flex items-center gap-2">
              {logoImageUrl && (
                <div className="relative w-[100px] h-[40px] overflow-hidden flex items-center">
                  <Image src={logoImageUrl} alt={siteName} fill sizes="100px" className="object-contain object-left" priority />
                </div>
              )}
              <h1 className="hidden md:block text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {siteName}
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <MobileMenu categories={categories} siteSlug={siteSlug} />
          </div>
        </div>
        <nav className="flex items-center gap-8 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/50">
          <Link
            className="flex flex-col items-center justify-center border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-primary py-2 px-1 transition-all whitespace-nowrap"
            href={`/t/${siteSlug}/posts`}
          >
            <p className="text-sm font-bold">All</p>
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              className="flex flex-col items-center justify-center border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-primary py-2 px-1 transition-all whitespace-nowrap"
              href={`/t/${siteSlug}/category/${category.slug}`}
            >
              <p className="text-sm font-bold">
                {category.name}({category.postCount})
              </p>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
