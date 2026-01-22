'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAdminPost, PostStatus, UpdatePostRequest, revalidatePost } from '@/lib/api';
import { useAdminCategories } from '@/hooks/use-categories';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useAutoSave } from '@/hooks/use-auto-save';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/app/post/ThumbnailInput';
import { TiptapEditor, type TiptapEditorRef } from '@/components/app/editor/TiptapEditor';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
import type { FieldErrors } from 'react-hook-form';
import { AxiosError } from 'axios';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { toast } from 'sonner';
import { updateAdminPost } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

export default function EditPostPage() {
  const params = useParams<{ siteId: string; postId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { siteId, postId } = params;

  const editorRef = useRef<TiptapEditorRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  // 게시글 조회
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ['admin', 'post', siteId, postId],
    queryFn: () => getAdminPost(siteId, postId),
    enabled: !!siteId && !!postId,
  });

  // 카테고리 목록
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories(siteId);

  // 사이트 설정 (revalidation용)
  const { data: siteSettings } = useAdminSiteSettings(siteId);

  // 자동저장 훅
  const { lastSavedAt, isSaving, hasUnsavedChanges, markAsChanged } = useAutoSave({
    siteId,
    postId,
    intervalMs: 5 * 60 * 1000, // 5분
    onSaveSuccess: () => {
      toast.success('자동 저장되었습니다', { duration: 2000 });
    },
    onSaveError: (err) => {
      console.error('Auto-save failed:', err);
    },
  });

  // 헤더에 표시할 extra 컴포넌트
  const headerExtra = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {isSaving && <span className="text-blue-600">저장 중...</span>}
      {!isSaving && lastSavedAt && (
        <span>
          마지막 저장:{' '}
          {lastSavedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      {hasUnsavedChanges && !isSaving && (
        <span className="text-orange-600">저장되지 않은 변경사항</span>
      )}
    </div>
  );

  const methods = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      slug: '',
      categoryId: '',
      seoTitle: '',
      seoDescription: '',
      ogImageUrl: '',
    },
  });

  // 게시글 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (post) {
      methods.reset({
        title: post.title || '',
        subtitle: post.subtitle || '',
        slug: post.slug || '',
        categoryId: post.categoryId || '',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        ogImageUrl: post.ogImageUrl || '',
      });
    }
  }, [post, methods]);

  // 썸네일 값 watch (useWatch 사용 - React Compiler 호환)
  const watchedOgImageUrl = useWatch({
    control: methods.control,
    name: 'ogImageUrl',
  });

  // 에디터 내용을 포함한 현재 데이터 수집
  const collectFormData = useCallback((): UpdatePostRequest | null => {
    const data = methods.getValues();
    const editor = editorRef.current;

    if (!editor) return null;

    const contentJson = editor.getJSON();
    if (!contentJson) return null;

    const contentHtml = editor.getHTML();
    const contentText = editor.getText().trim();

    return {
      title: data.title?.trim(),
      subtitle: data.subtitle?.trim(),
      slug: data.slug?.trim() || undefined,
      contentJson,
      contentHtml,
      contentText,
      categoryId: data.categoryId?.trim() || undefined,
      seoTitle: data.seoTitle?.trim() || undefined,
      seoDescription: data.seoDescription?.trim() || undefined,
      ogImageUrl: data.ogImageUrl?.trim() || undefined,
    };
  }, [methods]);

  // 폼 필드 변경 감지 (useWatch 사용 - React Compiler 호환)
  const watchedValues = useWatch({ control: methods.control });

  useEffect(() => {
    if (!editorReady) return;

    const data = collectFormData();
    if (data) {
      markAsChanged(data);
    }
  }, [watchedValues, editorReady, collectFormData, markAsChanged]);

  // 에디터 준비 완료 콜백
  const handleEditorReady = useCallback(() => {
    setEditorReady(true);
  }, []);

  // 수동 저장 mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePostRequest & { status?: PostStatus }) =>
      updateAdminPost(siteId, postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
    },
  });

  const handleSubmit = async (status: PostStatus) => {
    setError(null);

    try {
      const formData = collectFormData();
      if (!formData) {
        toast.error('에디터를 불러올 수 없습니다');
        return;
      }

      // 빈 문서 체크
      const contentJson = formData.contentJson;
      const isEmpty =
        !contentJson?.content ||
        (Array.isArray(contentJson.content) &&
          (contentJson.content.length === 0 ||
            (contentJson.content.length === 1 &&
              contentJson.content[0].type === 'paragraph' &&
              (!contentJson.content[0].content || contentJson.content[0].content.length === 0))));

      if (isEmpty) {
        toast.error('내용을 입력해주세요');
        return;
      }

      if (!formData.contentText) {
        toast.error('내용을 입력해주세요');
        return;
      }

      const updatedPost = await updateMutation.mutateAsync({
        ...formData,
        status,
      });

      // 발행 또는 상태 변경 시 ISR 캐시 무효화
      if (siteSettings?.slug && updatedPost.slug) {
        await revalidatePost(siteSettings.slug, updatedPost.slug);
      }

      if (status === PostStatus.PUBLISHED) {
        toast.success('게시글이 발행되었습니다');
      } else {
        toast.success('게시글이 저장되었습니다');
      }

      router.push(`/admin/${siteId}/posts`);
    } catch (err) {
      const errorCode = getErrorCode(err);
      const errorMessage = getErrorDisplayMessage(err, '게시글 저장에 실패했습니다.');

      if (errorCode === 'POST_002' || (err instanceof AxiosError && err.response?.status === 409)) {
        methods.setError('slug', {
          type: 'manual',
          message: errorMessage,
        });
        setError(errorMessage);
        setTimeout(() => {
          scrollToFirstError(errorMessage);
        }, 150);
      } else {
        setError(errorMessage);
      }
    }
  };

  const onError = (errors: FieldErrors<PostFormData>) => {
    setTimeout(() => {
      scrollToFirstError(errors);
    }, 150);
  };

  // 로딩 상태
  if (postLoading) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" extra={headerExtra} />
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  // 에러 상태
  if (postError || !post) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 mb-4">게시글을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => router.push(`/admin/${siteId}/posts`)}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <FormProvider {...methods}>
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" extra={headerExtra} />
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
                  <TiptapEditor
                    ref={editorRef}
                    siteId={siteId}
                    content={post.contentJson || undefined}
                    onEditorReady={handleEditorReady}
                  />
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
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? '발행 중...' : '발행하기'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      methods.handleSubmit(() => handleSubmit(PostStatus.DRAFT), onError)();
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? '저장 중...' : '임시 저장'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={updateMutation.isPending}
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
                      <p className="text-xs text-gray-500">영소문자, 숫자, 하이픈만 사용</p>
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
                  siteId={siteId}
                  value={watchedOgImageUrl || ''}
                  onChange={(url) => {
                    methods.setValue('ogImageUrl', url || '');
                    const data = collectFormData();
                    if (data) {
                      markAsChanged({ ...data, ogImageUrl: url || undefined });
                    }
                  }}
                  disabled={updateMutation.isPending}
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
      </>
    </FormProvider>
  );
}
