'use client';

/**
 * 게시글 상세 페이지
 *
 * 기능:
 * - 발행본/임시저장 탭메뉴 (draft가 있을 때만)
 * - 상태 배너 (DRAFT/PRIVATE)
 * - 게시글 정보 사이드바
 * - 삭제/상태변경 액션
 */

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSiteId } from '@/stores/site-store';
import { getAdminPost, getDraft, PostStatus, revalidatePost } from '@/lib/api';
import { PostContent } from '@/components/app/post/PostContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatPostDate } from '@/lib/date-utils';
import {
  Pencil,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { QueryError } from '@/components/common/QueryError';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useDeletePost, useUpdatePostStatus } from '@/hooks/use-posts';
import { useAdminCategories } from '@/hooks/use-categories';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입
// ============================================================================

type ViewTab = 'published' | 'draft';

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function AdminPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { postId } = params;

  // --------------------------------------------------------------------------
  // 로컬 상태
  // --------------------------------------------------------------------------

  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('published');

  // --------------------------------------------------------------------------
  // 데이터 조회
  // --------------------------------------------------------------------------

  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'post', siteId, postId],
    queryFn: () => getAdminPost(postId),
    enabled: !!siteId && !!postId,
  });

  // 드래프트 조회 (post.hasDraft가 true일 때만)
  const { data: draft } = useQuery({
    queryKey: ['admin', 'draft', siteId, postId],
    queryFn: () => getDraft(postId),
    enabled: !!siteId && !!postId && post?.hasDraft === true,
  });

  const { data: siteSettings, error: siteSettingsError } = useAdminSiteSettings(siteId);
  const { data: categories } = useAdminCategories(siteId);
  const deletePostMutation = useDeletePost(siteId);
  const updateStatusMutation = useUpdatePostStatus(siteId, postId);

  // --------------------------------------------------------------------------
  // 파생 데이터
  // --------------------------------------------------------------------------

  const formattedDate = post ? formatPostDate(post.createdAt) : '';
  const publishedDate = post?.publishedAt ? formatPostDate(post.publishedAt) : null;
  const categoryName = post?.categoryId
    ? categories?.find((c) => c.id === post.categoryId)?.name
    : null;

  // 발행된 게시글의 블로그 URL
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'pagelet-dev.kr';
  const blogPostUrl =
    post?.status === PostStatus.PUBLISHED && siteSettings?.slug && post?.slug && !siteSettingsError
      ? `https://${siteSettings.slug}.${tenantDomain}/posts/${post.slug}`
      : null;

  // 현재 탭에 따른 콘텐츠
  const displayContent = activeTab === 'draft' && draft ? draft : post;
  const displayHtml = activeTab === 'draft' && draft ? draft.contentHtml : post?.contentHtml;

  // --------------------------------------------------------------------------
  // 상태 배너 정보
  // --------------------------------------------------------------------------

  const getBannerInfo = () => {
    if (!post) return null;
    if (post.status === PostStatus.DRAFT) {
      return {
        icon: FileText,
        message: '이 게시글은 현재 초안 상태이며 공개되지 않습니다.',
        action: '지금 발행',
        actionStatus: PostStatus.PUBLISHED,
        bgColor: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-500',
      };
    }
    if (post.status === PostStatus.PRIVATE) {
      return {
        icon: Lock,
        message: '이 게시글은 현재 비공개 상태입니다.',
        action: '공개로 전환',
        actionStatus: PostStatus.PUBLISHED,
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500',
      };
    }
    return null;
  };

  const bannerInfo = getBannerInfo();

  // --------------------------------------------------------------------------
  // 상태 뱃지
  // --------------------------------------------------------------------------

  const getStatusBadge = () => {
    if (!post) return null;
    switch (post.status) {
      case PostStatus.PUBLISHED:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Eye className="w-3 h-3 mr-1" />
            발행됨
          </Badge>
        );
      case PostStatus.PRIVATE:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Lock className="w-3 h-3 mr-1" />
            비공개
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <FileText className="w-3 h-3 mr-1" />
            임시저장
          </Badge>
        );
    }
  };

  // --------------------------------------------------------------------------
  // 핸들러
  // --------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!post || !siteSettings) return;
    setIsDeleting(true);
    try {
      await deletePostMutation.mutateAsync(postId);
      if (siteSettings.slug && post.slug) {
        try {
          await revalidatePost(siteSettings.slug, post.slug);
        } catch (revalidateError) {
          console.warn('Failed to revalidate post:', revalidateError);
        }
      }
      router.push('/admin/posts');
    } catch (err) {
      console.error('Failed to delete post:', err);
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: PostStatus) => {
    if (!post || !siteSettings) return;
    try {
      await updateStatusMutation.mutateAsync(newStatus);
      if (siteSettings.slug && post.slug) {
        try {
          await revalidatePost(siteSettings.slug, post.slug);
        } catch (revalidateError) {
          console.warn('Failed to revalidate post:', revalidateError);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // --------------------------------------------------------------------------
  // 로딩/에러 상태
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <>
        <AdminPageHeader breadcrumb="Posts" breadcrumbHref="/admin/posts" title="게시글 상세" />
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <AdminPageHeader breadcrumb="Posts" breadcrumbHref="/admin/posts" title="게시글 상세" />
        <div className="p-8">
          <QueryError
            error={error}
            onRetry={refetch}
            fallbackMessage="게시글을 찾을 수 없습니다."
          />
        </div>
      </>
    );
  }

  // --------------------------------------------------------------------------
  // 렌더링
  // --------------------------------------------------------------------------

  return (
    <>
      <AdminPageHeader
        breadcrumb="Posts"
        breadcrumbHref="/admin/posts"
        title={post.title || '(제목없음)'}
        action={{
          label: '편집',
          href: `/admin/posts/${postId}/edit`,
          icon: Pencil,
        }}
      />

      {/* 상태 배너 (Draft/Private) */}
      {bannerInfo && (
        <div
          className={`border-b px-4 py-1 flex items-center justify-between ${bannerInfo.bgColor}`}
        >
          <div className="flex items-center gap-2">
            <bannerInfo.icon className={`w-4 h-4 ${bannerInfo.iconColor}`} />
            <span className={`text-xs font-medium ${bannerInfo.textColor}`}>
              {bannerInfo.message}
            </span>
          </div>
          {post.status !== PostStatus.DRAFT && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(bannerInfo.actionStatus)}
              disabled={updateStatusMutation.isPending}
              className={`${bannerInfo.textColor} h-5 text-xs border-current hover:bg-white/50`}
            >
              {bannerInfo.action}
            </Button>
          )}
          {post.status === PostStatus.DRAFT && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(PostStatus.PUBLISHED)}
              disabled={updateStatusMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              지금 발행
            </Button>
          )}
        </div>
      )}

      {/* 드래프트 탭 (draft가 있을 때만) */}
      {post.hasDraft && draft && (
        <div className="border-b bg-gray-50 px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('published')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'published'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {post.status === PostStatus.PUBLISHED ? '발행본' : '저장본'}
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'draft'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              임시저장
              <span className="ml-1 text-xs text-amber-500">(미발행)</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-[calc(100vh-120px)]">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 좌측: 메인 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {/* 제목 및 날짜 */}
              <div className="mb-2 flex gap-2 items-center text-xs text-gray-500">
                {getStatusBadge()}
                {activeTab === 'draft' && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    <FileText className="w-3 h-3 mr-1" />
                    임시저장 버전
                  </Badge>
                )}
                {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
                <span>작성: {formattedDate}</span>
                {publishedDate && (
                  <>
                    <span>·</span>
                    <span>발행: {publishedDate}</span>
                  </>
                )}
              </div>

              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  {displayContent?.title || <span className="text-gray-400">(제목없음)</span>}
                </h1>
                {displayContent?.subtitle && (
                  <p className="text-sm text-gray-500 font-semibold mb-4">
                    {displayContent.subtitle}
                  </p>
                )}
              </div>

              {/* 본문 */}
              <PostContent html={displayHtml ?? null} />
            </div>

            {/* 우측: 사이드바 */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
                {/* 썸네일 */}
                <div className="aspect-video rounded-t-lg overflow-hidden bg-gray-100 relative">
                  <Image
                    src={
                      (activeTab === 'draft' && draft?.ogImageUrl) ||
                      post.ogImageUrl ||
                      '/images/admin/no_thumbnail.png'
                    }
                    alt={post.title || '썸네일'}
                    fill
                    sizes="256px"
                    priority
                    className="object-cover"
                  />
                </div>

                {/* 게시글 정보 */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">게시글 정보</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Slug</dt>
                      <dd className="font-mono text-gray-900 text-right truncate max-w-[180px]">
                        /{post.slug}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">작성일</dt>
                      <dd className="text-gray-900">{formattedDate}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">발행일</dt>
                      <dd className="text-gray-900">{publishedDate || '-'}</dd>
                    </div>
                  </dl>
                </div>

                <Separator />

                {/* SEO 정보 */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO 정보</h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500 mb-1">SEO 제목</dt>
                      <dd className="text-gray-900 break-words">
                        {(activeTab === 'draft' && draft?.seoTitle) || post.seoTitle || (
                          <span className="text-gray-400">-</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 mb-1">SEO 설명</dt>
                      <dd className="text-gray-900 break-words">
                        {(activeTab === 'draft' && draft?.seoDescription) ||
                          post.seoDescription || <span className="text-gray-400">-</span>}
                      </dd>
                    </div>
                  </dl>
                </div>

                <Separator />

                {/* 작업 버튼들 */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">작업</h3>

                  {/* 편집 */}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/admin/posts/${postId}/edit`)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    게시글 편집
                  </Button>

                  {/* 블로그에서 보기 (PUBLISHED일 때만) */}
                  {blogPostUrl && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={blogPostUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        블로그에서 보기
                      </a>
                    </Button>
                  )}

                  {/* 상태 변경 버튼 */}
                  {post.status === PostStatus.PUBLISHED && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusChange(PostStatus.PRIVATE)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      비공개로 전환
                    </Button>
                  )}
                  {post.status === PostStatus.PRIVATE && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusChange(PostStatus.PUBLISHED)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      공개로 전환
                    </Button>
                  )}
                  {post.status === PostStatus.DRAFT && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusChange(PostStatus.PUBLISHED)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      발행하기
                    </Button>
                  )}

                  <Separator className="my-3" />

                  {/* 삭제 */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        게시글 삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          게시글을 삭제하시겠습니까?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          이 작업은 되돌릴 수 없습니다. 게시글과 관련된 모든 데이터가 영구적으로
                          삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
