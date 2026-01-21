'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminCategories, useUpdateCategory } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { UpdateCategoryRequest } from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const updateCategory = useUpdateCategory();

  const [error, setError] = useState<string | null>(null);

  const category = categories?.find((c) => c.id === categoryId);
  const isDefault = category?.slug === 'uncategorized';

  // category가 변경될 때만 formData 초기화를 위한 ref
  const prevCategoryIdRef = useRef<string | undefined>(undefined);
  const [formData, setFormData] = useState<UpdateCategoryRequest>({
    name: '',
    description: '',
  });

  // category가 변경되었을 때만 formData 업데이트
  // 외부 데이터(category)가 변경될 때 state를 동기화하는 것은 useEffect의 올바른 사용 사례입니다
  useEffect(() => {
    // category가 없거나 이전과 같은 경우 업데이트하지 않음
    if (!category || category.id === prevCategoryIdRef.current) {
      return;
    }

    // category가 변경되었을 때만 업데이트
    prevCategoryIdRef.current = category.id;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      name: category.name,
      description: category.description || '',
    });
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('이름은 필수입니다.');
      return;
    }

    try {
      await updateCategory.mutateAsync({ id: categoryId, data: formData });
      router.push('/admin/categories');
    } catch (err) {
      setError(getErrorDisplayMessage(err, '카테고리 수정에 실패했습니다.'));
    }
  };

  if (categoriesLoading) {
    return (
      <div>
        <AdminPageHeader breadcrumb="Management" title="Edit Category" />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div>
        <AdminPageHeader breadcrumb="Management" title="Edit Category" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            카테고리를 찾을 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader breadcrumb="Management" title="Edit Category" />
      <div className="p-6">
        <div className="max-w-2xl">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Field>
                <FieldLabel htmlFor="name">이름 *</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={255}
                  required
                />
              </Field>

              {!isDefault && (
                <Field>
                  <FieldLabel htmlFor="slug">Slug</FieldLabel>
                  <Input
                    id="slug"
                    value={formData.slug || category.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                    }
                    maxLength={255}
                  />
                  <FieldDescription>
                    기본 카테고리는 slug를 변경할 수 없습니다. 영소문자, 숫자, 하이픈만 사용
                    가능합니다.
                  </FieldDescription>
                </Field>
              )}

              {isDefault && (
                <Field>
                  <FieldLabel htmlFor="slug-disabled">Slug</FieldLabel>
                  <Input id="slug-disabled" value={category.slug} disabled />
                  <FieldDescription>기본 카테고리의 slug는 변경할 수 없습니다.</FieldDescription>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="description">설명 (선택)</FieldLabel>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateCategory.isPending}
                >
                  취소
                </Button>
                <Button type="submit" disabled={updateCategory.isPending}>
                  {updateCategory.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
