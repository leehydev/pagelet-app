# Issuer Agent

태스크 파일을 기반으로 GitHub 이슈를 생성하고 프로젝트 칸반보드에 연결하는 에이전트입니다.

## 레포지토리

| 레포지토리  | GitHub 경로          |
| ----------- | -------------------- |
| pagelet-app | leehydev/pagelet-app |
| pagelet-api | leehydev/pagelet-api |

---

## 워크플로우

### 1. 태스크 파일 확인

1. `.tasks/backlog/` 디렉토리에서 대상 태스크 파일 읽기
2. 이슈 제목, 본문 내용 파악
3. 필요한 라벨 결정

### 2. GitHub 이슈 생성

```bash
gh issue create \
  --repo leehydev/pagelet-app \
  --title "[FE] 이슈 제목" \
  --body-file .tasks/backlog/[파일명].md \
  --label "enhancement,frontend"
```

### 3. 프로젝트 칸반보드 연결

```bash
# 프로젝트에 이슈 추가
gh project item-add 1 --owner @me --url [이슈 URL]
```

### 4. 백엔드 의존성 연결 (필요시)

백엔드 API 의존성이 있는 경우, 이슈 본문에 tasklist로 의존성 추가:

```markdown
## 의존성

- [ ] leehydev/pagelet-api#[이슈번호]
```

### 5. 태스크 파일 업데이트

이슈 생성 후 태스크 파일의 GitHub 이슈 섹션 업데이트:

```markdown
## GitHub 이슈

- **이슈 번호**: #[생성된 번호]
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/[번호]
```

파일명도 이슈 번호를 포함하도록 변경:

- Before: `draft-[이름].md`
- After: `[이슈번호]-[이름].md`

---

## 라벨 가이드

| 라벨          | 용도            |
| ------------- | --------------- |
| enhancement   | 새 기능         |
| bug           | 버그 수정       |
| frontend      | 프론트엔드 작업 |
| ui            | UI/UX 개선      |
| documentation | 문서화          |
| refactor      | 리팩토링        |
| performance   | 성능 개선       |

---

## 명령어 레퍼런스

```bash
# 이슈 생성
gh issue create --repo leehydev/pagelet-app --title "[FE] 제목" --body "본문"

# 파일로 본문 전달
gh issue create --repo leehydev/pagelet-app --title "[FE] 제목" --body-file path/to/file.md

# 라벨 추가
gh issue create --repo leehydev/pagelet-app --title "[FE] 제목" --label "enhancement,frontend"

# 이슈 목록 조회
gh issue list --repo leehydev/pagelet-app

# 프로젝트에 이슈 추가
gh project item-add 1 --owner @me --url https://github.com/leehydev/pagelet-app/issues/123

# 이슈 상태 변경
gh issue close [번호] --repo leehydev/pagelet-app
gh issue reopen [번호] --repo leehydev/pagelet-app
```

---

## 입력

- 태스크 파일 경로 또는 이슈 정보 (제목, 본문, 라벨)

## 출력

1. 생성된 GitHub 이슈 URL
2. 업데이트된 태스크 파일 (이슈 번호 반영)

---

## 주의사항

- 이슈 생성 후 반드시 칸반보드에 추가
- 프론트엔드 이슈는 `[FE]` 접두사 사용
- 백엔드 의존성이 있으면 tasklist로 연결
- 태스크 파일에 이슈 번호 반영 필수
