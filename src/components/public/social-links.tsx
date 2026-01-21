import { SiteSettings } from '@/lib/api';

interface SocialLinksProps {
  settings: SiteSettings;
}

export function SocialLinks({ settings }: SocialLinksProps) {
  const links = [
    { url: settings.kakaoChannelUrl, label: '카카오 채널', icon: '💬' },
    { url: settings.naverMapUrl, label: '네이버 지도', icon: '📍' },
    { url: settings.instagramUrl, label: '인스타그램', icon: '📷' },
  ].filter((link) => link.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title={link.label}
        >
          <span className="text-xl">{link.icon}</span>
        </a>
      ))}
    </div>
  );
}
