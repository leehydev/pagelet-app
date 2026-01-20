'use client';

import Link from 'next/link';
import { useAdminPosts } from '@/hooks/use-posts';
import { PostStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PostsPageHeader } from '@/components/layout/PostsPageHeader';
import Image from 'next/image';

export default function AdminPostsPage() {
  const { data: posts, isLoading, error } = useAdminPosts();

  if (isLoading) {
    return (
      <div>
        <PostsPageHeader />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PostsPageHeader />
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            게시글을 불러오는데 실패했습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PostsPageHeader />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Posts</h1>
        {/* 썸네일 이미지 추가 */}
        {posts && posts.length > 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    썸네일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {post.og_image_url && (
                          <div className="w-16 h-16 rounded-md overflow-hidden">
                            <Image
                              src={post.og_image_url}
                              alt={post.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-xs text-gray-500">
                        /{post.slug}
                        {post.og_image_url}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === PostStatus.PUBLISHED
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.status === PostStatus.PUBLISHED ? '발행됨' : '임시저장'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">아직 작성한 게시글이 없습니다.</p>
            <Link href="/admin/posts/new">
              <Button>첫 글 작성하기</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
