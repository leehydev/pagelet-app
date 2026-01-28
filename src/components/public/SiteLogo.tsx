import Image from 'next/image';

interface SiteLogoProps {
  /** 로고 이미지 URL */
  src: string;
  /** 대체 텍스트 (사이트 이름) */
  alt: string;
  /** 최대 높이 (기본: 40px) */
  maxHeight?: number;
  /** 우선 로딩 여부 */
  priority?: boolean;
}

/**
 * 사이트 로고 이미지
 * 높이를 기준으로 비율을 유지하며 표시
 */
export function SiteLogo({ src, alt, maxHeight = 30, priority = false }: SiteLogoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes="200px"
      priority={priority}
      className="w-auto object-contain"
      style={{ height: maxHeight, maxHeight }}
    />
  );
}
