'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { BannerList } from '@/components/app/banners/BannerList';
import { BannerFormSheet } from '@/components/app/banners/BannerFormSheet';
import { useAdminBanners } from '@/hooks/use-banners';
import { Plus } from 'lucide-react';

export default function AdminBannersPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 기존 배너의 게시글 ID 목록 가져오기
  const { data: banners, error: bannersError } = useAdminBanners(siteId);
  const existingPostIds = banners?.map((b) => b.postId) || [];

  // 배너 데이터 로드 실패 시 배너 추가 비활성화 (중복 등록 방지)
  const canAddBanner = !bannersError;

  const handleAddBanner = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb="Management"
        title="배너 관리"
        action={canAddBanner ? {
          label: '배너 추가',
          onClick: handleAddBanner,
          icon: Plus,
        } : undefined}
      />
      <div className="p-6">
        <BannerList siteId={siteId} />
      </div>
      <BannerFormSheet
        siteId={siteId}
        existingPostIds={existingPostIds}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormClose}
      />
    </>
  );
}
