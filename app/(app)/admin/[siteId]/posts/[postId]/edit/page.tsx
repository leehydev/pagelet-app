'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getAdminPost,
  getDraft,
  PostStatus,
  UpdatePostRequest,
  revalidatePost,
  publishPost,
  republishPost,
  deleteDraft,
  unpublishPost,
} from '@/lib/api';
import { useAdminCategories } from '@/hooks/use-categories';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useAutoSave } from '@/hooks/use-auto-save';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/app/post/ThumbnailInput';
import { TiptapEditor, type TiptapEditorRef } from '@/components/app/editor/TiptapEditor';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { toast } from 'sonner';
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

  // 드래프트 조회 (post.hasDraft가 true일 때만)
  const {
    data: draft,
    isLoading: draftLoading,
  } = useQuery({
    queryKey: ['admin', 'draft', siteId, postId],
    queryFn: () => getDraft(siteId, postId),
    enabled: !!siteId && !!postId && post?.hasDraft === true,
  });

  // 카테고리 목록
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useAdminCategories(siteId);

  // 사이트 설정 (revalidation용)
  const { data: siteSettings, error: siteSettingsError } = useAdminSiteSettings(siteId);

  // 자동저장 훅
  const { lastSavedAt, isSaving, hasUnsavedChanges, isEditingDraft, markAsChanged, saveNow, setIsEditingDraft } = useAutoSave({
    siteId,
    postId,
    intervalMs: 5 * 60 * 1000, // 5분
    onSaveSuccess: () => {
      toast.success('자동 저장되었습니다', { duration: 2000 });
      // 드래프트 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
    },
    onSaveError: (err) => {
      console.error('Auto-save failed:', err);
    },
  });

  // 상태 표시 텍스트 계산
  const getStatusText = () => {
    if (isSaving) return { text: '저장 중...', color: 'text-blue-600' };

    if (!post) return null;

    if (post.status === PostStatus.PUBLISHED) {
      if (isEditingDraft || post.hasDraft) {
        return { text: '편집 중 (미발행 변경사항 있음)', color: 'text-amber-600' };
      }
      return { text: '발행됨', color: 'text-green-600' };
    }

    // PRIVATE 상태
    if (isEditingDraft || post.hasDraft) {
      return { text: '작성 중', color: 'text-blue-600' };
    }
    return { text: '비공개', color: 'text-gray-600' };
  };

  const statusInfo = getStatusText();

  // 헤더에 표시할 extra 컴포넌트
  const headerExtra = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {statusInfo && <span className={statusInfo.color}>{statusInfo.text}</span>}
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

  // 게시글/드래프트 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (!post) return;

    // 드래프트가 있으면 드래프트 내용으로 초기화
    if (post.hasDraft && draft) {
      methods.reset({
        title: draft.title || '',
        subtitle: draft.subtitle || '',
        slug: post.slug || '', // slug는 원본 게시글에서
        categoryId: draft.categoryId || '',
        seoTitle: draft.seoTitle || '',
        seoDescription: draft.seoDescription || '',
        ogImageUrl: draft.ogImageUrl || '',
      });
      setIsEditingDraft(true);
    } else {
      // 드래프트가 없으면 게시글 내용으로 초기화
      methods.reset({
        title: post.title || '',
        subtitle: post.subtitle || '',
        slug: post.slug || '',
        categoryId: post.categoryId || '',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        ogImageUrl: post.ogImageUrl || '',
      });
      setIsEditingDraft(false);
    }
  }, [post, draft, methods, setIsEditingDraft]);

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

  // 모달 상태
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [republishModalOpen, setRepublishModalOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);

  // 발행 mutation (PRIVATE + draft -> PUBLISHED)
  const publishMutation = useMutation({
    mutationFn: () => publishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      // ISR 캐시 무효화
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

  // 재발행 mutation (PUBLISHED + draft -> PUBLISHED)
  const republishMutation = useMutation({
    mutationFn: () => republishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      // ISR 캐시 무효화
      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('변경사항이 발행되었습니다');
      router.push(`/admin/${siteId}/posts`);
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '재발행에 실패했습니다'));
    },
  });

  // 변경 취소 mutation (드래프트 삭제)
  const discardMutation = useMutation({
    mutationFn: () => deleteDraft(siteId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      setIsEditingDraft(false);
      toast.success('변경사항이 취소되었습니다');
      // 페이지 새로고침하여 발행본 내용으로 리로드
      window.location.reload();
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '변경 취소에 실패했습니다'));
    },
  });

  // 비공개 전환 mutation (PUBLISHED -> PRIVATE)
  const unpublishMutation = useMutation({
    mutationFn: () => unpublishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      // ISR 캐시 무효화
      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('게시글이 비공개로 전환되었습니다');
      router.push(`/admin/${siteId}/posts`);
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '비공개 전환에 실패했습니다'));
    },
  });

  // 로딩 상태 (게시글 로딩 또는 드래프트가 있는데 드래프트 로딩 중)
  if (postLoading || (post?.hasDraft && draftLoading)) {
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
  if (postError || !post || siteSettingsError) {
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
                    content={
                      post.hasDraft && draft?.contentJson
                        ? draft.contentJson
                        : post.contentJson || undefined
                    }
                    onEditorReady={handleEditorReady}
                  />
                </Field>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="w-full lg:w-64 shrink-0 space-y-4">
              {/* 발행 설정 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">게시글 관리</h3>
                <div className="flex flex-col gap-2">
                  {/* PRIVATE 상태 (새 글 또는 비공개) */}
                  {post.status === PostStatus.PRIVATE && (
                    <>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => setPublishModalOpen(true)}
                        disabled={publishMutation.isPending || !isEditingDraft && !post.hasDraft}
                      >
                        {publishMutation.isPending ? '발행 중...' : '발행'}
                      </Button>
                      {!isEditingDraft && !post.hasDraft && (
                        <p className="text-xs text-gray-500 text-center">
                          내용을 작성하면 발행할 수 있습니다
                        </p>
                      )}
                    </>
                  )}

                  {/* PUBLISHED 상태 */}
                  {post.status === PostStatus.PUBLISHED && (
                    <>
                      {/* 드래프트 있으면 재발행/변경취소 */}
                      {(isEditingDraft || post.hasDraft) && (
                        <>
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => setRepublishModalOpen(true)}
                            disabled={republishMutation.isPending}
                          >
                            {republishMutation.isPending ? '재발행 중...' : '재발행'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setDiscardModalOpen(true)}
                            disabled={discardMutation.isPending}
                          >
                            {discardMutation.isPending ? '취소 중...' : '변경 취소'}
                          </Button>
                        </>
                      )}
                      {/* 비공개 전환 (항상 표시) */}
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => setUnpublishModalOpen(true)}
                        disabled={unpublishMutation.isPending}
                      >
                        {unpublishMutation.isPending ? '처리 중...' : '비공개 전환'}
                      </Button>
                    </>
                  )}

                  {/* 저장 */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={saveNow}
                    disabled={isSaving || !hasUnsavedChanges}
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </Button>

                  {/* 뒤로 가기 */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
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
                  disabled={isSaving}
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

        {/* 발행 확인 모달 */}
        <AlertDialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>게시글 발행</AlertDialogTitle>
              <AlertDialogDescription>
                게시글을 발행하시겠습니까? 발행된 게시글은 모든 방문자가 볼 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? '발행 중...' : '발행'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 재발행 확인 모달 */}
        <AlertDialog open={republishModalOpen} onOpenChange={setRepublishModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>변경사항 재발행</AlertDialogTitle>
              <AlertDialogDescription>
                편집한 내용을 발행하시겠습니까? 기존 발행본이 새 내용으로 교체됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => republishMutation.mutate()}
                disabled={republishMutation.isPending}
              >
                {republishMutation.isPending ? '재발행 중...' : '재발행'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 변경 취소 확인 모달 */}
        <AlertDialog open={discardModalOpen} onOpenChange={setDiscardModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>변경사항 취소</AlertDialogTitle>
              <AlertDialogDescription>
                편집 중인 내용을 취소하시겠습니까? 현재 발행된 내용은 유지됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>돌아가기</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => discardMutation.mutate()}
                disabled={discardMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {discardMutation.isPending ? '취소 중...' : '변경 취소'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 비공개 전환 확인 모달 */}
        <AlertDialog open={unpublishModalOpen} onOpenChange={setUnpublishModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>비공개로 전환</AlertDialogTitle>
              <AlertDialogDescription>
                {post.hasDraft || isEditingDraft
                  ? '게시글을 비공개로 전환하시겠습니까? 편집 중인 내용이 적용되어 비공개 상태가 됩니다.'
                  : '게시글을 비공개로 전환하시겠습니까? 방문자가 더 이상 볼 수 없게 됩니다.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {unpublishMutation.isPending ? '처리 중...' : '비공개 전환'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </FormProvider>
  );
}
