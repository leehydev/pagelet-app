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
import { ValidationTextarea } from '@/components/form/ValidationTextarea';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/post/ThumbnailInput';
import { TiptapEditor, type TiptapEditorRef } from '@/components/editor/TiptapEditor';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
import type { FieldErrors } from 'react-hook-form';
import { AxiosError } from 'axios';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
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

  const [showSeo, setShowSeo] = useState(false);
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

  return (
    <FormProvider {...methods}>
      <div>
        <AdminPageHeader breadcrumb="Management" title="New Post" />
        <div className="p-6">
          <div className="max-w-7xl">
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

                {/* 부제목 */}
                <ValidationInput
                  name="subtitle"
                  label="부제목"
                  type="text"
                  placeholder="게시글 부제목을 입력하세요"
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
                        <FieldDescription>
                          영소문자, 숫자, 하이픈만 사용 가능합니다.
                        </FieldDescription>
                        <FieldError>{fieldState.error?.message || ''}</FieldError>
                      </div>
                    </Field>
                  )}
                />

                {/* 내용 */}
                <Field>
                  <FieldLabel>내용</FieldLabel>
                  <TiptapEditor ref={editorRef} />
                </Field>

                {/* 카테고리 선택 */}
                <Controller
                  name="categoryId"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor="categoryId">카테고리</FieldLabel>
                      <div className="flex flex-col gap-1.5">
                        <select
                          {...field}
                          id="categoryId"
                          disabled={categoriesLoading}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-invalid={!!fieldState.error}
                        >
                          {categoriesLoading ? (
                            <option>카테고리 불러오는 중...</option>
                          ) : (
                            <>
                              <option value="">선택 안 함 (기본 카테고리 사용)</option>
                              {categories?.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                        <FieldDescription>
                          카테고리를 선택하지 않으면 기본 카테고리(미분류)가 할당됩니다.
                        </FieldDescription>
                        <FieldError>{fieldState.error?.message || ''}</FieldError>
                      </div>
                    </Field>
                  )}
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
                        name="seoTitle"
                        label="SEO 제목"
                        type="text"
                        placeholder="검색 엔진에 표시될 제목"
                        maxLength={255}
                      />
                      <ValidationTextarea
                        name="seoDescription"
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
      </div>
    </FormProvider>
  );
}
