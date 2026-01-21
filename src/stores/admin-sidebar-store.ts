'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AdminSidebarState {
  isSidebarOpen: boolean;
}

interface AdminSidebarActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

type AdminSidebarStore = AdminSidebarState & AdminSidebarActions;

export const useAdminSidebarStore = create<AdminSidebarStore>()(
  devtools(
    (set) => ({
      isSidebarOpen: true,

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, 'toggleSidebar'),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }, false, 'setSidebarOpen'),
    }),
    { name: 'admin-sidebar-store' },
  ),
);
