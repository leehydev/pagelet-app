'use client';

import Link from 'next/link';
import { PublicBanner } from '@/lib/api';
import Image from 'next/image';

interface PostBannerCardProps {
  banner: PublicBanner;
  siteSlug: string;
  className?: string;
}

export function PostBannerCard({ banner, siteSlug, className }: PostBannerCardProps) {
  const post = banner.post;

  return (
    <Link
      href={`/t/${siteSlug}/posts/${post.slug}`}
      className="group block rounded-sm overflow-hidden"
    >
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-3/5 aspect-video w-full bg-cover bg-center">
              <Image
                src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-48 md:h-full object-cover aspect-video rounded-lg md:rounded-tl-sm md:rounded-sm"
              />
            </div>
            <div className="lg:w-2/5 p-10 flex flex-col justify-center">
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 w-fit">
                {post.categoryName}
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
                {post.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {post.subtitle}
              </p>
              <button className="bg-primary hover:bg-primary/90 text-white w-fit px-8 py-3 rounded-lg font-bold transition-all shadow-md flex items-center gap-2">
                Read More
              </button>
            </div>
          </div>
        </div>
      </section>
    </Link>
  );
}
