'use client';

/**
 * 새 게시글 작성 페이지
 *
 * 저장 로직 (수동 저장 방식):
 * - [저장] 버튼: Draft 생성/업데이트
 * - [등록] 버튼: Post로 발행
 * - [저장된 글 불러오기] 버튼: Draft 목록 모달
 * - 자동저장 없음
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useSiteId } from '@/stores/site-store';
import { useAdminCategories } from '@/hooks/use-categories';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useCreateDraft, useUpdateDraft, usePublishDraft } from '@/hooks/use-drafts';
import { useLeaveConfirm, type EditorMode } from '@/hooks/use-leave-confirm';
import {
  PostStatus,
  revalidatePost,
  createAdminPost,
  getDraftByIdV2,
  CreatePostRequest,
  DraftListItem,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { ThumbnailInput } from '@/components/app/post/ThumbnailInput';
import { PostStatusRadio } from '@/components/app/post/PostStatusRadio';
import { TiptapEditor, type TiptapEditorRef } from '@/components/app/editor/TiptapEditor';
import { DraftListModal } from '@/components/app/post/DraftListModal';
import { LeaveConfirmModal } from '@/components/app/post/LeaveConfirmModal';
import { scrollToFirstError } from '@/lib/scroll-to-error';
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
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

export default function NewPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = useSiteId();

  // --------------------------------------------------------------------------
  // 데이터 조회
  // --------------------------------------------------------------------------

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useAdminCategories(siteId);
  const { data: siteSettings } = useAdminSiteSettings(siteId);

  // --------------------------------------------------------------------------
  // 로컬 상태
  // --------------------------------------------------------------------------

  const editorRef = useRef<TiptapEditorRef>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PostStatus>(PostStatus.PUBLISHED);

  // Draft 관련 상태
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // 에디터 모드: create (새 글) 또는 edit-draft (불러온 Draft 편집)
  const editorMode: EditorMode = currentDraftId ? 'edit-draft' : 'create';

  // --------------------------------------------------------------------------
  // 이탈 감지
  // --------------------------------------------------------------------------

  const { allowLeave, isLeaveAllowed } = useLeaveConfirm({
    hasChanges,
    mode: editorMode,
  });

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

  const watchedOgImageUrl = useWatch({
    control: methods.control,
    name: 'ogImageUrl',
  });

  // 변경 감지
  const watchedValues = useWatch({ control: methods.control });

  useEffect(() => {
    if (editorReady) {
      setHasChanges(true);
    }
  }, [watchedValues, editorReady]);

  const handleEditorReady = useCallback(() => {
    setEditorReady(true);
  }, []);

  // --------------------------------------------------------------------------
  // 데이터 수집
  // --------------------------------------------------------------------------

  const collectFormData = useCallback(() => {
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
      categoryId: data.categoryId?.trim() || null,
      seoTitle: trimOrNull(data.seoTitle),
      seoDescription: trimOrNull(data.seoDescription),
      ogImageUrl: trimOrNull(data.ogImageUrl),
    };
  }, [methods]);

  const isContentEmpty = useCallback((contentJson: Record<string, unknown> | undefined) => {
    if (!contentJson) return true;
    const content = contentJson.content as Array<Record<string, unknown>> | undefined;
    if (!content || content.length === 0) return true;
    if (
      content.length === 1 &&
      content[0].type === 'paragraph' &&
      (!content[0].content || (content[0].content as Array<unknown>).length === 0)
    ) {
      return true;
    }
    return false;
  }, []);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  const createDraftMutation = useCreateDraft(siteId);
  const updateDraftMutation = useUpdateDraft(siteId);
  const publishDraftMutation = usePublishDraft(siteId);

  // Post 직접 생성 (Draft 없이 바로 발행)
  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(siteId, data),
    onSuccess: async (createdPost) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
      if (createdPost.status === PostStatus.PUBLISHED && siteSettings?.slug && createdPost.slug) {
        try {
          await revalidatePost(siteSettings.slug, createdPost.slug);
        } catch (e) {
          console.warn('Failed to revalidate:', e);
        }
      }
      toast.success(
        createdPost.status === PostStatus.PUBLISHED
          ? '게시글이 발행되었습니다'
          : '게시글이 저장되었습니다',
      );
      allowLeave();
      router.push('/admin/posts');
    },
    onError: (err) => {
      const errorCode = getErrorCode(err);
      const errorMessage = getErrorDisplayMessage(err, '게시글 저장에 실패했습니다.');

      if (errorCode === 'POST_002' || (err instanceof AxiosError && err.response?.status === 409)) {
        methods.setError('slug', { type: 'manual', message: errorMessage });
        setError(errorMessage);
        setTimeout(() => scrollToFirstError(errorMessage), 150);
      } else {
        setError(errorMessage);
      }
    },
  });

  // --------------------------------------------------------------------------
  // 핸들러
  // --------------------------------------------------------------------------

  /** 저장 버튼 (Draft 생성/업데이트) */
  const handleSaveDraft = async () => {
    const data = collectFormData();
    if (!data) {
      toast.error('에디터가 준비되지 않았습니다');
      return;
    }

    try {
      if (currentDraftId) {
        // 기존 Draft 업데이트
        await updateDraftMutation.mutateAsync({ draftId: currentDraftId, data });
      } else {
        // 새 Draft 생성
        const draft = await createDraftMutation.mutateAsync(data);
        setCurrentDraftId(draft.id);
      }
      setHasChanges(false);
      toast.success('저장되었습니다');
    } catch (err) {
      toast.error(getErrorDisplayMessage(err, '저장에 실패했습니다'));
    }
  };

  /** 등록 버튼 (Post로 발행) */
  const handlePublish = async () => {
    setError(null);

    const isValid = await methods.trigger();
    if (!isValid) {
      setTimeout(() => scrollToFirstError(methods.formState.errors), 150);
      return;
    }

    const data = collectFormData();
    if (!data) {
      toast.error('에디터를 불러올 수 없습니다');
      return;
    }

    if (isContentEmpty(data.contentJson)) {
      toast.error('내용을 입력해주세요');
      return;
    }

    if (currentDraftId) {
      // Draft가 있으면 먼저 업데이트 후 발행
      try {
        await updateDraftMutation.mutateAsync({ draftId: currentDraftId, data });
        const post = await publishDraftMutation.mutateAsync(currentDraftId);

        if (post.status === PostStatus.PUBLISHED && siteSettings?.slug && post.slug) {
          try {
            await revalidatePost(siteSettings.slug, post.slug);
          } catch (e) {
            console.warn('Failed to revalidate:', e);
          }
        }

        toast.success('게시글이 발행되었습니다');
        allowLeave();
        router.push('/admin/posts');
      } catch (err) {
        const errorCode = getErrorCode(err);
        const errorMessage = getErrorDisplayMessage(err, '발행에 실패했습니다');

        if (
          errorCode === 'POST_002' ||
          errorCode === 'SLUG_ALREADY_EXISTS' ||
          (err instanceof AxiosError && err.response?.status === 409)
        ) {
          methods.setError('slug', { type: 'manual', message: errorMessage });
          setError(errorMessage);
          setTimeout(() => scrollToFirstError(errorMessage), 150);
        } else {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } else {
      // Draft 없이 바로 Post 생성
      createPostMutation.mutate({
        ...data,
        status: selectedStatus,
      });
    }
  };

  /** Draft 불러오기 */
  const handleLoadDraft = async (draftItem: DraftListItem) => {
    try {
      const draft = await getDraftByIdV2(draftItem.id);

      methods.reset({
        title: draft.title || '',
        subtitle: draft.subtitle || '',
        slug: draft.slug || '',
        categoryId: draft.categoryId || '',
        seoTitle: draft.seoTitle || '',
        seoDescription: draft.seoDescription || '',
        ogImageUrl: draft.ogImageUrl || '',
      });

      const editor = editorRef.current?.getEditor();
      if (editor && draft.contentJson) {
        editor.commands.setContent(draft.contentJson);
      }

      setCurrentDraftId(draft.id);
      setHasChanges(false);
      toast.success('저장된 글을 불러왔습니다');
    } catch {
      toast.error('글을 불러올 수 없습니다');
    }
  };

  /** 임시저장 후 불러오기 (hasChanges가 true일 때) */
  const handleSaveBeforeLoad = async () => {
    await handleSaveDraft();
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

  /** 임시저장 후 이탈 */
  const handleSaveAndLeave = async () => {
    await handleSaveDraft();
    allowLeave();
    setShowLeaveModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    } else {
      router.back();
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

  const isPending =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    publishDraftMutation.isPending ||
    createPostMutation.isPending;

  // --------------------------------------------------------------------------
  // 상태 표시
  // --------------------------------------------------------------------------

  const getStatusText = () => {
    if (isPending) return { text: '저장 중...', color: 'text-blue-600' };
    if (currentDraftId) return { text: 'Draft 편집 중', color: 'text-amber-600' };
    return { text: '새 글', color: 'text-gray-600' };
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
                  <TiptapEditor ref={editorRef} siteId={siteId} onEditorReady={handleEditorReady} />
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
                    onClick={handlePublish}
                    disabled={isPending}
                  >
                    {publishDraftMutation.isPending || createPostMutation.isPending
                      ? '등록 중...'
                      : '등록'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveDraft}
                    disabled={isPending}
                  >
                    {createDraftMutation.isPending || updateDraftMutation.isPending
                      ? '저장 중...'
                      : '저장'}
                  </Button>

                  {/* 저장된 글 불러오기 버튼 */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowDraftModal(true)}
                    disabled={isPending}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    저장된 글 불러오기
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleNavigate('/admin/posts')}
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
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
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

        {/* 저장된 글 불러오기 모달 */}
        <DraftListModal
          siteId={siteId}
          open={showDraftModal}
          onOpenChange={setShowDraftModal}
          onSelect={handleLoadDraft}
          hasUnsavedChanges={hasChanges && editorMode === 'create'}
          onSaveBeforeLoad={handleSaveBeforeLoad}
        />

        {/* 이탈 확인 모달 */}
        <LeaveConfirmModal
          open={showLeaveModal}
          onOpenChange={setShowLeaveModal}
          mode={editorMode}
          onSaveAndLeave={handleSaveAndLeave}
          onLeaveWithoutSave={handleLeaveWithoutSave}
          onCancel={handleCancelLeave}
          isSaving={createDraftMutation.isPending || updateDraftMutation.isPending}
        />
      </>
    </FormProvider>
  );
}
