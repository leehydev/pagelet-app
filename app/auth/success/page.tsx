'use client';

import { useEffect, useState } from 'react';

export default function AuthSuccessPage() {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hello`,
        {
            credentials: 'include',
        },
    )
    .then((res) => res.text())
    .then((data) => setMessage(data))
    .catch((err) => setMessage('에러: ' + err.message));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">✅ 로그인 성공!</h1>
        <p className="text-gray-500">환영합니다</p>
        <p className="mt-4 text-sm">{message || '로딩중...'}</p>
      </div>
    </div>
  );
}
