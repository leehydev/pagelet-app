'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '@/hooks/use-posts';
import { PostStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/form/ValidationInput';
import { ValidationTextarea } from '@/components/form/ValidationTextarea';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/post/thumbnail-input';
import { AxiosError } from 'axios';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import type { FieldErrors } from 'react-hook-form';

// Zod 스키마 정의
const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(500, '제목은 500자 이하여야 합니다').trim(),
  slug: z
    .string()
    .max(255, 'slug는 255자 이하여야 합니다')
    .regex(/^[a-z0-9-]*$/, 'slug는 영소문자, 숫자, 하이픈만 사용할 수 있습니다')
    .optional()
    .or(z.literal('')),
  content: z.string().min(1, '내용을 입력해주세요').trim(),
  seo_title: z.string().max(255, 'SEO 제목은 255자 이하여야 합니다').optional().or(z.literal('')),
  seo_description: z
    .string()
    .max(500, 'SEO 설명은 500자 이하여야 합니다')
    .optional()
    .or(z.literal('')),
  og_image_url: z.string().url('올바른 URL 형식이어야 합니다').optional().or(z.literal('')),
});

type PostFormData = z.infer<typeof postSchema>;

export default function NewPostPage() {
  const router = useRouter();
  const createPost = useCreatePost();

  const [showSeo, setShowSeo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ogImageUrl, setOgImageUrl] = useState('');

  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      seo_title: '',
      seo_description: '',
      og_image_url: '',
    },
  });

  const handleSubmit = async (status: PostStatus) => {
    setError(null);

    try {
      const data = methods.getValues();
      await createPost.mutateAsync({
        title: data.title.trim(),
        slug: data.slug?.trim() || undefined,
        content: data.content.trim(),
        status,
        seo_title: data.seo_title?.trim() || undefined,
        seo_description: data.seo_description?.trim() || undefined,
        og_image_url: ogImageUrl.trim() || undefined,
      });

      router.push('/admin/posts');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>;
      if (axiosError.response?.status === 409) {
        methods.setError('slug', {
          type: 'manual',
          message: '이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.',
        });
        setError('이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.');
        // slug 에러 발생 시 해당 필드로 스크롤
        setTimeout(() => {
          scrollToFirstError('이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.');
        }, 150);
      } else {
        setError(axiosError.response?.data?.message || '게시글 저장에 실패했습니다.');
      }
    }
  };

  const onError = (errors: FieldErrors<PostFormData>) => {
    // onError에서 받은 errors를 직접 사용하여 스크롤
    // 더 긴 지연 시간을 주어 React가 완전히 렌더링할 시간을 확보
    setTimeout(() => {
      scrollToFirstError(errors);
    }, 150);
  };

  return (
    <FormProvider {...methods}>
      <div className="p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 게시글 작성</h1>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* 제목 */}
              <ValidationInput
                name="title"
                label="제목"
                type="text"
                placeholder="게시글 제목을 입력하세요"
                maxLength={500}
                required
              />

              {/* Slug */}
              <Controller
                name="slug"
                control={methods.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor="slug">URL Slug</FieldLabel>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        {...field}
                        id="slug"
                        type="text"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase();
                          field.onChange(value);
                        }}
                        placeholder="url-friendly-slug (선택사항, 비워두면 자동 생성)"
                        maxLength={255}
                        aria-invalid={!!fieldState.error}
                      />
                      <FieldDescription>영소문자, 숫자, 하이픈만 사용 가능합니다.</FieldDescription>
                      <FieldError>{fieldState.error?.message || ''}</FieldError>
                    </div>
                  </Field>
                )}
              />

              {/* 내용 */}
              <ValidationTextarea
                name="content"
                label="내용"
                placeholder="게시글 내용을 입력하세요"
                rows={12}
                required
              />

              {/* SEO 섹션 (토글) */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span className="mr-2">{showSeo ? '▼' : '▶'}</span>
                  SEO 설정 (선택)
                </button>

                {showSeo && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                    <ValidationInput
                      name="seo_title"
                      label="SEO 제목"
                      type="text"
                      placeholder="검색 엔진에 표시될 제목"
                      maxLength={255}
                    />
                    <ValidationTextarea
                      name="seo_description"
                      label="SEO 설명"
                      placeholder="검색 결과에 표시될 설명"
                      rows={3}
                      maxLength={500}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        썸네일 이미지
                      </label>
                      <ThumbnailInput
                        value={ogImageUrl}
                        onChange={(url) => setOgImageUrl(url || '')}
                        disabled={createPost.isPending}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        게시글 썸네일로 사용됩니다. URL 입력 또는 직접 업로드가 가능합니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createPost.isPending}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    methods.handleSubmit(() => handleSubmit(PostStatus.DRAFT), onError)();
                  }}
                  disabled={createPost.isPending}
                >
                  {createPost.isPending ? '저장 중...' : '임시 저장'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    methods.handleSubmit(() => handleSubmit(PostStatus.PUBLISHED), onError)();
                  }}
                  disabled={createPost.isPending}
                >
                  {createPost.isPending ? '발행 중...' : '발행하기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
