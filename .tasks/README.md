# 태스크 관리

이 디렉토리는 프로젝트의 태스크를 관리합니다.

## 디렉토리 구조

```
.tasks/
├── README.md           # 이 파일
├── backlog/            # 대기 중인 태스크
├── in-progress/        # 진행 중인 태스크
├── review/             # PR 리뷰 대기 중인 태스크
├── done/               # 완료된 태스크
└── templates/          # 태스크 템플릿
```

## 태스크 상태 흐름

```
backlog → in-progress → review → done
   ↑           ↓
   └───────────┘ (작업 중단 시)
```

| 상태 | 디렉토리 | 설명 |
|------|----------|------|
| 대기 | `backlog/` | Architect가 생성한 새 태스크 |
| 진행중 | `in-progress/` | Developer가 작업 중인 태스크 |
| 리뷰 | `review/` | PR 생성 후 리뷰 대기 중 |
| 완료 | `done/` | 머지 완료된 태스크 |

## 파일 명명 규칙

```
[이슈번호]-[업무-이름].md
```

**예시:**
- `42-post-pagination.md`
- `43-image-optimization.md`
- `44-login-error-fix.md`

## 워크플로우

### 1. 태스크 생성 (Architect)

```bash
# GitHub 이슈 생성
gh issue create --title "제목" --body-file .tasks/templates/TASK_TEMPLATE.md --project "pagelet"

# 태스크 파일 생성
# .tasks/backlog/[이슈번호]-[업무-이름].md
```

### 2. 태스크 시작 (Developer)

```bash
# 태스크 파일 이동
mv .tasks/backlog/42-post-pagination.md .tasks/in-progress/

# 브랜치 생성
git checkout -b feature/42-post-pagination
```

### 3. PR 생성 후 (Developer)

```bash
# 태스크 파일 이동
mv .tasks/in-progress/42-post-pagination.md .tasks/review/
```

### 4. 머지 완료 후

```bash
# 태스크 파일 이동
mv .tasks/review/42-post-pagination.md .tasks/done/
```

## 태스크 파일 필수 항목

- **GitHub 이슈 링크**: 관련 이슈 연결
- **개요**: 작업 목적과 배경
- **작업 범위**: 포함/제외 항목
- **구현 체크리스트**: 세부 작업 항목
- **테스트 계획**: 검증 방법

## 관련 에이전트

- **Architect** (`.claude/agents/architect.md`): 태스크 생성
- **Developer** (`.claude/agents/developer.md`): 태스크 구현
