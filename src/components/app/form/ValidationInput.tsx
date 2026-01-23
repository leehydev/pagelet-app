'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ValidationInputProps<TFieldValues extends FieldValues = FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  'name'
> {
  /** react-hook-form 필드 이름 */
  name: FieldPath<TFieldValues>;
  /** 라벨 텍스트 */
  label?: string;
  /** 설명 텍스트 */
  description?: string;
  /** 필수 필드 여부 (라벨에 "(필수)" 표시) */
  required?: boolean;
  /** 라벨 숨김 여부 (스크린 리더용) */
  hideLabel?: boolean;
  /** 필드 방향 */
  orientation?: 'vertical' | 'horizontal' | 'responsive';
  /** 컨테이너 className */
  containerClassName?: string;
}

function ValidationInputInner<TFieldValues extends FieldValues = FieldValues>(
  {
    name,
    label,
    description,
    required = false,
    hideLabel = false,
    orientation = 'vertical',
    containerClassName,
    className,
    disabled,
    ...props
  }: ValidationInputProps<TFieldValues>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();

  // 중첩된 필드 이름 지원 (예: "user.email")
  const fieldError = name.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, errors);

  const error = fieldError as { message?: string } | undefined;
  const hasError = !!error?.message;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field
          orientation={orientation}
          data-invalid={hasError}
          data-disabled={disabled}
          className={containerClassName}
        >
          {label && (
            <FieldLabel htmlFor={name} className={cn(hideLabel && 'sr-only')}>
              {label}
              {required && (
                <span className="text-red-500 dark:text-red-300 text-xs font-normal">(필수)</span>
              )}
            </FieldLabel>
          )}
          <div className="flex flex-col gap-1.5">
            <Input
              {...props}
              {...field}
              ref={ref}
              id={name}
              disabled={disabled}
              aria-invalid={hasError}
              aria-describedby={
                hasError ? `${name}-error` : description ? `${name}-description` : undefined
              }
              className={className}
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e);
                props.onChange?.(e);
              }}
              onBlur={(e) => {
                field.onBlur();
                props.onBlur?.(e);
              }}
            />
            {description && !hasError && (
              <FieldDescription id={`${name}-description`}>{description}</FieldDescription>
            )}
            <FieldError className="text-xs" id={`${name}-error`}>
              {hasError ? error.message : ''}
            </FieldError>
          </div>
        </Field>
      )}
    />
  );
}

/**
 * React Hook Form + Zod 유효성 검사를 지원하는 Input 컴포넌트
 *
 * @example
 * ```tsx
 * import { z } from "zod"
 * import { useForm, FormProvider } from "react-hook-form"
 * import { zodResolver } from "@hookform/resolvers/zod"
 * import { ValidationInput } from "@/components/form/ValidationInput"
 *
 * const schema = z.object({
 *   email: z.string().email("올바른 이메일을 입력해주세요"),
 *   password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
 * })
 *
 * function MyForm() {
 *   const methods = useForm({
 *     resolver: zodResolver(schema),
 *   })
 *
 *   return (
 *     <FormProvider {...methods}>
 *       <form onSubmit={methods.handleSubmit(onSubmit)}>
 *         <ValidationInput
 *           name="email"
 *           label="이메일"
 *           type="email"
 *           placeholder="example@email.com"
 *         />
 *         <ValidationInput
 *           name="password"
 *           label="비밀번호"
 *           type="password"
 *           description="8자 이상 입력해주세요"
 *         />
 *       </form>
 *     </FormProvider>
 *   )
 * }
 * ```
 */
export const ValidationInput = forwardRef(ValidationInputInner) as <
  TFieldValues extends FieldValues = FieldValues,
>(
  props: ValidationInputProps<TFieldValues> & {
    ref?: React.ForwardedRef<HTMLInputElement>;
  },
) => React.ReactElement;
