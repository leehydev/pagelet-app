'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 에러를 발생시키는 컴포넌트
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('테스트 에러가 발생했습니다! 이것은 의도적으로 발생시킨 에러입니다.');
  }
  return null;
}

export default function ErrorTestPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">에러 테스트 페이지</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">에러 바운더리 테스트</h2>
          <p className="text-gray-600 mb-4">
            아래 버튼을 클릭하면 의도적으로 에러를 발생시켜 에러 바운더리가 작동하는지 확인할 수 있습니다.
          </p>
          
          <button
            onClick={() => setShouldThrow(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            에러 발생시키기
          </button>
        </div>

        <ErrorBoundary>
          <ErrorThrower shouldThrow={shouldThrow} />
          {!shouldThrow && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">✅ 정상 상태입니다. 에러가 없습니다.</p>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
