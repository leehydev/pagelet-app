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
  const { data: banners } = useAdminBanners(siteId);
  const existingPostIds = banners?.map((b) => b.postId) || [];

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
        action={{
          label: '배너 추가',
          onClick: handleAddBanner,
          icon: Plus,
        }}
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
