import { SiteSettings } from '@/lib/api';

// 카카오톡 아이콘
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.73 6.72-.15.54-.97 3.47-1 3.64 0 .11.04.22.12.29.06.05.14.08.22.08.09 0 .18-.03.26-.1 1.43-1.02 3.96-2.83 4.58-3.28.36.04.72.06 1.09.06 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z" />
    </svg>
  );
}

// 네이버 아이콘
function NaverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
    </svg>
  );
}

// 인스타그램 아이콘
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

interface SocialLinksProps {
  settings: SiteSettings;
}

export function SocialLinks({ settings }: SocialLinksProps) {
  const links = [
    {
      url: settings.kakaoChannelUrl,
      label: '카카오 채널',
      icon: KakaoIcon,
      hoverColor: 'hover:text-[#FAE100]',
    },
    {
      url: settings.naverMapUrl,
      label: '네이버 지도',
      icon: NaverIcon,
      hoverColor: 'hover:text-[#03C75A]',
    },
    {
      url: settings.instagramUrl,
      label: '인스타그램',
      icon: InstagramIcon,
      hoverColor: 'hover:text-[#E4405F]',
    },
  ].filter((link) => link.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-gray-500 ${link.hoverColor} transition-colors`}
            title={link.label}
          >
            <Icon className="w-5 h-5" />
          </a>
        );
      })}
    </div>
  );
}
