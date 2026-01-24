'use client';

import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '/docs' },
  ],
  connect: [
    { label: 'Github', href: 'https://github.com' },
    { label: 'Discord', href: 'https://discord.com' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pagelet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm">
              블로그를 더 쉽고 빠르게. 복잡한 설정 없이 5분만에 시작하는 나만의 블로그 플랫폼
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Connect</h4>
            <ul className="space-y-2">
              {footerLinks.connect.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2026 Pagelet. All rights reserved.
            </p>
            <Link
              href={`https://www.${process.env.NEXT_PUBLIC_TENANT_DOMAIN}`}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Powered by Pagelet
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
