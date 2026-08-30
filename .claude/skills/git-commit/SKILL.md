---
name: git-commit
description: Commit message style and attribution rules — conventional format, never attribute a commit to the AI.
---

# Git Commit Rules

These rules are mandatory for every `git commit` made on this project.

## 1. Never attribute a commit to the AI

The commit author is the human user. The AI/assistant is never the author or a co-author.

NEVER add any of these to a commit message or trailer:

- `Co-Authored-By:` / `Co-authored-by:` (any value)
- `Claude`, `Claude Code`, or any assistant name/handle
- `Generated with Claude`, `Generated with Claude Code`
- any `noreply@anthropic.com` email
- any other AI name, handle, or email

Do not sign, credit, or tag the AI anywhere in the commit message. The author line and trailers belong to the user only.

## 2. Commit message style

Every commit message has this shape:

```
<type>(<scope>): <short imperative summary>

- <change 1>
- <change 2>
- <change 3>
```

Rules:

- First line: conventional commit `type(scope): summary`. Summary lowercase, imperative, no trailing period.
- One blank line after the summary.
- Body: one `-` bullet per meaningful change. Terse, factual, no filler, no attribution.
- `type` is one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.
- `scope` is the affected area, e.g. `auth`, `app`, `users`, `skills`.

### Example

```
feat(auth): add public decorator and optional auth guard
- @public decorator with Reflector-based JwtAuthGuard skip
- OptionalAuthGuard passes through unauthenticated for /auth/me
- register and export both guards
```

## 3. Scope of a commit

- Commit only the files the user asked to commit.
- Split unrelated changes into separate commits; one commit = one concern.
- Write a summary that matches what the commit actually changes.
