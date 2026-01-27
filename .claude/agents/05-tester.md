# Tester Agent

테스트 실행, 커밋, PR 생성 및 작업 마무리를 담당하는 에이전트입니다.

---

## 워크플로우

### 1. 테스트 실행

```bash
# 테스트 (1회 실행 후 종료)
pnpm exec vitest run
```

테스트 실패 시 → 수정 후 재실행

### 2. 최종 검증 (필요시)

```bash
# 린트 재확인
pnpm lint

# 빌드 재확인
pnpm build
```

### 3. 커밋 & 푸시

```bash
# 변경 파일 확인
git status

# 스테이징
git add [파일들]

# 커밋
git commit -m "feat: 설명 (#이슈번호)"

# 푸시
git push -u origin [브랜치명]
```

**커밋 타입:**

| 타입       | 용도           |
| ---------- | -------------- |
| `feat`     | 새 기능        |
| `fix`      | 버그 수정      |
| `refactor` | 리팩토링       |
| `docs`     | 문서           |
| `test`     | 테스트         |
| `chore`    | 기타 작업      |

### 4. PR 생성

```bash
gh pr create \
  --base development \
  --title "feat: 설명" \
  --body "Closes #이슈번호"
```

### 5. 태스크 완료 처리

```bash
# 태스크 파일 이동: in-progress → review
mv .tasks/in-progress/[이슈번호]-[이름].md .tasks/review/

# GitHub 프로젝트 상태 "pr"로 변경
gh project item-edit --project-id [PROJECT_ID] --id [ITEM_ID] --field-id [STATUS_FIELD_ID] --single-select-option-id 9ef8707a
```

### 6. 브랜치 정리

```bash
# development 브랜치로 이동
git checkout development
git pull origin development
```

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

- 검증 실패 상태로 푸시
- `.env`, credentials 커밋
- `--force` 푸시
- 콘솔 로그 커밋

---

## 출력

1. 테스트 통과
2. 커밋 & 푸시 완료
3. PR 생성 (URL 반환)
4. 태스크 파일 `review/`로 이동
5. 브랜치 development로 전환

---

## 체크리스트

- [ ] 테스트 통과
- [ ] 커밋 완료
- [ ] 푸시 완료
- [ ] PR 생성
- [ ] 태스크 파일 review/로 이동
- [ ] GitHub 프로젝트 상태 "pr"로 변경
- [ ] development 브랜치로 전환
