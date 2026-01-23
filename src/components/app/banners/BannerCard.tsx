'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banner } from '@/lib/api';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface BannerCardProps {
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
}

export function BannerCard({ banner, onEdit, onDelete }: BannerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = banner.isActive && isWithinPeriod(banner.startAt, banner.endAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border rounded-lg overflow-hidden',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* 이미지 미리보기 */}
      <div className="relative aspect-[4/1] bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imageUrl}
          alt={banner.altText || '배너 이미지'}
          className="w-full h-full object-cover"
        />
        {/* 드래그 핸들 */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-md shadow-sm cursor-grab active:cursor-grabbing"
          aria-label="드래그하여 순서 변경"
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </button>
        {/* 상태 뱃지 */}
        <div className="absolute top-2 right-2">
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? '활성' : '비활성'}
          </Badge>
        </div>
      </div>

      {/* 정보 */}
      <div className="p-4">
        <div className="space-y-2 text-sm">
          {/* 링크 */}
          {banner.linkUrl ? (
            <div className="flex items-center gap-1 text-muted-foreground truncate">
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{banner.linkUrl}</span>
              {banner.openInNewTab && (
                <span className="text-xs">(새 탭)</span>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">링크 없음</div>
          )}

          {/* 기간 */}
          <div className="text-muted-foreground">
            {formatPeriod(banner.startAt, banner.endAt)}
          </div>

          {/* 대체 텍스트 */}
          {banner.altText && (
            <div className="text-muted-foreground truncate">
              Alt: {banner.altText}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            수정
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-3 w-3 mr-1" />
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
}

function isWithinPeriod(startAt: string | null, endAt: string | null): boolean {
  const now = dayjs();

  if (startAt && dayjs(startAt).isAfter(now)) {
    return false;
  }

  if (endAt && dayjs(endAt).isBefore(now)) {
    return false;
  }

  return true;
}

function formatPeriod(startAt: string | null, endAt: string | null): string {
  if (!startAt && !endAt) {
    return '항상 노출';
  }

  const format = 'YYYY.MM.DD HH:mm';
  const start = startAt ? dayjs(startAt).format(format) : '시작 없음';
  const end = endAt ? dayjs(endAt).format(format) : '종료 없음';

  return `${start} ~ ${end}`;
}
