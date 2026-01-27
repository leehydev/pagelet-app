'use client';

/**
 * 게시글 수정 페이지
 *
 * 저장 로직:
 * - PRIVATE 상태: 5분마다 post에 직접 저장 (드래프트 사용 안함)
 * - PUBLIC 상태: 5분마다 draft로 저장 (발행본 유지)
 *
 * 드래프트 처리:
 * - PUBLIC 진입 시 draft 있으면 → 불러올지 확인 모달
 * - PRIVATE 진입 시 draft 있으면 → 불러올지 확인 모달 (불러오면 post에 저장 후 draft 삭제)
 *
 * 버튼 분리:
 * - PRIVATE: 저장하기 (post 직접 저장), 발행하기
 * - PUBLIC: 임시저장 (draft), 업데이트 (재발행)
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
  getDraft,
  PostStatus,
  UpdatePostRequest,
  revalidatePost,
  publishPost,
  republishPost,
  deleteDraft,
  unpublishPost,
  updateAdminPost,
  saveDraft,
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

// 드래프트 선택 모달 결과
type DraftChoice = 'pending' | 'use-draft' | 'use-original';

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

  // 드래프트 선택 상태: pending(선택 대기), use-draft(드래프트 사용), use-original(원본 사용)
  const [draftChoice, setDraftChoice] = useState<DraftChoice>('pending');

  // 모달 상태
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [republishModalOpen, setRepublishModalOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);

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

  // 드래프트 조회 (post.hasDraft가 true일 때만)
  const { data: draft, isLoading: draftLoading } = useQuery({
    queryKey: ['admin', 'draft', siteId, postId],
    queryFn: () => getDraft(siteId, postId),
    enabled: !!siteId && !!postId && post?.hasDraft === true,
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useAdminCategories(siteId);

  const { data: siteSettings, error: siteSettingsError } = useAdminSiteSettings(siteId);

  // --------------------------------------------------------------------------
  // 드래프트 선택 모달 (파생 상태)
  // --------------------------------------------------------------------------

  // 드래프트가 있고 아직 선택하지 않았으면 모달 표시
  const showDraftModal = !postLoading && post?.hasDraft && !!draft && draftChoice === 'pending';

  // 드래프트가 없으면 자동으로 원본 사용으로 설정
  const effectiveDraftChoice: DraftChoice =
    !postLoading && post && !post.hasDraft && draftChoice === 'pending'
      ? 'use-original'
      : draftChoice;

  // --------------------------------------------------------------------------
  // 자동 저장
  // --------------------------------------------------------------------------

  const { lastSavedAt, isSaving, hasUnsavedChanges, markAsChanged } = useAutoSave({
    siteId,
    postId,
    postStatus: post?.status ?? null,
    intervalMs: 5 * 60 * 1000,
    onSaveSuccess: () => {
      toast.success('자동 저장되었습니다', { duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
    },
    onSaveError: (err) => {
      console.error('Auto-save failed:', err);
    },
  });

  // --------------------------------------------------------------------------
  // 상태 표시
  // --------------------------------------------------------------------------

  const getStatusText = () => {
    if (isSaving) return { text: '저장 중...', color: 'text-blue-600' };
    if (!post) return null;

    if (post.status === PostStatus.PUBLISHED) {
      if (effectiveDraftChoice === 'use-draft' || post.hasDraft) {
        return { text: '편집 중 (미발행 변경사항)', color: 'text-amber-600' };
      }
      return { text: '발행됨', color: 'text-green-600' };
    }

    // PRIVATE 상태
    return { text: '비공개', color: 'text-gray-600' };
  };

  const statusInfo = getStatusText();

  const headerExtra = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {statusInfo && <span className={statusInfo.color}>{statusInfo.text}</span>}
      {!isSaving && lastSavedAt && (
        <span className="text-gray-400">
          ({lastSavedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 저장됨)
        </span>
      )}
      {hasUnsavedChanges && !isSaving && <span className="text-orange-600">• 저장 대기 중</span>}
    </div>
  );

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

  // 폼 초기화 (드래프트 선택 후)
  useEffect(() => {
    if (!post || effectiveDraftChoice === 'pending') return;

    if (effectiveDraftChoice === 'use-draft' && draft) {
      // 드래프트 내용으로 초기화
      methods.reset({
        title: draft.title || '',
        subtitle: draft.subtitle || '',
        slug: post.slug || '', // slug는 원본에서
        categoryId: draft.categoryId || '',
        seoTitle: draft.seoTitle || '',
        seoDescription: draft.seoDescription || '',
        ogImageUrl: draft.ogImageUrl || '',
      });
      // 에디터 내용도 드래프트로 업데이트
      const editor = editorRef.current?.getEditor();
      if (editor && draft.contentJson) {
        editor.commands.setContent(draft.contentJson);
      }
    } else {
      // 원본 게시글로 초기화
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
  }, [post, draft, effectiveDraftChoice, methods]);

  const watchedOgImageUrl = useWatch({
    control: methods.control,
    name: 'ogImageUrl',
  });

  // --------------------------------------------------------------------------
  // 데이터 수집 & 변경 감지
  // --------------------------------------------------------------------------

  const collectFormData = useCallback((): UpdatePostRequest | null => {
    const data = methods.getValues();
    const editor = editorRef.current;
    if (!editor) return null;

    const contentJson = editor.getJSON();
    if (!contentJson) return null;

    return {
      title: data.title?.trim(),
      subtitle: data.subtitle?.trim(),
      slug: data.slug?.trim() || undefined,
      contentJson,
      contentHtml: editor.getHTML(),
      contentText: editor.getText().trim(),
      categoryId: data.categoryId?.trim() || undefined,
      seoTitle: data.seoTitle?.trim() || undefined,
      seoDescription: data.seoDescription?.trim() || undefined,
      ogImageUrl: data.ogImageUrl?.trim() || undefined,
    };
  }, [methods]);

  const watchedValues = useWatch({ control: methods.control });

  useEffect(() => {
    if (!editorReady || effectiveDraftChoice === 'pending') return;
    const data = collectFormData();
    if (data) markAsChanged(data);
  }, [watchedValues, editorReady, effectiveDraftChoice, collectFormData, markAsChanged]);

  const handleEditorReady = useCallback(() => {
    setEditorReady(true);
  }, []);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  // PRIVATE → PUBLISHED (발행)
  const publishMutation = useMutation({
    mutationFn: () => publishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('게시글이 발행되었습니다');
      router.push('/admin/posts');
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '발행에 실패했습니다'));
    },
  });

  // PUBLIC + draft → PUBLISHED (재발행/업데이트)
  const republishMutation = useMutation({
    mutationFn: () => republishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('변경사항이 발행되었습니다');
      router.push('/admin/posts');
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '업데이트에 실패했습니다'));
    },
  });

  // 드래프트 삭제 (변경 취소)
  const discardMutation = useMutation({
    mutationFn: () => deleteDraft(siteId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      toast.success('변경사항이 취소되었습니다');
      window.location.reload();
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '변경 취소에 실패했습니다'));
    },
  });

  // PUBLISHED → PRIVATE (비공개 전환)
  const unpublishMutation = useMutation({
    mutationFn: () => unpublishPost(siteId, postId),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('게시글이 비공개로 전환되었습니다');
      router.push('/admin/posts');
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '비공개 전환에 실패했습니다'));
    },
  });

  // PRIVATE post 직접 저장
  const savePostMutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => updateAdminPost(siteId, postId, data),
    onSuccess: async (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (updatedPost.status === PostStatus.PUBLISHED && siteSettings?.slug && updatedPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, updatedPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success('저장되었습니다');
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '저장에 실패했습니다'));
    },
  });

  // PUBLIC draft 저장 (임시저장)
  const saveDraftMutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => saveDraft(siteId, postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      toast.success('임시저장되었습니다');
      router.push(`/admin/posts/${postId}`);
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '임시저장에 실패했습니다'));
    },
  });

  // PRIVATE에서 드래프트 불러온 후 저장 + 드래프트 삭제
  const applyDraftAndDeleteMutation = useMutation({
    mutationFn: async (data: UpdatePostRequest) => {
      // 1. post에 저장
      await updateAdminPost(siteId, postId, data);
      // 2. draft 삭제
      await deleteDraft(siteId, postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      toast.success('저장되었습니다');
    },
    onError: (err) => {
      toast.error(getErrorDisplayMessage(err, '저장에 실패했습니다'));
    },
  });

  // --------------------------------------------------------------------------
  // 핸들러
  // --------------------------------------------------------------------------

  /** 드래프트 선택: 드래프트 사용 */
  const handleUseDraft = () => {
    setDraftChoice('use-draft');
    // showDraftModal은 draftChoice가 'pending'이 아니면 자동으로 false가 됨
  };

  /** 드래프트 선택: 원본 사용 (드래프트 폐기) */
  const handleUseOriginal = async () => {
    // 드래프트 삭제
    try {
      await deleteDraft(siteId, postId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'draft', siteId, postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
    } catch (e) {
      console.warn('Failed to delete draft:', e);
    }
    setDraftChoice('use-original');
  };

  /** PRIVATE: 저장하기 버튼 */
  const handleSavePrivate = () => {
    const data = collectFormData();
    if (!data) {
      toast.error('에디터가 준비되지 않았습니다');
      return;
    }

    // PRIVATE에서 드래프트 불러온 경우 → post 저장 + draft 삭제
    if (effectiveDraftChoice === 'use-draft') {
      applyDraftAndDeleteMutation.mutate(data);
    } else {
      savePostMutation.mutate(data);
    }
  };

  /** PUBLIC: 임시저장 버튼 */
  const handleSaveDraft = () => {
    const data = collectFormData();
    if (!data) {
      toast.error('에디터가 준비되지 않았습니다');
      return;
    }
    saveDraftMutation.mutate(data);
  };

  /** PUBLIC: 업데이트(재발행) 버튼 - 먼저 드래프트 저장 후 재발행 */
  const handleUpdate = async () => {
    const data = collectFormData();
    if (!data) {
      toast.error('에디터가 준비되지 않았습니다');
      return;
    }

    // 현재 폼 내용을 드래프트에 저장 후 재발행
    try {
      await saveDraft(siteId, postId, data);
      republishMutation.mutate();
    } catch (err) {
      toast.error(getErrorDisplayMessage(err, '업데이트에 실패했습니다'));
    }
  };

  // --------------------------------------------------------------------------
  // 로딩/에러 상태
  // --------------------------------------------------------------------------

  if (postLoading || (post?.hasDraft && draftLoading)) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" extra={headerExtra} />
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

  const isPrivate = post.status === PostStatus.PRIVATE;
  const isPublished = post.status === PostStatus.PUBLISHED;
  const hasDraftChanges =
    effectiveDraftChoice === 'use-draft' ||
    (post.hasDraft && effectiveDraftChoice !== 'use-original');

  const isPending =
    isSaving ||
    publishMutation.isPending ||
    republishMutation.isPending ||
    discardMutation.isPending ||
    unpublishMutation.isPending ||
    savePostMutation.isPending ||
    saveDraftMutation.isPending ||
    applyDraftAndDeleteMutation.isPending;

  // --------------------------------------------------------------------------
  // 렌더링
  // --------------------------------------------------------------------------

  return (
    <FormProvider {...methods}>
      <>
        <AdminPageHeader breadcrumb="Management" title="Edit Post" extra={headerExtra} />
        <div className="p-6">
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
                    content={
                      effectiveDraftChoice === 'use-draft' && draft?.contentJson
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
              {/* 게시글 관리 */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">게시글 관리</h3>
                <div className="flex flex-col gap-2">
                  {/* PRIVATE 상태 버튼 */}
                  {isPrivate && (
                    <>
                      {/* 발행 버튼 */}
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => setPublishModalOpen(true)}
                        disabled={isPending}
                      >
                        {publishMutation.isPending ? '발행 중...' : '발행'}
                      </Button>
                      {/* 저장하기 버튼 (post 직접 저장) */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleSavePrivate}
                        disabled={isPending}
                      >
                        {savePostMutation.isPending || applyDraftAndDeleteMutation.isPending
                          ? '저장 중...'
                          : '저장하기'}
                      </Button>
                    </>
                  )}

                  {/* PUBLIC 상태 버튼 */}
                  {isPublished && (
                    <>
                      {/* 업데이트(재발행) 버튼 */}
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => setRepublishModalOpen(true)}
                        disabled={isPending}
                      >
                        {republishMutation.isPending ? '업데이트 중...' : '업데이트'}
                      </Button>
                      {/* 임시저장 버튼 (draft 저장) */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleSaveDraft}
                        disabled={isPending}
                      >
                        {saveDraftMutation.isPending ? '저장 중...' : '임시저장'}
                      </Button>
                      {/* 변경 취소 (드래프트가 있을 때만) */}
                      {hasDraftChanges && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-amber-600 hover:text-amber-700"
                          onClick={() => setDiscardModalOpen(true)}
                          disabled={isPending}
                        >
                          {discardMutation.isPending ? '취소 중...' : '임시 저장본 삭제'}
                        </Button>
                      )}
                      {/* 비공개 전환 */}
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => setUnpublishModalOpen(true)}
                        disabled={isPending}
                      >
                        {unpublishMutation.isPending ? '처리 중...' : '비공개 전환'}
                      </Button>
                    </>
                  )}

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
                    const data = collectFormData();
                    if (data) markAsChanged({ ...data, ogImageUrl: url || undefined });
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

        {/* ================================================================== */}
        {/* 모달들 */}
        {/* ================================================================== */}

        {/* 드래프트 선택 모달 */}
        <AlertDialog open={showDraftModal} onOpenChange={() => {}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>임시저장된 내용이 있습니다</AlertDialogTitle>
              <AlertDialogDescription>
                이전에 저장하지 않은 변경사항이 있습니다. 어떤 버전으로 편집하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleUseOriginal}>
                {isPublished ? '발행본으로 시작' : '저장된 내용으로 시작'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleUseDraft}>임시저장 불러오기</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

        {/* 업데이트(재발행) 확인 모달 */}
        <AlertDialog open={republishModalOpen} onOpenChange={setRepublishModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>게시글 업데이트</AlertDialogTitle>
              <AlertDialogDescription>
                현재 편집 내용을 발행하시겠습니까? 기존 발행본이 새 내용으로 교체됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdate} disabled={republishMutation.isPending}>
                {republishMutation.isPending ? '업데이트 중...' : '업데이트'}
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
                {discardMutation.isPending ? '취소 중...' : '임시 저장본 삭제'}
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
                {hasDraftChanges
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
