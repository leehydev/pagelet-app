'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminCategories, useDeleteCategory } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Category } from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { QueryError } from '@/components/common/QueryError';
import { Plus } from 'lucide-react';

export default function AdminCategoriesPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const { data: categories, isLoading, error, refetch } = useAdminCategories(siteId);
  const deleteCategory = useDeleteCategory(siteId);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(id);
    } catch (err) {
      const message = getErrorDisplayMessage(err, '카테고리 삭제에 실패했습니다.');
      alert(message);
    }
  };

  const headerAction = {
    label: 'New Category',
    href: `/admin/${siteId}/categories/new`,
    icon: Plus,
  };

  if (isLoading) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Categories" action={headerAction} />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Categories" action={headerAction} />
        <div className="p-8">
          <QueryError
            error={error}
            onRetry={refetch}
            fallbackMessage="카테고리를 불러오는데 실패했습니다."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader breadcrumb="Management" title="Categories" action={headerAction} />
      <div className="p-6 w-full">
        <div className="">
          {/* 카테고리 목록 */}
          {categories && categories.length > 0 ? (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      게시글 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      siteId={siteId}
                      onDelete={() => handleDelete(category.id, category.name)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-4">아직 카테고리가 없습니다.</p>
              <Link href={`/admin/${siteId}/categories/new`}>
                <Button>첫 카테고리 만들기</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CategoryRow({
  category,
  siteId,
  onDelete,
}: {
  category: Category;
  siteId: string;
  onDelete: () => void;
}) {
  const isDefault = category.slug === 'uncategorized';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{category.name}</div>
        {isDefault && <div className="text-xs text-gray-500">(기본 카테고리)</div>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{category.slug}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{category.postCount || 0}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500">{category.description || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <Link href={`/admin/${siteId}/categories/${category.id}/edit`}>
            <Button variant="outline" size="sm">
              수정
            </Button>
          </Link>
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={!!category.postCount && category.postCount > 0}
            >
              삭제
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
