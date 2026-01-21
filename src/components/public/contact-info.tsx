import { SiteSettings } from '@/lib/api';

interface ContactInfoProps {
  settings: SiteSettings;
}

export function ContactInfo({ settings }: ContactInfoProps) {
  const hasContact = settings.contactEmail || settings.contactPhone || settings.address;
  if (!hasContact) return null;

  return (
    <div className="text-sm text-gray-500 space-y-1">
      {settings.contactEmail && (
        <p>
          <a href={`mailto:${settings.contactEmail}`} className="hover:text-gray-700">
            {settings.contactEmail}
          </a>
        </p>
      )}
      {settings.contactPhone && (
        <p>
          <a href={`tel:${settings.contactPhone}`} className="hover:text-gray-700">
            {settings.contactPhone}
          </a>
        </p>
      )}
      {settings.address && <p>{settings.address}</p>}
    </div>
  );
}
