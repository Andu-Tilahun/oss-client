# CLAUDE.md — Project Rules & Guidelines

## 1. Task Planning & Confirmation Workflow

### Always Plan Before Acting
- Before making **any** change, Claude must present a clear task plan listing:
  - What will be changed
  - Which files will be touched
  - Why each change is needed
- Wait for explicit user confirmation (`yes`, `go ahead`, `approved`, etc.) before proceeding.

### No Surprise Changes
- **Never** modify, rename, move, or delete any file without prior approval.
- **Never** refactor or restructure existing code unless the user explicitly asks for it.
- If a task requires touching an unexpected file, stop and report it before continuing.

### Incremental Work
- Complete one logical unit of work at a time.
- After each unit, summarize what was done and ask if you should proceed to the next step.

---

## 2. User & Credentials Policy

### Credentials Are Set by the User Only
- Claude **never** hardcodes, generates, or guesses usernames, passwords, roles, or secrets.
- Admin credentials, role assignments, and all auth-related values are provided exclusively by the user.
- When auth setup is required, Claude will scaffold the structure and leave placeholder comments:
  ```typescript
  // TODO: Set by admin — do not hardcode
  username: '',
  password: '',
  role: '',
  ```

### Environment Variables
- All secrets must live in `.env` / `.env.local` — never in source code.
- Claude will remind the user to populate `.env` values but will never fill them in.

---

## 3. Architecture & Structure Guardrails

### Do Not Change Project Structure Without Approval
- The existing folder structure, module layout, and file naming conventions must not be altered without explicit instruction.
- New files must follow the existing pattern (e.g., `feature/component-name/component-name.component.ts`).

### Angular-Specific Rules
- Use the Angular CLI convention for all generated files (`ng generate` patterns).
- Keep components, services, guards, interceptors, and pipes in their respective feature folders.
- Do not mix business logic into components — services own business logic.
- Use `OnPush` change detection unless the user specifies otherwise.
- Prefer standalone components if the project already uses them; do not switch paradigms.
- Module boundaries must be respected — do not import across feature modules without approval.

### State Management
- Do not introduce a new state management library (NgRx, Akita, etc.) without approval.
- Follow whatever pattern is already in place in the project.

### Styling
- Do not change the CSS methodology (SCSS, Tailwind, CSS Modules, etc.) already in use.
- Do not modify global styles or theme files without explicit instruction.

---

## 4. Testing — Playwright

- **Always use Playwright** for end-to-end testing — no need to ask.
- Place all e2e tests under `e2e/` following the existing folder structure.
- Use the Page Object Model (POM) pattern — one class per page/feature.
- Test file naming: `feature-name.spec.ts`.
- Assertions must use Playwright's built-in `expect` — no third-party assertion libraries.
- Always run tests in headless mode by default; use `--headed` only for debugging.
- Never hardcode test credentials — read them from environment variables:
  ```typescript
  const username = process.env['TEST_USERNAME']!;
  const password = process.env['TEST_PASSWORD']!;
  ```
- When adding a new feature, a corresponding Playwright test is required before the task is considered complete.

---

## 5. Code Quality Standards

- All new code must be **strictly typed** — no `any` unless justified and approved.
- Follow Angular's official style guide (https://angular.dev/style-guide).
- No dead code, commented-out blocks, or unused imports in final output.
- All public service methods must have JSDoc comments.
- Observables must be properly unsubscribed (use `takeUntilDestroyed`, `async` pipe, or `DestroyRef`).

---

## 5. What Claude Will Never Do Without Approval

| Action | Status |
|---|---|
| Change folder/file structure | ❌ Never without approval |
| Rename existing files or classes | ❌ Never without approval |
| Install new npm packages | ❌ Never without approval |
| Modify `angular.json`, `tsconfig`, or `package.json` | ❌ Never without approval |
| Hardcode credentials or secrets | ❌ Never |
| Switch Angular version or major dependencies | ❌ Never without approval |
| Add a new third-party library | ❌ Never without approval |

---

## 6. Confirmation Phrases

The following user responses count as approval to proceed:
- `yes`, `go ahead`, `approved`, `ok`, `confirm`, `do it`, `proceed`

The following count as a stop signal:
- `no`, `stop`, `wait`, `hold on`, `cancel`, `revert`

If unclear, Claude will ask for clarification before acting.