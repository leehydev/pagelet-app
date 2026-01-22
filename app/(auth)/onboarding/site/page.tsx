'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { createSite, checkSlugAvailability, completeOnboarding } from '@/lib/api';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Zod 스키마 정의
const siteSchema = z.object({
  name: z
    .string()
    .min(1, '사이트 이름을 입력해주세요')
    .max(20, '사이트 이름은 최대 20자까지 입력 가능합니다')
    .trim(),
  slug: z
    .string()
    .min(1, 'slug를 입력해주세요')
    .min(3, 'slug는 최소 3자 이상이어야 합니다')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'slug는 영소문자, 숫자, 하이픈만 사용할 수 있습니다')
    .trim(),
});

type SiteFormData = z.infer<typeof siteSchema>;

export default function SitePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const methods = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const slug = useWatch({ control: methods.control, name: 'slug' });
  const slugError = methods.formState.errors.slug;
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>(
    'idle',
  );

  const debouncedSlug = useDebounce(slug, 500);

  // slug 중복 체크
  const checkSlug = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      return 'idle';
    }

    // 형식 체크
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slugToCheck)) {
      return 'unavailable';
    }

    const isAvailable = await checkSlugAvailability(slugToCheck);
    return isAvailable ? 'available' : 'unavailable';
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!debouncedSlug) {
      queueMicrotask(() => {
        if (!cancelled) {
          setSlugStatus('idle');
        }
      });
      return;
    }

    const validateAndCheck = async () => {
      setSlugStatus('checking');
      const status = await checkSlug(debouncedSlug);

      if (!cancelled) {
        setSlugStatus(status);
        // slug가 사용 불가능하면 에러 설정
        if (status === 'unavailable' && debouncedSlug.length >= 3) {
          methods.setError('slug', {
            type: 'manual',
            message: '이미 사용 중이거나 사용할 수 없는 slug입니다',
          });
        } else if (status === 'available') {
          methods.clearErrors('slug');
        }
      }
    };

    validateAndCheck();

    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, checkSlug, methods]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      await createSite(data);
      await completeOnboarding();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      router.push('/admin');
    },
  });

  const onSubmit = (data: SiteFormData) => {
    if (slugStatus !== 'available') {
      methods.setError('slug', {
        type: 'manual',
        message: 'slug 사용 가능 여부를 확인해주세요',
      });
      return;
    }
    mutation.mutate({ name: data.name.trim(), slug: data.slug.trim() });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    methods.setValue('slug', value, { shouldValidate: true });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">홈페이지 생성</h2>
          <p className="text-sm text-gray-500">나만의 홈페이지 주소를 만들어보세요</p>
        </div>

        <div className="space-y-4">
          <ValidationInput
            name="name"
            label="사이트 이름"
            type="text"
            placeholder="내 블로그"
            maxLength={20}
            required
          />

          <div>
            <Field data-invalid={!!slugError}>
              <FieldLabel htmlFor="slug">
                서브도메인 (slug) <span className="text-red-500">*</span>
              </FieldLabel>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-2">https://</span>
                  <Controller
                    name="slug"
                    control={methods.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="slug"
                        value={field.value ?? ''}
                        onChange={handleSlugChange}
                        className="flex-1"
                        placeholder="my-blog"
                        aria-invalid={!!slugError}
                      />
                    )}
                  />
                  <span className="text-gray-500 text-sm ml-2">.pagelet.kr</span>
                </div>

                {/* Slug 상태 표시 */}
                <div className="text-sm">
                  {slugStatus === 'checking' && <span className="text-gray-500">확인 중...</span>}
                  {slugStatus === 'available' && !slugError && (
                    <span className="text-green-600">사용 가능합니다</span>
                  )}
                  {slugStatus === 'unavailable' && !slugError && (
                    <span className="text-red-500">사용할 수 없는 slug입니다</span>
                  )}
                </div>

                <FieldError>{slugError?.message || ''}</FieldError>

                <p className="text-xs text-gray-500">
                  영소문자, 숫자, 하이픈(-)만 사용 가능합니다. 3~50자
                </p>
              </div>
            </Field>
          </div>

          {/* 미리보기 */}
          {slug && slugStatus === 'available' && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">미리보기</p>
              <p className="text-lg font-medium text-primary">https://{slug}.pagelet.kr</p>
            </div>
          )}
        </div>

        {mutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">오류가 발생했습니다. 다시 시도해주세요.</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || slugStatus !== 'available'}
        >
          {mutation.isPending ? '생성 중...' : '다음'}
        </Button>
      </form>
    </FormProvider>
  );
}
