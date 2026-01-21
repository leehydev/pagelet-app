'use client';

import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/form/ValidationInput';
import { ValidationTextarea } from '@/components/form/ValidationTextarea';
import { createPost, completeOnboarding, skipFirstPost } from '@/lib/api';

// Zod 스키마 정의
const firstPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').trim(),
  content: z.string().min(1, '내용을 입력해주세요').trim(),
});

type FirstPostFormData = z.infer<typeof firstPostSchema>;

export default function FirstPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const methods = useForm<FirstPostFormData>({
    resolver: zodResolver(firstPostSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: FirstPostFormData) => {
      // 간단한 텍스트를 tiptap JSON 형식으로 변환
      const contentText = data.content.trim();
      
      // 줄바꿈으로 분리하여 각 줄을 paragraph로 변환
      const lines = contentText.split('\n').filter((line) => line.trim() || line === '');
      const paragraphs = lines.map((line) => {
        if (line.trim()) {
          return {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: line.trim(),
              },
            ],
          };
        } else {
          // 빈 줄은 빈 paragraph로
          return {
            type: 'paragraph',
          };
        }
      });

      const contentJson: Record<string, any> = {
        type: 'doc',
        content: paragraphs.length > 0 ? paragraphs : [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: contentText,
              },
            ],
          },
        ],
      };

      // HTML로 변환 (줄바꿈 처리)
      const contentHtml = lines
        .map((line) => (line.trim() ? `<p>${line.trim()}</p>` : '<p></p>'))
        .join('');

      await createPost({
        title: data.title.trim(),
        subtitle: data.title.trim(), // 부제목은 제목과 동일하게
        contentJson,
        contentHtml,
        contentText,
        categoryId: 'uncategorized',
      });
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

  const onSubmit = (data: FirstPostFormData) => {
    createPostMutation.mutate(data);
  };

  const handleSkip = () => {
    skipMutation.mutate();
  };

  const isPending = createPostMutation.isPending || skipMutation.isPending;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">첫 글 작성</h2>
          <p className="text-sm text-gray-500">
            첫 번째 글을 작성해보세요. 나중에 작성해도 괜찮아요.
          </p>
        </div>

        <div className="space-y-4">
          <ValidationInput
            name="title"
            label="제목"
            type="text"
            placeholder="첫 번째 글의 제목을 입력하세요"
            required
          />
          <ValidationTextarea
            name="content"
            label="내용"
            placeholder="내용을 입력하세요..."
            rows={8}
            required
          />
        </div>

        {(createPostMutation.error || skipMutation.error) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">오류가 발생했습니다. 다시 시도해주세요.</p>
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
          <Button type="submit" className="flex-1" disabled={isPending}>
            {createPostMutation.isPending ? '작성 중...' : '작성 완료'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
