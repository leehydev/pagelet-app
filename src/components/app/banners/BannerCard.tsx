'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banner, PostStatus } from '@/lib/api';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface BannerCardProps {
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
}

export function BannerCard({ banner, onEdit, onDelete }: BannerCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = banner.isActive && isWithinPeriod(banner.startAt, banner.endAt);
  const post = banner.post;
  const isPostPublished = post.status === PostStatus.PUBLISHED;
  const isPostHidden = !isPostPublished;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border rounded-lg overflow-hidden',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* 가로형 레이아웃: 텍스트 + 이미지 */}
      <div className="flex">
        {/* 텍스트 영역 (60%) */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* 카테고리 + 게시글 상태 */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {post.categoryName && (
                <Badge variant="secondary" className="text-xs">
                  {post.categoryName}
                </Badge>
              )}
              <Badge variant={isPostPublished ? 'outline' : 'destructive'} className="text-xs">
                {getPostStatusLabel(post.status)}
              </Badge>
            </div>

            {/* 비공개 경고 */}
            {isPostHidden && (
              <div className="flex items-center gap-1 text-amber-600 text-xs mb-2">
                <AlertTriangle className="h-3 w-3" />
                <span>게시글이 비공개 상태라 배너가 표시되지 않습니다</span>
              </div>
            )}

            {/* 제목 */}
            <h3 className="font-semibold text-base line-clamp-2 mb-1">{post.title}</h3>

            {/* 소제목 */}
            {post.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-2">{post.subtitle}</p>
            )}
          </div>

          {/* 하단 정보 */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {post.publishedAt && dayjs(post.publishedAt).format('YYYY.MM.DD')}
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
              {isActive ? '활성' : '비활성'}
            </Badge>
          </div>
        </div>

        {/* 이미지 영역 (40%) */}
        <div className="w-[40%] relative shrink-0">
          {post.ogImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.ogImageUrl}
              alt={post.title}
              className="w-full h-full object-cover aspect-video"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center aspect-video">
              <span className="text-gray-400 text-sm">이미지 없음</span>
            </div>
          )}

          {/* 드래그 핸들 */}
          <button
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-md shadow-sm cursor-grab active:cursor-grabbing"
            aria-label="드래그하여 순서 변경"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {formatPeriod(banner.startAt, banner.endAt)}
        </div>
        <div className="flex items-center gap-2">
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

function getPostStatusLabel(status: PostStatus): string {
  switch (status) {
    case PostStatus.PUBLISHED:
      return '발행됨';
    case PostStatus.DRAFT:
      return '임시저장';
    case PostStatus.PRIVATE:
      return '비공개';
    default:
      return status;
  }
}
