'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminBanners, useUpdateBannerOrder, useDeleteBanner } from '@/hooks/use-banners';
import { Banner } from '@/lib/api';
import { BannerCard } from './BannerCard';
import { BannerFormSheet } from './BannerFormSheet';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { QueryError } from '@/components/common/QueryError';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BannerListProps {
  siteId: string;
}

const MAX_BANNERS = 5;

export function BannerList({ siteId }: BannerListProps) {
  const { data: banners, isLoading, error, refetch } = useAdminBanners(siteId);
  const updateOrderMutation = useUpdateBannerOrder(siteId);
  const deleteMutation = useDeleteBanner(siteId);

  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !banners) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);

    const reordered = arrayMove(banners, oldIndex, newIndex);
    const bannerIds = reordered.map((b) => b.id);

    try {
      await updateOrderMutation.mutateAsync({ bannerIds });
      toast.success('순서가 변경되었습니다.');
    } catch (err) {
      const message = getErrorDisplayMessage(err, '순서 변경에 실패했습니다.');
      toast.error(message);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditBanner(banner);
  };

  const handleDelete = (banner: Banner) => {
    setDeleteTarget(banner);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('배너가 삭제되었습니다.');
      setDeleteTarget(null);
    } catch (err) {
      const message = getErrorDisplayMessage(err, '배너 삭제에 실패했습니다.');
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <QueryError error={error} onRetry={refetch} fallbackMessage="배너를 불러올 수 없습니다." />
    );
  }

  const bannerCount = banners?.length || 0;

  return (
    <div className="space-y-4">
      {/* 상태 표시 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          현재 {bannerCount}/{MAX_BANNERS}개 등록
        </p>
      </div>

      {/* 안내문구 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-700">
          발행된 게시글만 블로그 메인에 배너로 표시됩니다. 임시저장 또는 비공개 상태의 게시글은
          배너에 등록되어 있어도 표시되지 않습니다.
        </p>
      </div>

      {/* 배너 목록 */}
      <BannerListContent
        banners={banners || []}
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 수정 폼 */}
      <BannerFormSheet
        siteId={siteId}
        banner={editBanner || undefined}
        existingPostIds={(banners || []).map((b) => b.postId)}
        open={!!editBanner}
        onOpenChange={(open) => !open && setEditBanner(null)}
        onSuccess={() => setEditBanner(null)}
      />

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>배너 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface BannerListContentProps {
  banners: Banner[];
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
}

function BannerListContent({
  banners,
  sensors,
  onDragEnd,
  onEdit,
  onDelete,
}: BannerListContentProps) {
  if (banners.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">등록된 배너가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          상단의 &quot;배너 추가&quot; 버튼을 클릭하여 배너를 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4">
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner)}
            />
          ))}
        </div>
      </SortableContext>
      <p className="text-xs text-muted-foreground mt-4">* 드래그하여 순서를 변경할 수 있습니다.</p>
    </DndContext>
  );
}
