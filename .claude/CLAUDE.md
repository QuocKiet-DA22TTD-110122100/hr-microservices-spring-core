# Claude Code Agent Instructions — HR Microservices

## Context
This is an HR microservices architecture with Spring Boot backend (Java 21) + Node.js tooling:
- **auth-service**: JWT, OAuth 2.0, RBAC
- **hr-service**: Payroll, employee lifecycle, benefits
- **project-service**: Project allocation, timesheets
- **task-service**: Task tracking, workflow
- **api-gateway**: Request routing, rate limiting
- **eureka-server**: Service discovery

## Available Tools
- **codegraph_context(symbol)** — Get code structure for any class/function without file reads
- **codegraph_explore(query)** — Full-text search across all services
- **codegraph_impact(symbol)** — Trace callers/dependencies before changes

## Workflow Rules
1. **Always start with CodeGraph** — Use `codegraph_context` to map architecture
2. **Avoid file scanning** — Don't spawn Explore sub-agents; query the graph instead
3. **Trace impact** — Before modifying a service, run `codegraph_impact` to see side-effects
4. **Spring patterns** — Reference `/springboot-patterns` skill for design decisions
5. **Security first** — RBAC validation on all endpoints; check auth-service for token flows

## Skills Available
- `payroll-patterns` — Salary calculations, tax, deductions
- `employee-lifecycle` — Hire, transfer, offboard flows
- `compliance-audit` — GDPR/CCPA compliance checks
- `springboot-patterns` — Spring best practices
- `continuous-learning` — Auto-extract insights from sessions

## Performance Targets
- **Tool calls**: <15 per query (vs. 50+ without CodeGraph)
- **Time**: <1m for architecture questions (vs. 2m+ without)
- **Tokens**: <400k per query (vs. 1.4M without)

## Examples

### Query: "How does employee promotion flow work?"
1. `codegraph_context("EmployeeService")` → Find main entry point
2. `codegraph_explore("promotion")` → Search all related code
3. Reference `employee-lifecycle` skill → Understand business rules
4. Trace impact → See HR reporting + audit logs affected

### Query: "What's the auth flow for the payroll module?"
1. `codegraph_context("PayrollController")` → Entry point
2. `codegraph_explore("@RequiresPermission")` → Find RBAC annotations
3. Check `codegraph_impact("JwtTokenProvider")` → See auth dependencies

## No-No's
- ❌ Don't use Grep/Find for exploration; use CodeGraph instead
- ❌ Don't read random files; query the graph first
- ❌ Don't assume Spring patterns; check /springboot-patterns skill
- ❌ Don't modify auth/payroll without compliance review

---

# Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

# Spring Boot Patterns (Backend)

## Controller Layer
- Annotate with `@RestController` + `@RequestMapping`
- Return `ResponseEntity<T>` for explicit status codes
- Validate input with `@Valid` + Bean Validation (`@NotBlank`, `@NotNull`, `@Size`)
- Never put business logic in controllers — delegate to `@Service`

```java
@PostMapping
public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
}
```

## Service Layer
- Annotate with `@Service` + `@Transactional` where DB writes happen
- Use constructor injection (not `@Autowired` on fields)
- Throw domain exceptions (`ResourceNotFoundException`, `BusinessRuleException`) — never return null
- Map entities ↔ DTOs inside service, never expose JPA entities to controllers

## Repository Layer
- Extend `JpaRepository<Entity, ID>` — don't write boilerplate CRUD
- Use `@Query` for complex queries, not native SQL unless necessary
- Return `Optional<T>` from findBy methods, never null

## Exception Handling
- One `@RestControllerAdvice` class handles all exceptions globally
- Map domain exceptions to HTTP status codes there, not in controllers
- Always include `timestamp`, `status`, `message`, `path` in error response body

## Security / RBAC
- Check permissions via `@PreAuthorize("hasAuthority('PERMISSION_NAME')")` on service methods
- Extract user from `SecurityContextHolder` in service, not controller
- Never trust data from request body for userId — always use authenticated principal

## Testing
- Unit test services with Mockito: `@ExtendWith(MockitoExtension.class)`
- Integration test controllers with `@SpringBootTest` + `MockMvc`
- Use `@DataJpaTest` for repository tests with in-memory DB
- Test unhappy paths: not found, validation failure, permission denied

---

# React / TypeScript Patterns (Frontend)

## Component Structure
- Functional components only — no class components
- Keep components small: if > 150 lines, split into sub-components
- Co-locate component logic: state + handlers in same file as JSX
- Props interface defined directly above component, not in separate file unless shared

```tsx
interface Props {
  userId: string;
  onSave: (data: UserData) => void;
}

export const UserForm = ({ userId, onSave }: Props) => { ... };
```

## State Management (Zustand)
- One store per domain (`authStore`, `uiStore`) — don't put everything in one store
- Store only serializable state — no functions, no class instances
- Selectors inline: `const user = useAuthStore(s => s.user)` — avoid subscribing to whole store

## API Calls
- All API calls go through `apiClient` (`src/utils/axios.ts`) — never raw `fetch`
- Each domain has its own API file (`employee.api.ts`, `project.api.ts`)
- Handle errors with `getApiErrorMessage()` from `src/utils/error.ts`
- Show loading state during async operations — never leave UI frozen

## TypeScript
- `strict: true` always — no `any` unless wrapping third-party code
- Define response types matching backend DTOs exactly
- Use `unknown` + type narrowing instead of `any` for error handling
- Prefer `interface` for object shapes, `type` for unions/intersections

## Forms
- Use `react-hook-form` + `zod` for all forms — no manual state for form fields
- Validate on submit, show inline errors per field
- Disable submit button while loading to prevent double-submit

## Testing (Vitest)
- Mock API calls with `vi.mock('@/utils/axios')` — never hit real backend in unit tests
- Test user interactions with `@testing-library/user-event`, not `fireEvent`
- Each test: arrange → act → assert, one assertion per logical outcome
- `beforeEach` must be `async` if it uses `await import()`
