'use client';

import { Plus } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';

export function PostsPageHeader() {
  return (
    <AdminPageHeader
      breadcrumb="Management"
      title="All Posts"
      action={{
        label: 'New Post',
        href: '/admin/posts/new',
        icon: Plus,
      }}
    />
  );
}
