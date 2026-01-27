'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useSiteId } from '@/stores/site-store';
import { useAdminPosts } from '@/hooks/use-posts';
import { useAdminCategories } from '@/hooks/use-categories';
import { PostStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { DataPagination } from '@/components/common/DataPagination';
import { QueryError, QueryErrorInline } from '@/components/common/QueryError';
import Image from 'next/image';
import { Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export default function AdminPostsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = useSiteId();

  const [selectedCategoryId] = useState<string>('');
  const currentPage = Number(searchParams.get('page')) || 1;

  const { data, isLoading, error, refetch } = useAdminPosts(siteId, {
    categoryId: selectedCategoryId || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });
  const { error: categoriesError } = useAdminCategories(siteId);

  const posts = data?.items;
  const meta = data?.meta;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/posts?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <>
        <AdminPageHeader
          breadcrumb="Management"
          title="All Posts"
          action={{ label: 'New Post', href: '/admin/posts/new', icon: Plus }}
        />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminPageHeader
          breadcrumb="Management"
          title="All Posts"
          action={{ label: 'New Post', href: '/admin/posts/new', icon: Plus }}
        />
        <div className="p-8">
          <QueryError
            error={error}
            onRetry={refetch}
            fallbackMessage="게시글을 불러오는데 실패했습니다."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        breadcrumb="Management"
        title="All Posts"
        action={{ label: 'New Post', href: '/admin/posts/new', icon: Plus }}
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          {/* 카테고리 조회 에러 메시지 */}
          {categoriesError && (
            <QueryErrorInline
              error={categoriesError}
              fallbackMessage="카테고리 목록을 불러올 수 없습니다"
            />
          )}
        </div>
        {/* 썸네일 이미지 추가 */}
        {posts && posts.length > 0 ? (
          <>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-24 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      썸네일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 w-40 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 w-32 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 w-36 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="h-20 hover:bg-gray-50 cursor-pointer"
                      onClick={() => (window.location.href = `/admin/posts/${post.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="aspect-video h-14 rounded-md overflow-hidden">
                            <Image
                              src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
                              alt={post.title || '썸네일'}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.title || <span className="text-gray-400">(제목없음)</span>}
                        </Link>
                        <div className="text-xs text-gray-500">/{post.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{post.categoryName || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {post.status === PostStatus.PUBLISHED ? (
                            <>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                발행됨
                              </span>
                              {post.hasDraft && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  편집 중
                                </span>
                              )}
                            </>
                          ) : post.status === PostStatus.PRIVATE ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                post.hasDraft
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {post.hasDraft ? '작성 중' : '비공개'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              임시저장
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {dayjs(post.createdAt).format('YYYY-MM-DD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {meta && (
              <DataPagination
                meta={meta}
                onPageChange={handlePageChange}
                itemLabel="게시글"
                className="mt-6"
              />
            )}
          </>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">아직 작성한 게시글이 없습니다.</p>
            <Link href="/admin/posts/new">
              <Button>첫 글 작성하기</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
