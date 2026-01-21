import type { FieldErrors, FieldValues } from 'react-hook-form';

/**
 * 첫 번째 에러 필드 이름을 찾는 헬퍼 함수
 */
export function findFirstErrorField(
  errors: FieldErrors<FieldValues> | Record<string, unknown>,
  prefix = '',
): string | null {
  for (const [key, value] of Object.entries(errors)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    // 에러 메시지가 있는 경우 (최종 에러 필드)
    if (value && typeof value === 'object' && 'message' in value && value.message) {
      return fieldPath;
    }

    // 중첩된 객체나 배열인 경우 재귀적으로 탐색
    if (value && typeof value === 'object') {
      // react-hook-form은 배열 필드를 객체로 저장 (키가 "0", "1" 등)
      // 또는 일반 객체인 경우
      const result = findFirstErrorField(value as Record<string, unknown>, fieldPath);
      if (result) return result;
    }
  }
  return null;
}

/**
 * 에러 메시지 텍스트로 에러 요소를 찾는 함수
 */
function findErrorElementByMessage(errorMessage: string): HTMLElement | null {
  // data-slot="field-error" 속성을 가진 모든 에러 요소 찾기
  const errorElements = document.querySelectorAll<HTMLElement>('[data-slot="field-error"]');

  for (const errorElement of errorElements) {
    // 요소의 텍스트 내용 가져오기 (하위 요소 포함)
    const textContent = errorElement.textContent?.trim() || '';

    // 에러 메시지가 포함되어 있는지 확인
    if (textContent.includes(errorMessage)) {
      return errorElement;
    }
  }

  return null;
}

/**
 * 에러 요소로부터 관련된 입력 필드를 찾아서 스크롤하는 함수
 */
function scrollToErrorElement(errorElement: HTMLElement): void {
  // 에러 요소를 먼저 스크롤
  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 스크롤 애니메이션이 완전히 끝난 후 포커스
  setTimeout(() => {
    // 에러 요소의 부모 Field 컴포넌트 내에서 input/textarea 찾기
    // Field 컴포넌트는 보통 에러 요소의 조상 요소
    let parent = errorElement.parentElement;
    while (parent) {
      // Field 컴포넌트 내에서 input이나 textarea 찾기
      const input = parent.querySelector('input, textarea') as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

      if (input) {
        input.focus({ preventScroll: true });
        return;
      }

      // Field 컴포넌트의 경계를 넘어가면 중단
      // (일반적으로 Field는 특정 클래스나 data 속성을 가짐)
      if (parent.hasAttribute('data-invalid')) {
        // Field 컴포넌트를 찾았지만 input을 못 찾은 경우, 더 상위로 이동
        parent = parent.parentElement;
        continue;
      }

      parent = parent.parentElement;
    }
  }, 600);
}

/**
 * 첫 번째 에러 필드로 스크롤 이동
 * @param errors - FieldErrors 객체 또는 에러 메시지 문자열
 */
export function scrollToFirstError<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues> | string,
): void {
  // 문자열인 경우: 에러 메시지로 직접 찾기
  if (typeof errors === 'string') {
    const waitForElement = (attempts = 0, maxAttempts = 20) => {
      const errorElement = findErrorElementByMessage(errors);

      if (errorElement) {
        scrollToErrorElement(errorElement);
      } else if (attempts < maxAttempts) {
        // 요소를 찾지 못했으면 다음 프레임에서 다시 시도
        requestAnimationFrame(() => {
          waitForElement(attempts + 1, maxAttempts);
        });
      }
    };

    // React 리렌더링이 완료될 때까지 충분히 기다린 후 시작
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          waitForElement();
        });
      });
    }, 100);
    return;
  }

  // FieldErrors 객체인 경우: 기존 로직 사용
  const firstErrorField = findFirstErrorField(errors);
  if (!firstErrorField) return;

  // 에러 요소가 DOM에 렌더링될 때까지 기다리는 함수
  const waitForElement = (attempts = 0, maxAttempts = 20) => {
    const element = document.getElementById(firstErrorField);

    if (element) {
      // 요소를 찾았으면 먼저 스크롤 이동 (부드러운 애니메이션)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 스크롤 애니메이션이 완전히 끝난 후 포커스
      // scrollIntoView의 smooth 애니메이션은 보통 500-1000ms 정도 소요됨
      setTimeout(() => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.focus({ preventScroll: true });
        } else {
          // Field 컴포넌트인 경우 내부의 input을 찾아서 포커스
          const input = element.querySelector('input, textarea') as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null;
          if (input) {
            input.focus({ preventScroll: true });
          }
        }
      }, 600);
    } else if (attempts < maxAttempts) {
      // 요소를 찾지 못했으면 다음 프레임에서 다시 시도
      requestAnimationFrame(() => {
        waitForElement(attempts + 1, maxAttempts);
      });
    }
  };

  // React 리렌더링이 완료될 때까지 충분히 기다린 후 시작
  // 더 긴 지연 시간을 주어 React가 완전히 렌더링할 시간을 확보
  setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        waitForElement();
      });
    });
  }, 100);
}
