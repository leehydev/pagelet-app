'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SocialLinks } from '../SocialLinks';
import { SiteSettings } from '@/lib/api';
import { Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  siteSlug: string;
  siteName?: string;
  logoImageUrl?: string;
  categories?: Array<{ slug: string; name: string }>;
  settings: SiteSettings;
}

export function Footer({
  logoImageUrl,
  siteSlug,
  siteName,
  categories = [],
  settings,
}: FooterProps) {
  const defaultCategories = [
    { slug: 'tech', name: 'Technology' },
    { slug: 'lifestyle', name: 'Digital Lifestyle' },
    { slug: 'design', name: 'User Experience' },
    { slug: 'marketing', name: 'Growth Marketing' },
  ];

  const footerCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Brand */}
          <div>
            <Link href={`/t/${siteSlug}`}>
              <div className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                {logoImageUrl && (
                  <div className="relative w-[100px] h-[40px] overflow-hidden flex items-center">
                    <Image
                      src={logoImageUrl as string}
                      alt={siteName || ''}
                      fill
                      sizes="100px"
                      className="object-contain object-left"
                    />
                  </div>
                )}
                <span className="text-xl font-bold text-gray-900">{siteName}</span>
              </div>
            </Link>
            <div className="text-sm text-gray-600 mb-6 max-w-sm space-y-1">
              <p>
                {settings.businessName}
                {settings.businessName && <span className="mx-2">|</span>}
                {settings.representativeName ? settings.representativeName : ''}
              </p>
              {settings.businessNumber && <p>사업자등록번호: {settings.businessNumber}</p>}
              {settings.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-gray-700">
                    {settings.contactEmail}
                  </a>
                </div>
              )}
              {settings.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-gray-700">
                    {settings.contactPhone}
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <SocialLinks settings={settings} />
            </div>
          </div>

          {/* Right Column - Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Explore Categories
            </h3>
            <ul className="space-y-3">
              {footerCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/t/${siteSlug}/category/${category.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-100">
          <Link href={'https://' + process.env.NEXT_PUBLIC_TENANT_DOMAIN!}>Powered by Pagelet</Link>
        </div>
      </div>
    </footer>
  );
}
