interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TenantHomePage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          Tenant Home
        </h1>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              테넌트 슬러그: <span className="font-semibold">{slug || "(없음)"}</span>
            </p>
            <p className="text-sm text-gray-500">
              {slug ? `${slug}.pagelet-dev.kr/home` : "pagelet-dev.kr/home"}
            </p>
          </div>
          <p className="text-sm text-center text-gray-500 mt-4">
            이 페이지는 /t/{slug || "[slug]"}/home으로 rewrite되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
