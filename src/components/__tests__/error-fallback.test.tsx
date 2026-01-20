import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from '../error-fallback';
import * as nextNavigation from 'next/navigation';

// next/navigation의 useRouter를 mock
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ErrorFallback', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('에러 메시지를 표시해야 함', () => {
    const error = new Error('Test error message');
    const resetErrorBoundary = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  it('개발 환경에서 에러 메시지와 스택 트레이스를 표시해야 함', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
      enumerable: true,
    });

    const error = new Error('Test error message');
    error.stack = 'Error: Test error message\n    at test.js:1:1';
    const resetErrorBoundary = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('스택 트레이스 보기')).toBeInTheDocument();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  });

  it('재시도 버튼 클릭 시 resetErrorBoundary가 호출되어야 함', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('홈으로 이동 버튼 클릭 시 router.push가 호출되어야 함', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    const homeButton = screen.getByText('홈으로 이동');
    fireEvent.click(homeButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('아이콘이 표시되어야 함', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    const { container } = render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    // AlertTriangle 아이콘은 SVG로 렌더링되므로 container에서 확인
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('버튼들이 올바르게 렌더링되어야 함', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    expect(screen.getByText('다시 시도')).toBeInTheDocument();
    expect(screen.getByText('홈으로 이동')).toBeInTheDocument();
  });
});
