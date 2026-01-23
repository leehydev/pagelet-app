'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { updateProfile } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

// Zod 스키마 정의
const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').trim(),
  email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다').trim(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, error } = useUser();

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // 사용자 데이터 로드 시 폼에 반영
  useEffect(() => {
    if (user) {
      methods.reset({
        name: user.name || '',
        email: '',
      });
    }
  }, [user, methods]);

  // 에러 상태 처리
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">프로필 입력</h2>
          <p className="text-sm text-gray-500">나중에 언제든지 변경할 수 있어요</p>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            사용자 정보를 불러오는데 실패했습니다. 다시 시도해주세요.
          </p>
        </div>
        <Button type="button" className="w-full" onClick={() => router.push('/signin')}>
          로그인 페이지로 이동
        </Button>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">프로필 입력</h2>
          <p className="text-sm text-gray-500">나중에 언제든지 변경할 수 있어요</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      router.push('/onboarding/site');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate({ name: data.name.trim(), email: data.email.trim() });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">프로필 입력</h2>
          <p className="text-sm text-gray-500">나중에 언제든지 변경할 수 있어요</p>
        </div>

        <div className="space-y-4">
          <ValidationInput name="name" label="이름" type="text" placeholder="홍길동" required />
          <ValidationInput
            name="email"
            label="이메일"
            type="email"
            placeholder="example@email.com"
            required
          />
        </div>

        {mutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">오류가 발생했습니다. 다시 시도해주세요.</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? '저장 중...' : '다음'}
        </Button>
      </form>
    </FormProvider>
  );
}
