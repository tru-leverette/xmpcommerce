# GitHub Copilot Instructions

## Development Preferences
- Always use **Yarn** for package management, not npm.
- Use **TypeScript** with strict typings. Avoid `any` types.
- Apply **Tailwind CSS** for styling components.
- Prefer **Next.js App Router** architecture with server/client components.

## Code Quality Standards
- Add robust error handling. If error configuration is missing, create it.
- Delete unused files, variables, and duplicate functions.
- Update Prisma schema and run necessary commands (`prisma generate`, `prisma migrate`, etc.).
- Validate and securely manage environment variables.
- Avoid unused imports and ensure all functions are typed.

## Behavior Expectations
- When given a task, **apply changes directly** without asking for approval.
- Before starting a new task, briefly describe what you're doing.
- If something is needed to complete a task, **do it proactively**.
- Do not simulate edits—make actual file changes.

## Project Context
- This is a **scavenger hunt web app** with region-specific clues.
- Inclusive design and culturally representative avatars are prioritized.
