'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { BannerList } from '@/components/app/banners/BannerList';
import { BannerFormSheet } from '@/components/app/banners/BannerFormSheet';
import { Plus } from 'lucide-react';
import { DeviceType } from '@/lib/api';

export default function AdminBannersPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DeviceType>('desktop');

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
        <BannerList
          siteId={siteId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      <BannerFormSheet
        siteId={siteId}
        deviceType={activeTab}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormClose}
      />
    </>
  );
}
