'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { createPost, completeOnboarding, skipFirstPost } from '@/lib/api';

export default function FirstPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const createPostMutation = useMutation({
    mutationFn: async () => {
      await createPost({ title: title.trim(), content: content.trim() });
      await completeOnboarding();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      router.push('/admin');
    },
  });

  const skipMutation = useMutation({
    mutationFn: skipFirstPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      router.push('/admin');
    },
  });

  const validate = () => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }

    if (!content.trim()) {
      newErrors.content = '내용을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    createPostMutation.mutate();
  };

  const handleSkip = () => {
    skipMutation.mutate();
  };

  const isPending = createPostMutation.isPending || skipMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          첫 글 작성
        </h2>
        <p className="text-sm text-gray-500">
          첫 번째 글을 작성해보세요. 나중에 작성해도 괜찮아요.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="첫 번째 글의 제목을 입력하세요"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            placeholder="내용을 입력하세요..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>
      </div>

      {(createPostMutation.error || skipMutation.error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            오류가 발생했습니다. 다시 시도해주세요.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleSkip}
          disabled={isPending}
        >
          {skipMutation.isPending ? '처리 중...' : '나중에 할게요'}
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isPending}
        >
          {createPostMutation.isPending ? '작성 중...' : '작성 완료'}
        </Button>
      </div>
    </form>
  );
}
