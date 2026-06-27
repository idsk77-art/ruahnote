# Codex 적용 프롬프트

아래 작업을 현재 VS Code에서 열려 있는 `ruah-note` 프로젝트에 적용해줘.

## 목표

RuahNote v1.0 프로젝트 관리 시스템을 `docs` 폴더에 구성한다.

## 작업

1. 기존 `docs` 폴더는 유지한다.
2. 기존 문서가 있으면 삭제하지 말고 아래 폴더로 이동하거나, 같은 이름이 충돌하면 기존 파일을 우선 보존한다.
3. 다음 폴더 구조를 만든다.

```text
docs/
├── README.md
├── 00_PROJECT_INDEX.md
├── 00_STATUS_DASHBOARD.md
├── 00_ROADMAP.md
├── 00_TODO.md
├── 00_DECISION_LOG.md
├── 01_기획/
├── 02_개발가이드/
├── 03_설계/
├── 04_DB/
├── 05_API/
├── 06_UI/
├── 07_회의록/
├── 08_릴리즈노트/
├── 09_운영/
├── 99_templates/
└── assets/
```

4. 기존 기획 문서들은 가능하면 `docs/01_기획/`으로 이동한다.
5. 개발 명령어 문서는 `docs/02_개발가이드/01_개발명령어_및_배포가이드.md`로 생성한다.
6. 프로젝트 현황은 `docs/00_STATUS_DASHBOARD.md`에 관리한다.
7. 릴리즈 이력은 `docs/08_릴리즈노트/CHANGELOG.md`에 관리한다.

## 완료 후 확인

```bash
git status
npm run build
```

## 추천 Commit 메시지

```bash
git add .
git commit -m "docs 프로젝트 관리 시스템 구성"
git push
```
