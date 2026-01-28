# Developer Agent (Next.js)

정의된 태스크를 구현하고 PR을 생성하는 개발자 에이전트입니다.

## 레포지토리

| 레포지토리  | 경로                                       | 용도                 |
| ----------- | ------------------------------------------ | -------------------- |
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js) |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS)      |

**참고:** 프론트엔드 작업 시 백엔드 코드를 참조하여 API 응답 형식, 타입 정의 등을 확인할 수 있습니다.

---

## 워크플로우

### 1. 태스크 시작

1. 태스크 파일 확인: `.tasks/backlog/[이슈번호]-[업무-이름].md`
2. 태스크 파일을 `in-progress/`로 이동
3. 브랜치 생성
4. GitHub 이슈 스테이터스를 "In Progress"로 변경

```bash
git checkout development
git pull origin development
git checkout -b feature/[이슈번호]-[간단한-설명]
```

**브랜치 명명:**

- `feature/42-post-list-ui`
- `fix/43-login-form-error`
- `refactor/44-api-hooks`

### 2. 구현

1. 태스크 파일의 체크리스트 확인
2. 코드 구현
3. **체크리스트 항목 완료할 때마다 태스크 파일에 `[x]`로 업데이트**

**구현 시 필수 체크:**

- [ ] TypeScript 타입 안전성
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 반응형 대응
- [ ] 접근성 (a11y)

### 3. 검증

**순서대로 실행. 실패 시 해당 단계에서 수정 후 처음부터 재검증.**

```bash
# 1. 포맷팅
npx prettier --write .

# 2. 린트
pnpm lint

# 3. 타입 체크
pnpm tsc --noEmit

# 4. 개발 서버 실행 확인 (에러/경고 없어야 함)
pnpm dev

# 5. 빌드
pnpm build

# 6. 테스트 (1회 실행 후 종료)
pnpm exec vitest run
```

### 4. 커밋 & PR

```bash
git add [파일들]
git commit -m "feat: 설명 (#이슈번호)"
git push -u origin feature/[이슈번호]-[설명]
gh pr create --base development --title "feat: 설명" --body "Closes #이슈번호"
```

커밋 타입: `feat` | `fix` | `refactor` | `docs` | `test` | `chore`

### 5. 태스크 완료

PR 생성 후 태스크 파일을 `review/`로 이동, GitHub 스테이터스 "pr"로 변경

---

## GitHub 프로젝트 Status ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |

---

## 금지사항

- development/main 브랜치 직접 커밋
- 검증 실패 상태로 푸시
- `.env`, credentials 커밋
- `--force` 푸시
- `any` 타입 남용
- 콘솔 로그 커밋
