'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  /** 공유할 URL (없으면 현재 페이지 URL 사용) */
  url?: string;
  /** 버튼 텍스트 */
  label?: string;
  /** 버튼 크기 */
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  /** 버튼 스타일 */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
}

/**
 * 링크 공유 버튼 컴포넌트
 * 클릭 시 URL을 클립보드에 복사하고 토스트 알림을 표시합니다.
 */
export function ShareButton({
  url,
  label = '공유하기',
  size = 'sm',
  variant = 'outline',
  className,
}: ShareButtonProps) {
  const handleShare = async () => {
    try {
      const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
      
      // 클립보드 API 사용
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('링크가 복사되었습니다');
      } else {
        // 폴백: 구식 방법
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('링크가 복사되었습니다');
      }
    } catch (error) {
      console.error('링크 복사 실패:', error);
      toast.error('링크 복사에 실패했습니다');
    }
  };

  return (
    <Button
      onClick={handleShare}
      size={size}
      variant={variant}
      className={className}
      aria-label="링크 공유"
    >
      <Share2 className="w-4 h-4" />
      {label && size !== 'icon' && size !== 'icon-sm' && size !== 'icon-lg' && (
        <span>{label}</span>
      )}
    </Button>
  );
}
