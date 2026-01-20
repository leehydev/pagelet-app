export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          Sign In
        </h1>
        <p className="text-center text-gray-600 mb-4">
          app.pagelet-dev.kr/signin
        </p>
        <p className="text-sm text-center text-gray-500">
          이 페이지는 (app) route group에 있습니다.
        </p>
      </div>
    </div>
  );
}
