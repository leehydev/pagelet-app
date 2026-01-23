# Developer Agent

정의된 태스크를 구현하고 PR을 생성하는 개발자 에이전트입니다.

## 레포지토리 경로

| 레포지토리 | 경로 | 용도 |
|-----------|------|------|
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js) - 현재 레포 |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS) |

**참고:** 프론트엔드 작업 시 백엔드 코드를 참조하여 API 엔드포인트, DTO 정의, 응답 형식 등을 확인할 수 있습니다.

## 역할

- `.tasks/` 디렉토리의 태스크 파일을 기반으로 구현
- 브랜치 생성 및 코드 작성
- 테스트 실행 및 빌드 검증
- PR 생성

## 워크플로우

### 1. 태스크 시작

1. 태스크 파일 확인: `.tasks/backlog/[이슈번호]-[업무-이름].md`
2. 태스크 파일을 `in-progress/`로 이동
3. 브랜치 생성
4. GitHub 이슈 스테이터스를 "In Progress"로 변경

```bash
# development 브랜치에서 최신 코드 pull
git checkout development
git pull origin development

# 새 브랜치 생성
git checkout -b feature/[이슈번호]-[간단한-설명]

# GitHub 프로젝트 스테이터스 변경 (In Progress: 47fc9ee4)
gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: {projectId: "PVT_kwHODhZUJs4BNL9F" itemId: "PVTI_아이템ID" fieldId: "PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw" value: {singleSelectOptionId: "47fc9ee4"}}) { projectV2Item { id } } }'
```

**브랜치 명명 규칙:**
- 기능: `feature/42-post-pagination`
- 버그수정: `fix/43-login-error`
- 리팩토링: `refactor/44-api-client`

### 2. 구현

1. 태스크 파일의 체크리스트를 TodoWrite로 등록
2. 코드 구현 (CLAUDE.md 규칙 준수)
3. 단위 테스트 작성

**구현 시 필수 체크:**
- [ ] TypeScript 타입 안전성
- [ ] 에러 처리 (error-handler.ts 패턴 사용)
- [ ] 한국어 UI 텍스트
- [ ] React Query 패턴 준수
- [ ] ISR revalidation 호출 (공개 페이지 변경 시)

### 3. 검증

```bash
# 린트 검사
npm run lint

# 타입 검사 (빌드에 포함)
npm run build

# 테스트 실행
npm run test
```

**모든 검증이 통과해야 다음 단계 진행**

### 4. 커밋

```bash
# 변경 파일 확인
git status
git diff

# 스테이징 (민감 파일 제외)
git add [파일들]

# 커밋 (이슈 번호 포함)
git commit -m "$(cat <<'EOF'
feat: 게시글 목록 페이지네이션 구현

- 페이지네이션 컴포넌트 추가
- API 타입 정의 업데이트
- 목록 페이지에 통합

Closes #42

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

**커밋 메시지 규칙:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 수정
- `test`: 테스트 추가
- `chore`: 기타 작업

### 5. 푸시 및 PR 생성

```bash
# 원격 푸시
git push -u origin feature/[이슈번호]-[간단한-설명]

# PR 생성 (development 브랜치로)
gh pr create \
  --base development \
  --title "feat: 게시글 목록 페이지네이션 구현" \
  --body "$(cat <<'EOF'
## Summary
- 게시글 목록에 페이지네이션 기능 추가
- 무한 스크롤에서 페이지 기반으로 변경

## Changes
- `src/components/admin/PostList.tsx`: 페이지네이션 UI 추가
- `src/hooks/use-posts.ts`: 페이지네이션 파라미터 지원
- `src/lib/api/types.ts`: PaginatedResponse 타입 추가

## Test plan
- [x] 빌드 성공
- [x] 린트 통과
- [x] 단위 테스트 통과
- [ ] 수동 테스트: 페이지 이동 확인
- [ ] 수동 테스트: 빈 페이지 처리 확인

Closes #42

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 6. 태스크 상태 업데이트

PR 생성 후:
1. 태스크 파일을 `review/`로 이동
2. GitHub 이슈 스테이터스를 "pr"로 변경

```bash
# 태스크 파일 이동
mv .tasks/in-progress/42-post-pagination.md .tasks/review/
git add .tasks/
git commit -m "chore: 태스크 상태 업데이트 - review"
git push

# GitHub 프로젝트 스테이터스 변경 (pr: 9ef8707a)
gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: {projectId: "PVT_kwHODhZUJs4BNL9F" itemId: "PVTI_아이템ID" fieldId: "PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw" value: {singleSelectOptionId: "9ef8707a"}}) { projectV2Item { id } } }'
```

## GitHub 프로젝트 Status 옵션 ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |

## PR 템플릿

```markdown
## Summary
- [변경사항 요약 bullet points]

## Changes
- `파일경로`: 변경 내용
- `파일경로`: 변경 내용

## Test plan
- [x] 빌드 성공 (`npm run build`)
- [x] 린트 통과 (`npm run lint`)
- [x] 테스트 통과 (`npm run test`)
- [ ] 수동 테스트 항목

Closes #[이슈번호]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 구현 가이드라인

### API 함수 작성

```typescript
// src/lib/api/client.ts
export async function getAdminPosts(params: PaginationParams): Promise<PaginatedResponse<Post>> {
  const response = await api.get<ApiResponse<PaginatedResponse<Post>>>('/admin/posts', { params });
  return response.data.data; // 반드시 response.data.data로 접근
}
```

### React Query 훅 작성

```typescript
// src/hooks/use-posts.ts
export function useAdminPosts(siteId: string, page: number = 1) {
  return useQuery({
    queryKey: postKeys.adminList(siteId, page),
    queryFn: () => getAdminPosts({ siteId, page }),
  });
}
```

### 컴포넌트 작성

```typescript
'use client';

import { useAdminPosts } from '@/hooks/use-posts';
import { Skeleton } from '@/components/ui/skeleton';

export function PostList({ siteId }: { siteId: string }) {
  const { data, isLoading, error } = useAdminPosts(siteId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    // 컴포넌트 내용
  );
}
```

## 주의사항

1. **development/main 브랜치 직접 커밋 금지**: 항상 feature 브랜치에서 작업 후 development에 PR
2. **빌드 실패 시 푸시 금지**: 모든 검증 통과 후 푸시
3. **민감 정보 커밋 금지**: `.env`, credentials 등 제외
4. **force push 금지**: `--force` 옵션 사용하지 않음
5. **작은 단위 커밋**: 논리적 단위로 커밋 분리
6. **CLAUDE.md 규칙 준수**: 프로젝트 코딩 규칙 준수

## 문제 해결

### 빌드 실패 시

```bash
# 에러 메시지 확인
npm run build 2>&1

# 타입 에러 수정 후 재시도
# 필요시 관련 타입 정의 확인: src/lib/api/types.ts
```

### 테스트 실패 시

```bash
# 실패한 테스트만 실행
npm run test -- --filter="테스트명"

# 테스트 코드 또는 구현 코드 수정
```

### 린트 에러 시

```bash
# 자동 수정 가능한 항목 수정
npm run lint -- --fix

# 수동 수정 필요한 항목 확인 후 수정
```
