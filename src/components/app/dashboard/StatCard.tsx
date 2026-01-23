import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, icon, className }: StatCardProps) {
  // 숫자인 경우 천 단위 구분자 추가
  const formattedValue = typeof value === 'number' ? value.toLocaleString('ko-KR') : value;

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{formattedValue}</div>
      {change && (
        <div
          className={cn(
            'mt-1 text-sm font-medium',
            change.isPositive ? 'text-green-600' : 'text-red-600',
          )}
        >
          {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
          <span className="text-gray-400 ml-1 font-normal">전일 대비</span>
        </div>
      )}
    </div>
  );
}
