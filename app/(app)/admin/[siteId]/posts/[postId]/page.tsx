'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAdminPost, PostStatus } from '@/lib/api';
import { PostContent } from '@/components/post/PostContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPostDate } from '@/lib/date-utils';
import { Pencil } from 'lucide-react';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default function AdminPostDetailPage() {
  const params = useParams<{ siteId: string; postId: string }>();
  const router = useRouter();
  const { siteId, postId } = params;

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'post', siteId, postId],
    queryFn: () => getAdminPost(siteId, postId),
    enabled: !!siteId && !!postId,
  });

  const formattedDate = post ? formatPostDate(post.createdAt) : '';
  const publishedDate = post?.publishedAt ? formatPostDate(post.publishedAt) : null;

  if (isLoading) {
    return (
      <>
        <AdminPageHeader breadcrumb="Posts" title="Post Detail" />
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
        <AdminPageHeader breadcrumb="Posts" title="Post Detail" />
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
        title={post.title || 'Post Detail'}
        action={{
          label: '편집',
          href: `/admin/${siteId}/posts/${postId}/edit`,
          icon: Pencil,
        }}
        extra={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge
              variant={post.status === PostStatus.PUBLISHED ? 'default' : 'secondary'}
              className={
                post.status === PostStatus.PUBLISHED
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
              }
            >
              {post.status === PostStatus.PUBLISHED ? '발행됨' : '임시저장'}
            </Badge>
            <span>·</span>
            <span>작성: {formattedDate}</span>
            {publishedDate && (
              <>
                <span>·</span>
                <span>발행: {publishedDate}</span>
              </>
            )}
          </div>
        }
      />
      <div className="bg-gray-50">
        {/* 메인 콘텐츠 */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* 메타 정보 카드 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              게시글 정보
            </h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Slug</dt>
                <dd className="font-mono text-gray-900 mt-1">/{post.slug}</dd>
              </div>
              <div>
                <dt className="text-gray-500">상태</dt>
                <dd className="mt-1">
                  {post.status === PostStatus.PUBLISHED ? '발행됨' : '임시저장'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">작성일</dt>
                <dd className="text-gray-900 mt-1">{formattedDate}</dd>
              </div>
              <div>
                <dt className="text-gray-500">발행일</dt>
                <dd className="text-gray-900 mt-1">{publishedDate || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* 썸네일 */}
          {post.ogImageUrl && (
            <div className="mb-8">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.ogImageUrl}
                  alt={post.title || '썸네일'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* 제목 및 부제목 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {post.title || <span className="text-gray-400">(제목없음)</span>}
            </h1>
            {post.subtitle && <p className="text-lg text-gray-600">{post.subtitle}</p>}
          </div>

          {/* 본문 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              본문
            </h2>
            <PostContent html={post.contentHtml} />
          </div>
        </div>
      </div>
    </>
  );
}
