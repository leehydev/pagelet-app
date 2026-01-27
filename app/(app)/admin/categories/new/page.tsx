'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteId } from '@/stores/site-store';
import { useCreateCategory } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { CreateCategoryRequest } from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';

export default function NewCategoryPage() {
  const router = useRouter();
  const siteId = useSiteId();

  const createCategory = useCreateCategory(siteId);

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    slug: '',
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.slug || !formData.name) {
      setError('Slug와 이름은 필수입니다.');
      return;
    }

    try {
      await createCategory.mutateAsync(formData);
      router.push('/admin/categories');
    } catch (err) {
      setError(getErrorDisplayMessage(err, '카테고리 생성에 실패했습니다.'));
    }
  };

  return (
    <>
      <AdminPageHeader breadcrumb="Management" title="New Category" />
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
                <FieldLabel htmlFor="slug">Slug *</FieldLabel>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="category-slug"
                  maxLength={255}
                  required
                />
                <FieldDescription>
                  영소문자, 숫자, 하이픈만 사용 가능합니다. 예약어(all, uncategorized 등)는 사용할
                  수 없습니다.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="name">이름 *</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="카테고리 이름"
                  maxLength={255}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">설명 (선택)</FieldLabel>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="카테고리 설명"
                />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createCategory.isPending}
                >
                  취소
                </Button>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending ? '생성 중...' : '생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
