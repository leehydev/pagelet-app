import AuthHeader from '@/components/layout/AuthHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f7f7f7] min-h-screen">
      <AuthHeader />
      {children}
    </div>
  );
}
