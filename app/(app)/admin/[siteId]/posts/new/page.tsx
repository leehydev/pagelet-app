'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminCategories } from '@/hooks/use-categories';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useAutoSave } from '@/hooks/use-auto-save';
import {
  PostStatus,
  revalidatePost,
  createAdminPost,
  publishPost,
  CreatePostRequest,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/app/post/ThumbnailInput';
import { TiptapEditor, type TiptapEditorRef } from '@/components/app/editor/TiptapEditor';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
import { AxiosError } from 'axios';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { toast } from 'sonner';

// Zod 스키마 정의 (발행 시 검증용)
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
  const params = useParams();
  const queryClient = useQueryClient();
  const siteId = params.siteId as string;

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useAdminCategories(siteId);
  const { data: siteSettings } = useAdminSiteSettings(siteId);
  const editorRef = useRef<TiptapEditorRef>(null);
  const [editorReady, setEditorReady] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

  // 자동저장 훅
  const {
    lastSavedAt,
    isSaving,
    hasUnsavedChanges,
    markAsChanged,
    saveNow,
    getPostId,
  } = useAutoSave({
    siteId,
    postId: createdPostId,
    intervalMs: 5 * 60 * 1000, // 5분
    onSaveSuccess: () => {
      toast.success('자동 저장되었습니다', { duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
    },
    onSaveError: (err) => {
      console.error('Auto-save failed:', err);
      toast.error('자동 저장에 실패했습니다');
    },
    onPostCreated: (postId) => {
      setCreatedPostId(postId);
      // URL 변경 없이 내부 상태만 업데이트 (사용자 경험 유지)
    },
  });

  // 상태 표시 텍스트
  const getStatusText = () => {
    if (isSaving) return { text: '저장 중...', color: 'text-blue-600' };
    if (createdPostId) {
      return { text: '작성 중', color: 'text-blue-600' };
    }
    return { text: '새 글', color: 'text-gray-600' };
  };

  const statusInfo = getStatusText();

  // 헤더 extra
  const headerExtra = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className={statusInfo.color}>{statusInfo.text}</span>
      {!isSaving && lastSavedAt && (
        <span className="text-gray-400">
          ({lastSavedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 저장됨)
        </span>
      )}
      {hasUnsavedChanges && !isSaving && (
        <span className="text-orange-600">• 저장 대기 중</span>
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

  // 썸네일 값 watch
  const watchedOgImageUrl = useWatch({
    control: methods.control,
    name: 'ogImageUrl',
  });

  // 에디터 내용을 포함한 현재 데이터 수집
  const collectFormData = useCallback(() => {
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
      contentJson,
      contentHtml,
      contentText,
      categoryId: data.categoryId?.trim() || undefined,
      seoTitle: data.seoTitle?.trim() || undefined,
      seoDescription: data.seoDescription?.trim() || undefined,
      ogImageUrl: data.ogImageUrl?.trim() || undefined,
    };
  }, [methods]);

  // 폼 필드 변경 감지
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

  // 발행 mutation (postId가 있을 때)
  const publishMutation = useMutation({
    mutationFn: (postId: string) => publishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('게시글이 발행되었습니다');
      router.push(`/admin/${siteId}/posts`);
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '발행에 실패했습니다'));
    },
  });

  // 직접 발행 mutation (postId가 없을 때)
  const createAndPublishMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(siteId, data),
    onSuccess: async (createdPost) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (siteSettings?.slug && createdPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, createdPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('게시글이 발행되었습니다');
      router.push(`/admin/${siteId}/posts`);
    },
    onError: (err) => {
      const errorCode = getErrorCode(err);
      const errorMessage = getErrorDisplayMessage(err, '게시글 발행에 실패했습니다.');

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
    },
  });

  // 발행 처리
  const handlePublish = async () => {
    setError(null);

    // 폼 검증
    const isValid = await methods.trigger();
    if (!isValid) {
      const errors = methods.formState.errors;
      setTimeout(() => {
        scrollToFirstError(errors);
      }, 150);
      return;
    }

    const data = methods.getValues();
    const editor = editorRef.current;

    if (!editor) {
      toast.error('에디터를 불러올 수 없습니다');
      return;
    }

    const contentJson = editor.getJSON();
    const contentHtml = editor.getHTML();
    const contentText = editor.getText().trim();

    // 내용 검증
    const isEmpty =
      !contentJson?.content ||
      (Array.isArray(contentJson.content) &&
        (contentJson.content.length === 0 ||
          (contentJson.content.length === 1 &&
            contentJson.content[0].type === 'paragraph' &&
            (!contentJson.content[0].content || contentJson.content[0].content.length === 0))));

    if (isEmpty || !contentText) {
      toast.error('내용을 입력해주세요');
      return;
    }

    const currentPostId = getPostId();

    if (currentPostId) {
      // postId가 있으면 publishPost 호출
      publishMutation.mutate(currentPostId);
    } else {
      // postId가 없으면 바로 PUBLISHED로 생성
      createAndPublishMutation.mutate({
        title: data.title.trim(),
        subtitle: data.subtitle.trim(),
        slug: data.slug?.trim() || undefined,
        contentJson,
        contentHtml,
        contentText,
        status: PostStatus.PUBLISHED,
        categoryId: data.categoryId?.trim() || undefined,
        seoTitle: data.seoTitle?.trim() || undefined,
        seoDescription: data.seoDescription?.trim() || undefined,
        ogImageUrl: data.ogImageUrl?.trim() || undefined,
      });
    }
  };

  // 저장 처리 (수동)
  const handleSave = async () => {
    await saveNow();
    toast.success('저장되었습니다');
  };

  const isPending = isSaving || publishMutation.isPending || createAndPublishMutation.isPending;

  return (
    <FormProvider {...methods}>
      <>
        <AdminPageHeader breadcrumb="Management" title="New Post" extra={headerExtra} />
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm max-w-7xl">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 min-w-0">
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
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
                    onEditorReady={handleEditorReady}
                  />
                </Field>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="w-full lg:w-64 shrink-0 space-y-4">
              {/* 게시글 관리 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">게시글 관리</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handlePublish}
                    disabled={isPending}
                  >
                    {publishMutation.isPending || createAndPublishMutation.isPending
                      ? '발행 중...'
                      : '발행'}
                  </Button>

                  {/* 저장 */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSave}
                    disabled={isPending || !hasUnsavedChanges}
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </Button>

                  {/* 취소 */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={isPending}
                  >
                    취소
                  </Button>
                </div>
              </div>

              {/* 카테고리 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">카테고리</h3>
                {categoriesError ? (
                  <div className="text-sm text-red-500">카테고리 목록을 불러올 수 없습니다</div>
                ) : (
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
                )}
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
                      <p className="text-xs text-gray-500">
                        영소문자, 숫자, 하이픈만 사용 (비워두면 자동 생성)
                      </p>
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
                  disabled={isPending}
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
