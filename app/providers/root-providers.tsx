'use client';

import { Toaster } from 'sonner';

import { AuthShell } from '@/components/app/layout/AuthShell';
import { GlobalModal } from '@/components/app/modal/GlobalModal';
import { ReactQueryProvider } from '@/lib/react-query';
import { ThemeProvider } from './theme-provider';
import { useMounted } from '@/hooks/use-mounted';

export function RootProviders({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();

  return (
    <ThemeProvider>
      <ReactQueryProvider>
        <AuthShell>
          {children}
        </AuthShell>
        <GlobalModal />
        {mounted && (
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: 'bg-card border border-border shadow-lg',
                title: 'text-foreground',
                description: 'text-muted-foreground',
                success:
                  'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
                error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
              },
            }}
            richColors
          />
        )}
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
