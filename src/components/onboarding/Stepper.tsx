'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Step {
  id: number;
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { id: 1, label: '프로필 입력', path: '/onboarding/profile' },
  { id: 2, label: '홈페이지 생성', path: '/onboarding/site' },
  { id: 3, label: '첫 글 작성', path: '/onboarding/first-post' },
];

interface StepperProps {
  currentStep: number;
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isClickable = isCompleted;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            {isClickable ? (
              <Link
                href={step.path}
                className={cn(
                  'flex items-center gap-2 group cursor-pointer',
                )}
              >
                <StepCircle
                  step={step.id}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
                <StepLabel
                  label={step.label}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <StepCircle
                  step={step.id}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
                <StepLabel
                  label={step.label}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
              </div>
            )}

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-2',
                  step.id < currentStep ? 'bg-primary' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCircle({
  step,
  isActive,
  isCompleted,
}: {
  step: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
        isActive && 'bg-primary text-primary-foreground',
        isCompleted && 'bg-primary/80 text-primary-foreground',
        !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
      )}
    >
      {isCompleted ? (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        step
      )}
    </div>
  );
}

function StepLabel({
  label,
  isActive,
  isCompleted,
}: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <span
      className={cn(
        'text-sm hidden sm:inline',
        isActive && 'font-medium text-gray-900',
        isCompleted && 'text-gray-700',
        !isActive && !isCompleted && 'text-gray-400'
      )}
    >
      {label}
    </span>
  );
}
