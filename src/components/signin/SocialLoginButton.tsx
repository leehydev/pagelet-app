'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocialLoginButtonProps {
  label: string;
  iconSrc: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
  iconWidth?: number;
  iconHeight?: number;
  className?: string;
}

export default function SocialLoginButton({
  label,
  iconSrc,
  bgColor = '',
  textColor = 'text-white',
  onClick,
  iconWidth = 20,
  iconHeight = 20,
  className,
}: SocialLoginButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      className={cn(
        `h-14 relative overflow-hidden before:absolute before:inset-0 before:bg-black/0
        before:transition before:duration-200 hover:before:bg-black/15 ${bgColor}`,
        className,
      )}
    >
      <Image src={iconSrc} width={iconWidth} height={iconHeight} alt={`${label} icon`} />
      <div className="w-full">
        <span className={`${textColor} text-lg`}>{label}</span>
      </div>
    </Button>
  );
}
