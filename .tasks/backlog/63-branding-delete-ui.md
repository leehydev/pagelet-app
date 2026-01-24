# [FE] 브랜딩 이미지 삭제 기능 구현

## GitHub 이슈
- **이슈 번호**: #63
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/63
- **생성일**: 2026-01-24
- **우선순위**: 중간
- **관련 태스크**: pagelet-api#63 (백엔드 삭제 API)

## 개요

사이트 설정 페이지의 BrandingUploader 컴포넌트에서 "삭제" 버튼 클릭 시 서버에 저장된 브랜딩 이미지(로고, 파비콘, OG 이미지)를 실제로 삭제하는 기능을 구현합니다.

현재 "삭제" 버튼은 로컬 업로드 상태만 리셋하며, 서버에 저장된 이미지를 삭제하지 않습니다.

## 작업 범위

### 포함
- 삭제 API 함수 추가 (`deleteBrandingAsset`)
- `useBrandingUpload` 훅에 delete 기능 추가
- BrandingUploader 컴포넌트의 삭제 버튼에 실제 삭제 로직 연결
- 삭제 확인 다이얼로그 추가
- 삭제 성공/실패 토스트 메시지

### 제외
- 백엔드 API 구현 (별도 이슈)
- 삭제 취소/복구 기능

## 기술 명세

### 영향받는 파일
- `src/lib/api/types.ts` - BrandingDeleteResponse 타입 추가
- `src/lib/api/client.ts` - deleteBrandingAsset 함수 추가
- `src/lib/api/index.ts` - 재내보내기
- `src/hooks/use-branding-upload.ts` - delete 기능 추가
- `src/components/app/settings/BrandingUploader.tsx` - 삭제 로직 연결

### API 타입 정의

```typescript
// src/lib/api/types.ts

export interface BrandingDeleteResponse {
  deleted: boolean;
  type: BrandingType;
  updatedAt: string;
}
```

### API 함수 추가

```typescript
// src/lib/api/client.ts

export async function deleteBrandingAsset(
  siteId: string,
  type: BrandingType,
): Promise<BrandingDeleteResponse> {
  const response = await api.delete<ApiResponse<BrandingDeleteResponse>>(
    `/admin/sites/${siteId}/assets/branding/${type}`,
  );
  return response.data.data;
}
```

### 훅 수정

```typescript
// src/hooks/use-branding-upload.ts

export function useBrandingUpload(siteId: string, type: BrandingType) {
  // ... 기존 코드 ...

  // Delete mutation 추가
  const deleteMutation = useMutation({
    mutationFn: () => deleteBrandingAsset(siteIdRef.current, type),
    onSuccess: () => {
      // 설정 캐시 무효화
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.admin(siteIdRef.current) });
    },
  });

  /**
   * 서버에 저장된 이미지 삭제
   */
  const deleteAsset = useCallback(async () => {
    try {
      const response = await deleteMutation.mutateAsync();
      toast.success('이미지가 삭제되었습니다');
      return response;
    } catch (error) {
      const errorMessage = getErrorDisplayMessage(error, '이미지 삭제에 실패했습니다');
      toast.error(errorMessage);
      throw error;
    }
  }, [deleteMutation]);

  return {
    state,
    upload,
    commit,
    reset,
    deleteAsset,  // 추가
    isUploading: state.status === 'uploading',
    isUploaded: state.status === 'uploaded',
    isCommitting: state.status === 'committing',
    isDeleting: deleteMutation.isPending,  // 추가
    hasChanges: state.status === 'uploaded',
  };
}
```

### 컴포넌트 수정

```typescript
// src/components/app/settings/BrandingUploader.tsx

export function BrandingUploader({
  siteId,
  type,
  title,
  description,
  currentUrl,
  updatedAt,
  onCommit,
}: BrandingUploaderProps) {
  const {
    state,
    upload,
    commit,
    reset,
    deleteAsset,  // 추가
    isUploading,
    isUploaded,
    isCommitting,
    isDeleting,   // 추가
  } = useBrandingUpload(siteId, type);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 삭제 핸들러 수정
  const handleRemove = useCallback(async () => {
    if (isUploaded) {
      // 업로드 상태 취소 (로컬 리셋)
      reset();
    } else if (currentUrl) {
      // 서버 이미지 삭제 확인 다이얼로그 표시
      setShowDeleteConfirm(true);
    }
  }, [isUploaded, currentUrl, reset]);

  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteAsset();
      onCommit?.();  // 부모에게 변경 알림
    } catch {
      // 에러는 훅에서 처리됨
    }
  }, [deleteAsset, onCommit]);

  return (
    <>
      {/* 기존 UI ... */}

      {/* 삭제 버튼 disabled 상태 추가 */}
      {currentUrl && !isUploaded && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isUploading || isDeleting}
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title} 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

## 구현 체크리스트
- [ ] `BrandingDeleteResponse` 타입 추가 (`src/lib/api/types.ts`)
- [ ] `deleteBrandingAsset` API 함수 추가 (`src/lib/api/client.ts`)
- [ ] `useBrandingUpload` 훅에 delete 기능 추가
- [ ] BrandingUploader 컴포넌트 삭제 로직 구현
- [ ] 삭제 확인 AlertDialog 추가
- [ ] 삭제 중 로딩 상태 표시
- [ ] 토스트 메시지 (성공/실패)
- [ ] 에러 메시지 매핑 (`src/lib/error-messages.ts`)

## 테스트 계획
- [ ] 삭제 버튼 클릭 시 확인 다이얼로그 표시
- [ ] 확인 클릭 시 API 호출 및 이미지 제거
- [ ] 취소 클릭 시 다이얼로그 닫힘
- [ ] 삭제 중 버튼 비활성화 및 로딩 표시
- [ ] 삭제 성공 시 토스트 메시지 표시
- [ ] 삭제 실패 시 에러 토스트 표시
- [ ] 각 브랜딩 타입별 테스트 (logo, favicon, og)

## 참고 자료
- 기존 BrandingUploader: `src/components/app/settings/BrandingUploader.tsx`
- useBrandingUpload 훅: `src/hooks/use-branding-upload.ts`
- AlertDialog 컴포넌트: `src/components/ui/alert-dialog.tsx`

## 의존성
- [ ] pagelet-api#63 - 브랜딩 이미지 삭제 API 구현
