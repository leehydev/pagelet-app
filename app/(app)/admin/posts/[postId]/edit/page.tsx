'use client';

/**
 * 게시글 수정 페이지
 *
 * 저장 로직 (수동 저장 방식):
 * - [등록] 버튼만 표시 (PUT으로 전체 교체)
 * - 저장 버튼 없음 (임시저장 없음)
 * - 저장된 글 불러오기 버튼 없음
 * - 자동저장 없음
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSiteId } from '@/stores/site-store';
import {
  getAdminPost,
  PostStatus,
  ReplacePostRequest,
  revalidatePost,
  replaceAdminPost,
} from '@/lib/api';
import { useAdminCategories } from '@/hooks/use-categories';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useLeaveConfirm } from '@/hooks/use-leave-confirm';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/app/post/ThumbnailInput';
import { PostStatusRadio } from '@/components/app/post/PostStatusRadio';
import { TiptapEditor, type TiptapEditorRef } from '@/components/app/editor/TiptapEditor';
import { LeaveConfirmModal } from '@/components/app/post/LeaveConfirmModal';
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import { AxiosError } from 'axios';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { toast } from 'sonner';

// ============================================================================
// 스키마 & 타입
// ============================================================================

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

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function EditPostPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { postId } = params;

  // --------------------------------------------------------------------------
  // 로컬 상태
  // --------------------------------------------------------------------------

  const editorRef = useRef<TiptapEditorRef>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PostStatus>(PostStatus.PRIVATE);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // --------------------------------------------------------------------------
  // 이탈 감지
  // --------------------------------------------------------------------------

  const { allowLeave, isLeaveAllowed } = useLeaveConfirm({
    hasChanges,
    mode: 'edit-post',
    onBrowserBack: () => setShowLeaveModal(true),
  });

  // --------------------------------------------------------------------------
  // 데이터 조회
  // --------------------------------------------------------------------------

  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ['admin', 'post', siteId, postId],
    queryFn: () => getAdminPost(siteId, postId),
    enabled: !!siteId && !!postId,
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useAdminCategories(siteId);

  const { data: siteSettings, error: siteSettingsError } = useAdminSiteSettings(siteId);

  // --------------------------------------------------------------------------
  // 폼 설정
  // --------------------------------------------------------------------------

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

  // 폼 초기화 (post 데이터 로드 시)
  useEffect(() => {
    if (!post || initialDataLoaded) return;

    methods.reset({
      title: post.title || '',
      subtitle: post.subtitle || '',
      slug: post.slug || '',
      categoryId: post.categoryId || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      ogImageUrl: post.ogImageUrl || '',
    });

    setSelectedStatus(post.status);
    setInitialDataLoaded(true);
  }, [post, methods, initialDataLoaded]);

  const watchedOgImageUrl = useWatch({
    control: methods.control,
    name: 'ogImageUrl',
  });

  // 변경 감지
  const watchedValues = useWatch({ control: methods.control });

  useEffect(() => {
    if (editorReady && initialDataLoaded) {
      setHasChanges(true);
    }
  }, [watchedValues, editorReady, initialDataLoaded]);

  const handleEditorReady = useCallback(() => {
    setEditorReady(true);
  }, []);

  // --------------------------------------------------------------------------
  // 데이터 수집
  // --------------------------------------------------------------------------

  const collectFormData = useCallback((): ReplacePostRequest | null => {
    const data = methods.getValues();
    const editor = editorRef.current;
    if (!editor) return null;

    const contentJson = editor.getJSON();
    if (!contentJson) return null;

    const trimOrNull = (value: string | undefined): string | null =>
      value?.trim() ? value.trim() : null;

    return {
      title: data.title?.trim() || '',
      subtitle: data.subtitle?.trim() || '',
      slug: data.slug?.trim() || null,
      contentJson,
      contentHtml: editor.getHTML(),
      contentText: editor.getText().trim(),
      status: selectedStatus,
      categoryId: data.categoryId?.trim() || null,
      seoTitle: trimOrNull(data.seoTitle),
      seoDescription: trimOrNull(data.seoDescription),
      ogImageUrl: trimOrNull(data.ogImageUrl),
    };
  }, [methods, selectedStatus]);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  // PUT으로 전체 교체
  const saveMutation = useMutation({
    mutationFn: (data: ReplacePostRequest) => replaceAdminPost(siteId, postId, data),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });

      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }

      toast.success(
        updatedPost.status === PostStatus.PUBLISHED ? '게시글이 발행되었습니다' : '저장되었습니다',
      );
      allowLeave();
      router.push('/admin/posts');
    },
    onError: (err) => {
      const errorCode = getErrorCode(err);
      const errorMessage = getErrorDisplayMessage(err, '저장에 실패했습니다');

      if (errorCode === 'POST_002' || (err instanceof AxiosError && err.response?.status === 409)) {
        methods.setError('slug', { type: 'manual', message: errorMessage });
        setError(errorMessage);
        setTimeout(() => scrollToFirstError(errorMessage), 150);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
  });

  // --------------------------------------------------------------------------
  // 핸들러
  // --------------------------------------------------------------------------

  /** 등록 버튼 */
  const handleSave = async () => {
    setError(null);

    const isValid = await methods.trigger();
    if (!isValid) {
      setTimeout(() => scrollToFirstError(methods.formState.errors), 150);
      return;
    }

    const data = collectFormData();
    if (!data) {
      toast.error('에디터가 준비되지 않았습니다');
      return;
    }

    const isEmpty =
      !data.contentJson?.content ||
      (Array.isArray(data.contentJson.content) &&
        (data.contentJson.content.length === 0 ||
          (data.contentJson.content.length === 1 &&
            data.contentJson.content[0].type === 'paragraph' &&
            (!data.contentJson.content[0].content ||
              data.contentJson.content[0].content.length === 0))));

    if (isEmpty || !data.contentText) {
      toast.error('내용을 입력해주세요');
      return;
    }

    saveMutation.mutate(data);
  };

  /** 네비게이션 시도 */
  const handleNavigate = (path: string) => {
    if (hasChanges && !isLeaveAllowed) {
      setPendingNavigation(path);
      setShowLeaveModal(true);
    } else {
      router.push(path);
    }
  };

  /** 저장하지 않고 이탈 */
  const handleLeaveWithoutSave = () => {
    allowLeave();
    setShowLeaveModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    } else {
      router.back();
    }
  };

  /** 이탈 취소 */
  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    setPendingNavigation(null);
  };

  // --------------------------------------------------------------------------
  // 로딩/에러 상태
  // --------------------------------------------------------------------------

  if (postLoading) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" />
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded w-3/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </>
    );
  }

  if (postError || !post || siteSettingsError) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 mb-4">게시글을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => router.push('/admin/posts')}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </>
    );
  }

  const isPending = saveMutation.isPending;

  // --------------------------------------------------------------------------
  // 상태 표시
  // --------------------------------------------------------------------------

  const getStatusText = () => {
    if (isPending) return { text: '저장 중...', color: 'text-blue-600' };

    if (post.status === PostStatus.PUBLISHED) {
      return { text: '발행됨', color: 'text-green-600' };
    }

    return { text: '비공개', color: 'text-gray-600' };
  };

  const statusInfo = getStatusText();

  const headerExtra = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className={statusInfo.color}>{statusInfo.text}</span>
      {hasChanges && !isPending && <span className="text-orange-600">• 변경사항 있음</span>}
    </div>
  );

  // --------------------------------------------------------------------------
  // 렌더링
  // --------------------------------------------------------------------------

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
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <ValidationInput
                  name="title"
                  label="제목"
                  type="text"
                  placeholder="게시글 제목을 입력하세요"
                  maxLength={500}
                  required
                />
                <ValidationInput
                  name="subtitle"
                  label="부제목"
                  type="text"
                  placeholder="게시글 부제목을 입력하세요"
                  maxLength={500}
                  required
                />
                <Field>
                  <FieldLabel>내용</FieldLabel>
                  <TiptapEditor
                    ref={editorRef}
                    siteId={siteId}
                    postId={postId}
                    content={post.contentJson || undefined}
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

                {/* 공개 여부 */}
                <div className="mb-4">
                  <PostStatusRadio
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? '등록 중...' : '등록'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleNavigate('/admin/posts')}
                    disabled={isPending}
                  >
                    돌아가기
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
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
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
                  postId={postId}
                  value={watchedOgImageUrl || ''}
                  onChange={(url) => {
                    methods.setValue('ogImageUrl', url || '');
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

        {/* 이탈 확인 모달 */}
        <LeaveConfirmModal
          open={showLeaveModal}
          onOpenChange={setShowLeaveModal}
          mode="edit-post"
          onLeaveWithoutSave={handleLeaveWithoutSave}
          onCancel={handleCancelLeave}
        />
      </>
    </FormProvider>
  );
}
