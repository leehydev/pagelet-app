'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePost } from '@/hooks/use-posts';
import { PostStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AxiosError } from 'axios';

export default function NewPostPage() {
  const router = useRouter();
  const createPost = useCreatePost();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [showSeo, setShowSeo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = () => {
    const generated = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    setSlug(generated || `post-${Date.now().toString(36)}`);
  };

  const handleSubmit = async (status: PostStatus) => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setError(null);

    try {
      await createPost.mutateAsync({
        title: title.trim(),
        slug: slug.trim() || undefined,
        content: content.trim(),
        status,
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        og_image_url: ogImageUrl.trim() || undefined,
      });

      // 성공 시 목록으로 이동 (또는 성공 메시지 표시)
      router.push('/admin/posts');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>;
      if (axiosError.response?.status === 409) {
        setError('이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.');
      } else {
        setError(axiosError.response?.data?.message || '게시글 저장에 실패했습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 게시글 작성</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
              </label>
              <div className="flex gap-2">
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="url-friendly-slug (비워두면 자동 생성)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={255}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSlug}
                  disabled={!title.trim()}
                >
                  자동 생성
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                영소문자, 숫자, 하이픈만 사용 가능합니다.
              </p>
            </div>

            {/* 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="게시글 내용을 입력하세요"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
            </div>

            {/* SEO 섹션 (토글) */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowSeo(!showSeo)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span className="mr-2">{showSeo ? '▼' : '▶'}</span>
                SEO 설정 (선택)
              </button>

              {showSeo && (
                <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                  <div>
                    <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      SEO 제목
                    </label>
                    <input
                      id="seoTitle"
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="검색 엔진에 표시될 제목"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      SEO 설명
                    </label>
                    <textarea
                      id="seoDescription"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="검색 결과에 표시될 설명"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label htmlFor="ogImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      OG 이미지 URL
                    </label>
                    <input
                      id="ogImageUrl"
                      type="url"
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={500}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createPost.isPending}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(PostStatus.DRAFT)}
                disabled={createPost.isPending}
              >
                {createPost.isPending ? '저장 중...' : '임시 저장'}
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(PostStatus.PUBLISHED)}
                disabled={createPost.isPending}
              >
                {createPost.isPending ? '발행 중...' : '발행하기'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
