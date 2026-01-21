'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '@/hooks/use-posts';
import { useAdminCategories } from '@/hooks/use-categories';
import { PostStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/post/ThumbnailInput';
import { TiptapEditor, type TiptapEditorRef } from '@/components/editor/TiptapEditor';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
import type { FieldErrors } from 'react-hook-form';
import { AxiosError } from 'axios';
import { useAdminHeader } from '@/components/layout/AdminPageHeader';
import { toast } from 'sonner';

// Zod 스키마 정의
const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(500, '제목은 500자 이하여야 합니다').trim(),
  subtitle: z
    .string()
    .min(1, '부제목을 입력해주세요')
    .max(500, '부제목은 500자 이하여야 합니다')
    .trim(),
  slug: z
    .string()
    .max(255, 'slug는 255자 이하여야 합니다')
    .regex(/^[a-z0-9-]*$/, 'slug는 영소문자, 숫자, 하이픈만 사용할 수 있습니다')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  seoTitle: z.string().max(255, 'SEO 제목은 255자 이하여야 합니다').optional().or(z.literal('')),
  seoDescription: z
    .string()
    .max(500, 'SEO 설명은 500자 이하여야 합니다')
    .optional()
    .or(z.literal('')),
  ogImageUrl: z.string().url('올바른 URL 형식이어야 합니다').optional().or(z.literal('')),
});

type PostFormData = z.infer<typeof postSchema>;

export default function NewPostPage() {
  const router = useRouter();
  const createPost = useCreatePost();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const editorRef = useRef<TiptapEditorRef>(null);

  const [error, setError] = useState<string | null>(null);
  const [ogImageUrl, setOgImageUrl] = useState('');

  // 기본 카테고리 찾기 (미분류)
  const defaultCategory = categories?.find((c) => c.slug === 'uncategorized');

  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      slug: '',
      categoryId: defaultCategory?.id || '',
      seoTitle: '',
      seoDescription: '',
      ogImageUrl: '',
    },
  });

  const handleSubmit = async (status: PostStatus) => {
    setError(null);

    try {
      const data = methods.getValues();

      // 에디터에서 내용 추출
      const editor = editorRef.current;
      if (!editor) {
        toast.error('에디터를 불러올 수 없습니다');
        return;
      }

      const contentJson = editor.getJSON();
      if (!contentJson) {
        toast.error('내용을 입력해주세요');
        return;
      }

      // 빈 문서 체크 (기본 tiptap 문서 구조)
      const isEmpty =
        !contentJson.content ||
        (Array.isArray(contentJson.content) &&
          (contentJson.content.length === 0 ||
            (contentJson.content.length === 1 &&
              contentJson.content[0].type === 'paragraph' &&
              (!contentJson.content[0].content || contentJson.content[0].content.length === 0))));

      if (isEmpty) {
        toast.error('내용을 입력해주세요');
        return;
      }

      const contentHtml = editor.getHTML();
      const contentText = editor.getText().trim();

      if (!contentText) {
        toast.error('내용을 입력해주세요');
        return;
      }

      await createPost.mutateAsync({
        title: data.title.trim(),
        subtitle: data.subtitle.trim(),
        slug: data.slug?.trim() || undefined,
        contentJson,
        contentHtml,
        contentText,
        status,
        categoryId: data.categoryId?.trim() || undefined,
        seoTitle: data.seoTitle?.trim() || undefined,
        seoDescription: data.seoDescription?.trim() || undefined,
        ogImageUrl: ogImageUrl.trim() || undefined,
      });

      router.push('/admin/posts');
    } catch (err) {
      const errorCode = getErrorCode(err);
      const errorMessage = getErrorDisplayMessage(err, '게시글 저장에 실패했습니다.');

      // POST_002 (slug 중복) 또는 409 상태 코드인 경우 slug 필드에 에러 표시
      if (errorCode === 'POST_002' || (err instanceof AxiosError && err.response?.status === 409)) {
        methods.setError('slug', {
          type: 'manual',
          message: errorMessage,
        });
        setError(errorMessage);
        // slug 에러 발생 시 해당 필드로 스크롤
        setTimeout(() => {
          scrollToFirstError(errorMessage);
        }, 150);
      } else {
        setError(errorMessage);
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

  useAdminHeader({ breadcrumb: 'Management', title: 'New Post' });

  return (
    <FormProvider {...methods}>
      <div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm max-w-7xl">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 min-w-0">
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
                {/* 제목 */}
                <ValidationInput
                  name="title"
                  label="제목"
                  type="text"
                  placeholder="게시글 제목을 입력하세요"
                  maxLength={500}
                  required
                />

                {/* 부제목 */}
                <ValidationInput
                  name="subtitle"
                  label="부제목"
                  type="text"
                  placeholder="게시글 부제목을 입력하세요"
                  maxLength={500}
                  required
                />

                {/* 내용 */}
                <Field>
                  <FieldLabel>내용</FieldLabel>
                  <TiptapEditor ref={editorRef} />
                </Field>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              {/* 발행 설정 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">발행</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      methods.handleSubmit(() => handleSubmit(PostStatus.PUBLISHED), onError)();
                    }}
                    disabled={createPost.isPending}
                  >
                    {createPost.isPending ? '발행 중...' : '발행하기'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      methods.handleSubmit(() => handleSubmit(PostStatus.DRAFT), onError)();
                    }}
                    disabled={createPost.isPending}
                  >
                    {createPost.isPending ? '저장 중...' : '임시 저장'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={createPost.isPending}
                  >
                    취소
                  </Button>
                </div>
              </div>

              {/* 카테고리 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">카테고리</h3>
                <Controller
                  name="categoryId"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1.5">
                      <select
                        {...field}
                        id="categoryId"
                        disabled={categoriesLoading}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={!!fieldState.error}
                      >
                        {categoriesLoading ? (
                          <option>불러오는 중...</option>
                        ) : (
                          <>
                            <option value="">미분류</option>
                            {categories?.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {fieldState.error && (
                        <p className="text-sm text-red-500">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* URL Slug */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">URL Slug</h3>
                <Controller
                  name="slug"
                  control={methods.control}
                  render={({ field, fieldState }) => (
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
                        placeholder="url-friendly-slug"
                        maxLength={255}
                        aria-invalid={!!fieldState.error}
                      />
                      <p className="text-xs text-gray-500">영소문자, 숫자, 하이픈만 사용 (비워두면 자동 생성)</p>
                      {fieldState.error && (
                        <p className="text-sm text-red-500">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* 썸네일 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">썸네일</h3>
                <ThumbnailInput
                  value={ogImageUrl}
                  onChange={(url) => setOgImageUrl(url || '')}
                  disabled={createPost.isPending}
                />
              </div>

              {/* SEO 설정 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">SEO 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      SEO 제목
                    </label>
                    <Input
                      {...methods.register('seoTitle')}
                      type="text"
                      placeholder="검색 엔진에 표시될 제목"
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      SEO 설명
                    </label>
                    <textarea
                      {...methods.register('seoDescription')}
                      placeholder="검색 결과에 표시될 설명"
                      rows={3}
                      maxLength={500}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
