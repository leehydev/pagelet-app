'use client';

import { useEffect } from 'react';
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
import { Banner, DeviceType } from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { toast } from 'sonner';
import { BannerUploader } from './BannerUploader';
import dayjs from 'dayjs';

const bannerSchema = z.object({
  imageUrl: z.string().min(1, '이미지를 업로드해주세요'),
  linkUrl: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\//.test(val), {
      message: 'http 또는 https URL만 허용됩니다',
    }),
  openInNewTab: z.boolean(),
  isActive: z.boolean(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  altText: z.string().max(255, '대체 텍스트는 최대 255자까지 가능합니다').optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerFormSheetProps {
  siteId: string;
  deviceType: DeviceType;
  banner?: Banner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BannerFormSheet({
  siteId,
  deviceType,
  banner,
  open,
  onOpenChange,
  onSuccess,
}: BannerFormSheetProps) {
  const isEdit = !!banner;
  const createMutation = useCreateBanner(siteId);
  const updateMutation = useUpdateBanner(siteId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      imageUrl: '',
      linkUrl: '',
      openInNewTab: true,
      isActive: true,
      startAt: '',
      endAt: '',
      altText: '',
    },
  });

  const imageUrl = watch('imageUrl');

  // 폼 초기화
  useEffect(() => {
    if (open) {
      if (banner) {
        reset({
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl || '',
          openInNewTab: banner.openInNewTab,
          isActive: banner.isActive,
          startAt: banner.startAt ? dayjs(banner.startAt).format('YYYY-MM-DDTHH:mm') : '',
          endAt: banner.endAt ? dayjs(banner.endAt).format('YYYY-MM-DDTHH:mm') : '',
          altText: banner.altText || '',
        });
      } else {
        reset({
          imageUrl: '',
          linkUrl: '',
          openInNewTab: true,
          isActive: true,
          startAt: '',
          endAt: '',
          altText: '',
        });
      }
    }
  }, [open, banner, reset]);

  const onSubmit = async (data: BannerFormData) => {
    try {
      if (isEdit && banner) {
        await updateMutation.mutateAsync({
          bannerId: banner.id,
          data: {
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl || null,
            openInNewTab: data.openInNewTab,
            isActive: data.isActive,
            startAt: data.startAt ? new Date(data.startAt).toISOString() : null,
            endAt: data.endAt ? new Date(data.endAt).toISOString() : null,
            altText: data.altText || null,
          },
        });
        toast.success('배너가 수정되었습니다.');
      } else {
        await createMutation.mutateAsync({
          imageUrl: data.imageUrl,
          linkUrl: data.linkUrl || undefined,
          openInNewTab: data.openInNewTab,
          isActive: data.isActive,
          startAt: data.startAt ? new Date(data.startAt).toISOString() : undefined,
          endAt: data.endAt ? new Date(data.endAt).toISOString() : undefined,
          altText: data.altText || undefined,
          deviceType,
        });
        toast.success('배너가 등록되었습니다.');
      }
      onSuccess();
    } catch (err) {
      const message = getErrorDisplayMessage(err, '배너 저장에 실패했습니다.');
      toast.error(message);
    }
  };

  const handleImageUpload = (url: string) => {
    setValue('imageUrl', url, { shouldValidate: true });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '배너 수정' : '배너 등록'}</SheetTitle>
          <SheetDescription>
            {deviceType === 'desktop' ? '데스크톱' : '모바일'} 배너를 {isEdit ? '수정' : '등록'}합니다.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <Label>
              이미지 <span className="text-red-500">*</span>
            </Label>
            <BannerUploader
              siteId={siteId}
              currentUrl={imageUrl}
              onUpload={handleImageUpload}
            />
            <p className="text-xs text-muted-foreground">
              권장 크기: 1280 x 300~500px, 최대 5MB (PNG, JPG, WebP)
            </p>
            {errors.imageUrl && (
              <p className="text-xs text-red-500">{errors.imageUrl.message}</p>
            )}
          </div>

          {/* 링크 URL */}
          <div className="space-y-2">
            <Label htmlFor="linkUrl">링크 URL</Label>
            <Input
              id="linkUrl"
              type="url"
              placeholder="https://example.com"
              {...register('linkUrl')}
            />
            {errors.linkUrl && (
              <p className="text-xs text-red-500">{errors.linkUrl.message}</p>
            )}
          </div>

          {/* 새 탭에서 열기 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="openInNewTab"
              className="h-4 w-4 rounded border-gray-300"
              {...register('openInNewTab')}
            />
            <Label htmlFor="openInNewTab" className="font-normal">
              새 탭에서 열기
            </Label>
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
                <Input
                  id="startAt"
                  type="datetime-local"
                  {...register('startAt')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt" className="text-xs text-muted-foreground">
                  종료
                </Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  {...register('endAt')}
                />
              </div>
            </div>
          </div>

          {/* 대체 텍스트 */}
          <div className="space-y-2">
            <Label htmlFor="altText">대체 텍스트 (접근성)</Label>
            <Input
              id="altText"
              placeholder="이미지를 설명하는 텍스트"
              {...register('altText')}
            />
            {errors.altText && (
              <p className="text-xs text-red-500">{errors.altText.message}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEdit ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
