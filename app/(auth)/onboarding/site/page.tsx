'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { createSite, checkSlugAvailability } from '@/lib/api';

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

export default function SitePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

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
      // 비동기로 상태 업데이트하여 cascading renders 방지
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
      }
    };

    validateAndCheck();

    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, checkSlug]);

  const mutation = useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      router.push('/onboarding/first-post');
    },
  });

  const validate = () => {
    const newErrors: { name?: string; slug?: string } = {};

    if (!name.trim()) {
      newErrors.name = '사이트 이름을 입력해주세요';
    }

    if (!slug.trim()) {
      newErrors.slug = 'slug를 입력해주세요';
    } else if (slug.length < 3) {
      newErrors.slug = 'slug는 최소 3자 이상이어야 합니다';
    } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      newErrors.slug = 'slug는 영소문자, 숫자, 하이픈만 사용할 수 있습니다';
    } else if (slugStatus === 'unavailable') {
      newErrors.slug = '이미 사용 중이거나 사용할 수 없는 slug입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (slugStatus !== 'available') return;

    mutation.mutate({ name: name.trim(), slug: slug.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          홈페이지 생성
        </h2>
        <p className="text-sm text-gray-500">
          나만의 홈페이지 주소를 만들어보세요
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            사이트 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="내 블로그"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            서브도메인 (slug) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 text-sm mr-2">https://</span>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={handleSlugChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="my-blog"
            />
            <span className="text-gray-500 text-sm ml-2">.pagelet.kr</span>
          </div>
          
          {/* Slug 상태 표시 */}
          <div className="mt-1 text-sm">
            {slugStatus === 'checking' && (
              <span className="text-gray-500">확인 중...</span>
            )}
            {slugStatus === 'available' && (
              <span className="text-green-600">사용 가능합니다</span>
            )}
            {slugStatus === 'unavailable' && !errors.slug && (
              <span className="text-red-500">사용할 수 없는 slug입니다</span>
            )}
          </div>

          {errors.slug && (
            <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            영소문자, 숫자, 하이픈(-)만 사용 가능합니다. 3~50자
          </p>
        </div>

        {/* 미리보기 */}
        {slug && slugStatus === 'available' && (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">미리보기</p>
            <p className="text-lg font-medium text-primary">
              https://{slug}.pagelet.kr
            </p>
          </div>
        )}
      </div>

      {mutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            오류가 발생했습니다. 다시 시도해주세요.
          </p>
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
  );
}
