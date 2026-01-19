'use client';

export function KakaoLoginButton() {
  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/kakao`;
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        backgroundColor: '#FEE500',
        color: '#000',
        padding: '12px 16px',
        borderRadius: '8px',
        fontWeight: 600,
      }}
    >
      카카오로 로그인
    </button>
  );
}
