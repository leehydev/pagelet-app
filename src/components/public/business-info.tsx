import { SiteSettings } from '@/lib/api';

interface BusinessInfoProps {
  settings: SiteSettings;
}

export function BusinessInfo({ settings }: BusinessInfoProps) {
  const hasBusinessInfo =
    settings.businessName || settings.businessNumber || settings.representativeName;
  if (!hasBusinessInfo) return null;

  return (
    <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {settings.businessName && <span>상호: {settings.businessName}</span>}
        {settings.representativeName && <span>대표: {settings.representativeName}</span>}
        {settings.businessNumber && <span>사업자등록번호: {settings.businessNumber}</span>}
      </div>
    </div>
  );
}
