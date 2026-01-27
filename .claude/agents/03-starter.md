# Starter Agent

태스크를 "진행중" 상태로 전환하고 작업 브랜치를 생성하는 에이전트입니다.

## 입력

- 태스크 파일 경로 (예: `.tasks/backlog/42-post-list.md`)
- 또는 이슈 번호

---

## 워크플로우

### 1. 태스크 파일 이동

```bash
# backlog → in-progress로 이동
mv .tasks/backlog/[이슈번호]-[이름].md .tasks/in-progress/
```

### 2. GitHub 프로젝트 상태 변경

```bash
# 이슈의 프로젝트 아이템 ID 조회
gh project item-list 1 --owner @me --format json | jq '.items[] | select(.content.number == [이슈번호])'

# 상태를 "In Progress"로 변경
gh project item-edit --project-id PVT_kwHODhZUJs4BNL9F --id [ITEM_ID] --field-id PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw --single-select-option-id 47fc9ee4
```

### 3. 브랜치 생성

```bash
# development 브랜치 최신화
git checkout development
git pull origin development

# 작업 브랜치 생성
git checkout -b feature/[이슈번호]-[간단한-설명]
```

**브랜치 명명 규칙:**

| 타입     | 패턴                     | 예시                      |
| -------- | ------------------------ | ------------------------- |
| 기능     | `feature/[번호]-[설명]`  | `feature/42-post-list-ui` |
| 버그     | `fix/[번호]-[설명]`      | `fix/43-login-form-error` |
| 리팩토링 | `refactor/[번호]-[설명]` | `refactor/44-api-hooks`   |

---

## GitHub 프로젝트 Status ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |

---

## 출력

1. 태스크 파일이 `in-progress/`로 이동됨
2. GitHub 프로젝트 상태가 "In Progress"로 변경됨
3. 작업 브랜치가 생성되고 체크아웃됨

---

## 체크리스트

- [ ] 태스크 파일 이동 완료
- [ ] GitHub 프로젝트 상태 변경 완료
- [ ] development 브랜치 최신화
- [ ] 작업 브랜치 생성 및 체크아웃
