'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface HeaderAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface AdminHeaderConfig {
  breadcrumb: string;
  title: string;
  action?: HeaderAction;
  extra?: ReactNode;
}

interface AdminHeaderState {
  config: AdminHeaderConfig | null;
  isSidebarOpen: boolean;
}

interface AdminHeaderActions {
  setHeader: (config: AdminHeaderConfig) => void;
  clearHeader: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

type AdminHeaderStore = AdminHeaderState & AdminHeaderActions;

export const useAdminHeaderStore = create<AdminHeaderStore>()(
  devtools(
    (set) => ({
      config: null,
      isSidebarOpen: true,

      setHeader: (config) => set({ config }, false, 'setHeader'),

      clearHeader: () => set({ config: null }, false, 'clearHeader'),

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, 'toggleSidebar'),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }, false, 'setSidebarOpen'),
    }),
    { name: 'admin-header-store' },
  ),
);
