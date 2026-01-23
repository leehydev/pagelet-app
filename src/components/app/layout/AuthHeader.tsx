'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function AuthHeader() {
  const pathname = usePathname();
  const isSignInPage = pathname === '/signin';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logos/gray_logo_200.png"
            alt="Pagelet"
            width={100}
            height={28}
            className="h-7 w-auto"
          />
        </Link>

        {/* 로그인/회원가입 버튼 */}
        {isSignInPage ? (
          <Button asChild variant="default" size="sm">
            <Link href="/signup">회원가입</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/signin">로그인</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
