'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface ValidationTextareaProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<React.ComponentProps<typeof Textarea>, 'name'> {
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
  orientation?: 'vertical' | 'horizontal' | 'responsive';
  containerClassName?: string;
}

function ValidationTextareaInner<TFieldValues extends FieldValues = FieldValues>(
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
  }: ValidationTextareaProps<TFieldValues>,
  ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();

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
            <Textarea
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
              onChange={e => {
                field.onChange(e);
                props.onChange?.(e);
              }}
              onBlur={e => {
                field.onBlur();
                props.onBlur?.(e);
              }}
            />
            {description && !hasError && (
              <FieldDescription id={`${name}-description`}>{description}</FieldDescription>
            )}
            <FieldError id={`${name}-error`}>{hasError ? error.message : ''}</FieldError>
          </div>
        </Field>
      )}
    />
  );
}

/**
 * React Hook Form + Zod 유효성 검사를 지원하는 Textarea 컴포넌트
 *
 * @example
 * ```tsx
 * import { z } from "zod"
 * import { useForm, FormProvider } from "react-hook-form"
 * import { zodResolver } from "@hookform/resolvers/zod"
 * import { ValidationTextarea } from "@/components/form/ValidationTextarea"
 *
 * const schema = z.object({
 *   content: z.string().min(10, "최소 10자 이상 입력해주세요"),
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
 *         <ValidationTextarea
 *           name="content"
 *           label="내용"
 *           placeholder="내용을 입력하세요"
 *         />
 *       </form>
 *     </FormProvider>
 *   )
 * }
 * ```
 */
export const ValidationTextarea = forwardRef(ValidationTextareaInner) as <
  TFieldValues extends FieldValues = FieldValues,
>(
  props: ValidationTextareaProps<TFieldValues> & {
    ref?: React.ForwardedRef<HTMLTextAreaElement>;
  },
) => React.ReactElement;
