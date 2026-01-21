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
      await createPost({ title: data.title.trim(), content: data.content.trim() });
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
          <Button type="submit" className="flex-1" disabled={isPending}>
            {createPostMutation.isPending ? '작성 중...' : '작성 완료'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
