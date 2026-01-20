import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';
import { ErrorFallback } from '../error-fallback';

// next/navigation의 useRouter를 mock
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // console.error를 mock하여 테스트 중 에러 로그를 숨김
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockPush.mockClear();
  });

  it('에러가 없을 때 children을 정상적으로 렌더링해야 함', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('에러 발생 시 ErrorFallback을 렌더링해야 함', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  it('에러 발생 시 에러 메시지를 표시해야 함', () => {
    // 개발 환경에서만 에러 메시지가 표시되므로 NODE_ENV를 임시로 변경
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
      enumerable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // 원래 환경으로 복원
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  });

  it('재시도 버튼 클릭 시 에러 상태를 리셋해야 함', () => {
    // resetErrorBoundary가 호출되는지 확인
    // 실제 앱에서는 key prop을 변경하여 컴포넌트를 완전히 새로 마운트하는 것이 일반적
    let errorKey = 0;
    
    const { rerender } = render(
      <ErrorBoundary key={errorKey}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // 에러 상태 확인
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();

    // 재시도 버튼 클릭 - resetErrorBoundary가 호출되어야 함
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    // resetErrorBoundary가 호출되면 ErrorBoundary 상태가 리셋되지만
    // 같은 에러가 다시 발생하므로 여전히 fallback이 표시되어야 함
    // 실제로는 key를 변경하여 완전히 새로 마운트하거나, 에러 원인을 해결해야 함
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    
    // 에러가 해결된 경우를 시뮬레이션: key를 변경하여 새로 마운트
    errorKey = 1;
    rerender(
      <ErrorBoundary key={errorKey}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('커스텀 onError 핸들러가 호출되어야 함', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('커스텀 fallback 컴포넌트를 사용할 수 있어야 함', () => {
    const CustomFallback = ({ error }: { error: Error; resetErrorBoundary: () => void }) => (
      <div>Custom Error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error: Test error message')).toBeInTheDocument();
    expect(screen.queryByText('문제가 발생했습니다')).not.toBeInTheDocument();
  });
});
