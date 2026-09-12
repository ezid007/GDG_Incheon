# AGENTS.md

## Git & Task Completion Workflow

작업 완료 시 항상 다음 절차를 준수합니다:

1. `git fetch origin`
2. `git rebase origin/main` (또는 작업 대상 브랜치)
3. 충돌(conflict) 발생 시 에이전트가 직접 해결
4. 작업 내용 커밋 및 푸시 (`git commit & push`)
