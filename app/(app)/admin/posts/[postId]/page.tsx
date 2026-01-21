'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAdminPost, PostStatus } from '@/lib/api';
import { PostContent } from '@/components/post/PostContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPostDate } from '@/lib/date-utils';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

export default function AdminPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const postId = params.postId;

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'post', postId],
    queryFn: () => getAdminPost(postId),
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">게시글을 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => router.push('/admin/posts')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = formatPostDate(post.createdAt);
  const publishedDate = post.publishedAt ? formatPostDate(post.publishedAt) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/posts"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {post.title || <span className="text-gray-400">(제목없음)</span>}
                </h1>
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
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/posts/${postId}/edit`}>
                <Button variant="outline">편집</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

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
              <img src={post.ogImageUrl} alt={post.title || '썸네일'} className="w-full h-full object-cover" />
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
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">본문</h2>
          <PostContent html={post.contentHtml} />
        </div>
      </div>
    </div>
  );
}
