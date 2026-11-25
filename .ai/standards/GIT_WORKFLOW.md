# Git Workflow & Commit Rules

## 1. Branch Hygiene
- Default branch is `main`.
- Remote tracking:
  - `origin`: `https://github.com/Sugatraj/statement-builder.git` (primary development remote)
  - `upstream`: `https://github.com/potatochipz007/BankStatement.git`

## 2. Commit Message Standards
Use Conventional Commits:
- `feat: <description>` for new features or capabilities.
- `fix: <description>` for bug fixes or coordinate adjustments.
- `docs: <description>` for specifications, ADRs, or documentation.
- `test: <description>` for unit tests or verification scripts.
- `refactor: <description>` for non-breaking code restructuring.

## 3. Staging Discipline
- Always inspect `git status` and `git diff` before committing.
- Never commit build artifacts (`dist/`), temporary PDFs (`*.pdf`), or intermediate esbuild bundles.
- Never force-push (`git push --force`) to `main` without explicit user instruction.
