'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminPost, PostStatus, revalidatePost } from '@/lib/api';
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
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { useDeletePost, useUpdatePostStatus } from '@/hooks/use-posts';
import { useAdminCategories } from '@/hooks/use-categories';
import { useState } from 'react';

export default function AdminPostDetailPage() {
  const params = useParams<{ siteId: string; postId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { siteId, postId } = params;
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'post', siteId, postId],
    queryFn: () => getAdminPost(siteId, postId),
    enabled: !!siteId && !!postId,
  });

  const { data: siteSettings, error: siteSettingsError } = useAdminSiteSettings(siteId);
  const { data: categories } = useAdminCategories(siteId);
  const deletePostMutation = useDeletePost(siteId);
  const updateStatusMutation = useUpdatePostStatus(siteId, postId);

  const formattedDate = post ? formatPostDate(post.createdAt) : '';
  const publishedDate = post?.publishedAt ? formatPostDate(post.publishedAt) : null;
  const categoryName = post?.categoryId
    ? categories?.find((c) => c.id === post.categoryId)?.name
    : null;

  // 발행된 게시글의 블로그 URL (full URL)
  // 에러 발생 시 조용히 처리 (블로그 URL은 선택적 기능)
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'pagelet-dev.kr';
  const blogPostUrl =
    post?.status === PostStatus.PUBLISHED && siteSettings?.slug && post?.slug && !siteSettingsError
      ? `https://${siteSettings.slug}.${tenantDomain}/posts/${post.slug}`
      : null;

  // 상태 배너 정보
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

  // 상태 뱃지 스타일
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

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!post || !siteSettings) return;
    setIsDeleting(true);
    try {
      await deletePostMutation.mutateAsync(postId);
      // ISR 캐시 무효화 (에러 발생해도 조용히 처리)
      if (siteSettings.slug && post.slug) {
        try {
          await revalidatePost(siteSettings.slug, post.slug);
        } catch (revalidateError) {
          console.warn('Failed to revalidate post:', revalidateError);
        }
      }
      router.push(`/admin/${siteId}/posts`);
    } catch (error) {
      console.error('Failed to delete post:', error);
      setIsDeleting(false);
    }
  };

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus: PostStatus) => {
    if (!post || !siteSettings) return;
    try {
      await updateStatusMutation.mutateAsync({ status: newStatus });
      // ISR 캐시 무효화 (에러 발생해도 조용히 처리)
      if (siteSettings.slug && post.slug) {
        try {
          await revalidatePost(siteSettings.slug, post.slug);
        } catch (revalidateError) {
          console.warn('Failed to revalidate post:', revalidateError);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminPageHeader
          breadcrumb="Posts"
          breadcrumbHref={`/admin/${siteId}/posts`}
          title="게시글 상세"
        />
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <AdminPageHeader
          breadcrumb="Posts"
          breadcrumbHref={`/admin/${siteId}/posts`}
          title="게시글 상세"
        />
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
    <>
      <AdminPageHeader
        breadcrumb="Posts"
        breadcrumbHref={`/admin/${siteId}/posts`}
        title={post.title || '(제목없음)'}
        action={{
          label: '편집',
          href: `/admin/${siteId}/posts/${postId}/edit`,
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

      <div className="bg-gray-50 min-h-[calc(100vh-120px)]">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 좌측: 메인 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {/* 제목 및 날짜 */}
              <div className="mb-2 flex gap-2 items-center text-xs text-gray-500">
                {getStatusBadge()}
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
                  {post.title || <span className="text-gray-400">(제목없음)</span>}
                </h1>
                {post.subtitle && (
                  <p className="text-sm text-gray-500 font-semibold mb-4">{post.subtitle}</p>
                )}
              </div>

              {/* 본문 */}
              <PostContent html={post.contentHtml} />
            </div>

            {/* 우측: 사이드바 */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
                {/* 썸네일 */}
                <div className="aspect-video rounded-t-lg overflow-hidden bg-gray-100 relative">
                  <Image
                    src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
                    alt={post.title || '썸네일'}
                    fill
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

                {/* 작업 버튼들 */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">작업</h3>

                  {/* 편집 */}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/admin/${siteId}/posts/${postId}/edit`)}
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
