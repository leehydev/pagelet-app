'use client';

import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBanner, useUpdateBanner } from '@/hooks/use-banners';
import { Banner, PostSearchResult } from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { toast } from 'sonner';
import { PostSearchAutocomplete } from './PostSearchAutocomplete';
import dayjs from 'dayjs';

function bannerToPostSearchResult(banner: Banner): PostSearchResult {
  return {
    id: banner.post.id,
    title: banner.post.title,
    subtitle: banner.post.subtitle,
    ogImageUrl: banner.post.ogImageUrl,
    categoryName: banner.post.categoryName,
    publishedAt: banner.post.publishedAt,
    status: 'PUBLISHED',
  };
}

const bannerSchema = z.object({
  postId: z.string().min(1, '게시글을 선택해주세요'),
  isActive: z.boolean(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerFormSheetProps {
  siteId: string;
  banner?: Banner;
  existingPostIds?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BannerFormSheet({
  siteId,
  banner,
  existingPostIds = [],
  open,
  onOpenChange,
  onSuccess,
}: BannerFormSheetProps) {
  // 시트가 열릴 때마다 새로운 key를 생성하여 폼을 완전히 리셋
  const formKey = useMemo(() => `${open}-${banner?.id || 'new'}`, [open, banner?.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{banner ? '배너 수정' : '배너 등록'}</SheetTitle>
          <SheetDescription>
            배너로 표시할 게시글을 선택하고 노출 설정을 구성하세요.
          </SheetDescription>
        </SheetHeader>

        {open && (
          <div className="p-4">
            <BannerForm
              key={formKey}
              siteId={siteId}
              banner={banner}
              existingPostIds={existingPostIds}
              onOpenChange={onOpenChange}
              onSuccess={onSuccess}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface BannerFormProps {
  siteId: string;
  banner?: Banner;
  existingPostIds: string[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function BannerForm({ siteId, banner, existingPostIds, onOpenChange, onSuccess }: BannerFormProps) {
  const isEdit = !!banner;
  const createMutation = useCreateBanner(siteId);
  const updateMutation = useUpdateBanner(siteId);

  // 초기 선택된 게시글
  const initialSelectedPost = banner ? bannerToPostSearchResult(banner) : null;

  // 선택된 게시글 상태
  const [selectedPost, setSelectedPost] = useState<PostSearchResult | null>(initialSelectedPost);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      postId: banner?.postId || '',
      isActive: banner?.isActive ?? true,
      startAt: banner?.startAt ? dayjs(banner.startAt).format('YYYY-MM-DDTHH:mm') : '',
      endAt: banner?.endAt ? dayjs(banner.endAt).format('YYYY-MM-DDTHH:mm') : '',
    },
  });

  // 게시글 선택 핸들러
  const handlePostSelect = useCallback(
    (post: PostSearchResult | null) => {
      setSelectedPost(post);
      setValue('postId', post?.id || '', { shouldValidate: true });
    },
    [setValue],
  );

  const onSubmit = async (data: BannerFormData) => {
    try {
      if (isEdit && banner) {
        await updateMutation.mutateAsync({
          bannerId: banner.id,
          data: {
            postId: data.postId,
            isActive: data.isActive,
            startAt: data.startAt ? new Date(data.startAt).toISOString() : null,
            endAt: data.endAt ? new Date(data.endAt).toISOString() : null,
          },
        });
        toast.success('배너가 수정되었습니다.');
      } else {
        await createMutation.mutateAsync({
          postId: data.postId,
          isActive: data.isActive,
          startAt: data.startAt ? new Date(data.startAt).toISOString() : undefined,
          endAt: data.endAt ? new Date(data.endAt).toISOString() : undefined,
        });
        toast.success('배너가 등록되었습니다.');
      }
      onSuccess();
    } catch (err) {
      const message = getErrorDisplayMessage(err, '배너 저장에 실패했습니다.');
      toast.error(message);
    }
  };

  // 수정 시 현재 배너의 게시글은 제외 목록에서 제외
  const excludePostIds = isEdit
    ? existingPostIds.filter((id) => id !== banner?.postId)
    : existingPostIds;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
      {/* 게시글 선택 */}
      <div className="space-y-2">
        <Label>
          게시글 <span className="text-red-500">*</span>
        </Label>
        <PostSearchAutocomplete
          siteId={siteId}
          value={selectedPost}
          onChange={handlePostSelect}
          excludePostIds={excludePostIds}
          placeholder="게시글 제목으로 검색..."
        />
        <p className="text-xs text-muted-foreground">
          발행된 게시글만 검색됩니다. 이미 등록된 배너 게시글은 제외됩니다.
        </p>
        {errors.postId && <p className="text-xs text-red-500">{errors.postId.message}</p>}
      </div>

      {/* 활성화 상태 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          className="h-4 w-4 rounded border-gray-300"
          {...register('isActive')}
        />
        <Label htmlFor="isActive" className="font-normal">
          활성화
        </Label>
      </div>

      {/* 노출 기간 */}
      <div className="space-y-4">
        <Label>노출 기간 (선택사항)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startAt" className="text-xs text-muted-foreground">
              시작
            </Label>
            <Input id="startAt" type="datetime-local" {...register('startAt')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt" className="text-xs text-muted-foreground">
              종료
            </Label>
            <Input id="endAt" type="datetime-local" {...register('endAt')} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">기간을 설정하지 않으면 항상 노출됩니다.</p>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : isEdit ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
