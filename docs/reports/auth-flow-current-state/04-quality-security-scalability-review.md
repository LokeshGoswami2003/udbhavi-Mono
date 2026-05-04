# Quality, Security, And Scalability Review

Date: 2026-05-03

## Overall Assessment

The current implementation is a good minimal foundation, but it is still a setup-stage auth flow. It should not be treated as a hardened product foundation until the high-priority security and verification gaps are closed.

Strong points:

- No custom password handling.
- Auth0 access tokens are validated on the backend.
- Mongo users are keyed by Auth0 subject.
- The workspace waits for backend `/me` success.
- The server uses request IDs, Helmet, CORS, rate limiting, and JSON error responses.
- The code is still small enough to refactor without pain.

Main concern:

- The next phase will handle resume content, uploads, generated PDFs, prompts, and account-owned projects. Those are sensitive flows. Small auth and logging mistakes become much more expensive after that.

## Findings

### P0: Local docs contain raw credentials

Evidence:

- `docs/credentials.md` exists locally and is ignored by `docs/.gitignore`.
- It contains raw MongoDB/Auth0 credential material.

Impact:

- If copied, screenshotted, shared, uploaded, or accidentally unignored, database and Auth0 tenant access can be exposed.
- Secrets in plaintext tend to spread into prompts, reports, commits, and logs.

Recommendation:

- Rotate any secrets stored in that file.
- Move secrets to `.env` files or a password manager only.
- Keep `docs/credentials.md` ignored.
- Do not reference actual credential values in docs or reports.

### P1: Auth0 tokens are persisted in browser localStorage

Evidence:

- `client/src/auth/AuthProvider.jsx:19` sets `cacheLocation="localstorage"`.

Impact:

- If future XSS appears anywhere in the client, stored access/refresh material may be exposed.
- Resume apps will handle sensitive personal and work history data, so token persistence deserves stricter defaults.

Recommendation:

- Prefer Auth0 SDK default memory cache for now.
- If persistent sessions are required, document the decision and add a security checklist:
  - strict CSP,
  - no unsafe inline scripts,
  - dependency review,
  - escaped user-generated content,
  - no direct HTML injection.

### P1: Backend auth config does not fail fast

Evidence:

- `server/src/config/env.js:3` only requires `MONGODB_URI`.
- `server/src/middleware/auth.js:11-16` creates Auth0 middleware only if issuer/audience exist.
- Missing auth config becomes `AUTH_CONFIG_MISSING` on protected requests.

Impact:

- A deployment can start successfully with broken protected routes.
- Developers discover auth config issues from the browser instead of startup logs.

Recommendation:

- Require `AUTH0_ISSUER_BASE_URL` and `AUTH0_AUDIENCE` outside explicit local/test modes.
- If local bypass is desired later, make it obvious with an env flag such as `AUTH_REQUIRED=false`, not accidental missing config.

### P1: There is no server smoke test

Evidence:

- `server/package.json:12` intentionally exits with `Error: no test specified`.

Impact:

- Middleware order, health route availability, request IDs, and error format can regress silently.
- Future protected routes will be added without a stable backend verification command.

Recommendation:

- Add a minimal test runner and a smoke test:

```txt
GET /api/v1/health -> 200
response.ok -> true
x-request-id exists
unknown route -> JSON 404
```

- Keep this test independent of a live MongoDB connection if possible.

### P1: Auth callback and provider errors are hidden

Evidence:

- `client/src/App.jsx` routes `/app` by pathname only.
- Existing docs note `/app?error=...` falls into generic workspace auth handling.
- `client/src/api/api-client.js:14` throws a generic client error for all `/me` failures.

Impact:

- Auth0 configuration errors can look like normal signed-out or generic workspace failures.
- Debugging relies on browser devtools instead of product-visible error state.

Recommendation:

- Add an Auth0 error parser for `error` and `error_description`.
- Show user-safe copy plus a development-safe technical code.
- Preserve `x-request-id` from backend failures.

### P1: Visible UI controls do nothing

Evidence:

- `client/src/pages/workspace/WorkspacePage.jsx:130` renders `New resume` without `onClick`, `disabled`, or navigation.
- `client/src/components/landing/LandingHeader.jsx:43` renders a mobile menu button without menu behavior.
- `client/src/components/landing/LandingFooter.jsx` has an email signup form without submit behavior.

Impact:

- Users encounter dead controls.
- The app feels less trustworthy.
- Future agents may build around placeholder behavior instead of product flow.

Recommendation:

- Either wire the controls or make them honest non-actions.
- For `New resume`, disable until project CRUD exists or route to the next implemented setup step.
- For mobile header, show login/signup and nav links.
- For footer email, remove it until email capture exists.

### P2: Email verification policy is missing

Evidence:

- `server/src/modules/users/user.service.js` syncs email/name claims.
- No current code checks `email_verified`.

Impact:

- Any valid Auth0 account can enter the workspace, even if the email is not verified.
- This may be acceptable for early MVP, but it should be explicit before storing sensitive resume data.

Recommendation:

- Decide the product policy:
  - allow unverified users into workspace, or
  - require verified email before sensitive actions.
- If enforcing, do it after JWT validation and before user sync-dependent features.

### P2: User schema is minimal but under-constrained

Evidence:

- `server/src/modules/users/user.model.js` stores `auth0Sub`, `email`, and `name`.
- Email is lowercased/trimmed but not format or length checked.
- Name is trimmed but not length checked.

Impact:

- Bad or unexpected claims could store noisy profile data.
- Future UI may render oversized names/emails.

Recommendation:

- Add conservative `maxlength` values.
- Validate email shape if an email is present.
- Consider making `auth0Sub` immutable.

### P2: User upsert race is not handled

Evidence:

- `server/src/modules/users/user.service.js:66` uses `findOneAndUpdate` with `upsert: true`.
- `auth0Sub` is unique in `server/src/modules/users/user.model.js:8`.

Impact:

- Two simultaneous first-login requests can theoretically race and produce a duplicate key error.
- The user may see `Workspace unavailable` even though retry would work.

Recommendation:

- Catch duplicate key errors from the upsert.
- Retry `User.findOne({ auth0Sub })`.

### P2: CORS enables credentials without needing cookies

Evidence:

- `server/src/app.js:26` sets `credentials: true`.
- Client uses bearer tokens in `client/src/api/api-client.js`.

Impact:

- Not a direct vulnerability with a single allowed origin, but it broadens the implied browser auth model.
- It may confuse future cookie/CSRF decisions.

Recommendation:

- Remove `credentials: true` until cookie auth is intentionally added.

### P2: Logging is good now but future-sensitive

Evidence:

- `server/src/utils/logger.js` formats Error objects.
- `server/src/middleware/error.js` logs serialized errors with stack in development.
- `server/src/app.js:35` logs request method/URL/status through morgan.

Impact:

- Current routes do not carry sensitive bodies.
- Future upload, AI, prompt, PDF, and provider failures could leak sensitive content if raw errors are passed through.

Recommendation:

- Keep logging bodies, Authorization headers, prompts, resume text, and connection strings forbidden.
- Before upload/AI work, add provider-specific sanitizers.
- Avoid logging full query strings if future URLs can include sensitive values.

### P2: Health endpoint cannot serve if Mongo startup fails

Evidence:

- `server/src/server.js:7-13` connects database before listening.

Impact:

- Operators cannot hit health to see that the API is alive but database is down.
- Local DNS/Mongo issues block all HTTP diagnostics.

Recommendation:

- For current MVP, this is acceptable.
- For deployment, consider starting HTTP first and reporting DB status separately, or add a readiness probe distinction.

### P2: Manual routing is close to its limit

Evidence:

- `client/src/App.jsx` switches on `window.location.pathname`.
- `client/src/router/navigation.js` is a tiny pushState wrapper.

Impact:

- Fine for `/`, `/login`, `/signup`, `/app`.
- Project setup/editor/settings routes will need params, nested states, query parsing, and redirects.

Recommendation:

- Before adding project routes, either:
  - introduce a small route map abstraction, or
  - adopt React Router if route count grows quickly.

### P2: Client API layer drops useful response details

Evidence:

- `client/src/api/api-client.js` parses JSON but only throws a generic Error.

Impact:

- UI cannot distinguish expired token, missing backend auth config, rate limit, server error, or network failure.
- Support cannot connect a workspace error to server logs.

Recommendation:

- Add a small `ApiError` shape:

```txt
message
status
code
requestId
```

- Keep the UI message user-safe, but log or expose request ID in support/debug copy.

### P3: App root owns too many concerns

Evidence:

- `client/src/App.jsx` owns route state, theme state, theme persistence, auth gating, and route selection.

Impact:

- Not a bug now.
- It will slow future changes as workspace routes grow.

Recommendation:

- Split before project CRUD/editor work:

```txt
theme/ThemeProvider.jsx
router/AppRoutes.jsx
auth/AuthGate.jsx
```

### P3: Product copy makes claims ahead of implementation

Evidence:

- Landing sections mention privacy, deletion, versions, PDF previews/downloads, free-tier limits, templates, and testimonials.
- Current implementation only supports auth and workspace shell.

Impact:

- It is okay as directional marketing while building, but risky if shown to real users as live product truth.

Recommendation:

- For live demos, make copy match implemented scope.
- Replace fictional testimonials with product principles until there are real user quotes.
- Keep implementation notes out of the UI, but avoid promising unavailable controls.

### P3: Repo contains stale generated artifacts

Evidence:

- Multiple landing screenshot variants are tracked in `client/`.
- Vite starter SVG assets remain tracked.

Impact:

- More clutter for future agents.
- Harder to tell source assets from verification artifacts.

Recommendation:

- Keep one canonical reference screenshot under `docs/` if needed.
- Remove old screenshot iterations and unused starter assets.

## Scalability Review

Good scalability choices:

- Server has `createApp()`, separate `server.js`, and feature modules.
- User logic is separated into model/service/controller/routes.
- Auth0 subject is the durable identity key.
- API response shape is consistent.
- Logger is centralized.

Scalability risks before next phase:

- No tests around module boundaries.
- No route ownership pattern yet for future projects.
- No validation library in active routes.
- No user quota middleware.
- No upload/prompt/PDF sanitization strategy in code yet.
- Manual client router may become brittle.
- Auth config and error handling are too implicit.

## Security Review

Current security positives:

- Auth0 owns passwords.
- Backend validates JWT issuer/audience.
- CORS is not wildcard.
- Helmet is enabled.
- Request body limit exists.
- Logs do not currently include request bodies or Authorization headers.

Security fixes before sensitive resume data:

1. Rotate plaintext credentials from local docs.
2. Avoid localStorage token persistence unless intentionally accepted.
3. Fail fast on missing Auth0 config.
4. Add email verification policy.
5. Add request ID to client-visible failures.
6. Add tests for invalid/expired auth.
7. Add strict logging rules for upload and AI provider code.

## Logical Correctness Review

Correct:

- `/me` requires a valid API token.
- Local user is created after token validation.
- Workspace requires both Auth0 authenticated state and `/me` success.
- Missing backend auth config does not accidentally allow access.
- Health is public.

Needs correction:

- Dead UI controls must be removed, disabled, or wired.
- Auth0 callback errors need first-class handling.
- `/me` failures need typed client errors.
- Backend startup should not silently accept missing required auth config in production.
- Tests should prove current behavior before adding project APIs.

## Suggested Fix Order

1. Rotate/remove raw local credential material.
2. Add server smoke test and make `npm test` useful.
3. Require Auth0 env values outside test/local bypass.
4. Change Auth0 token cache away from localStorage or document the accepted risk.
5. Add client Auth0 callback error handling.
6. Add typed API errors with `requestId`.
7. Disable or wire `New resume`, mobile menu, and footer email form.
8. Add email verification policy.
9. Add user schema constraints and duplicate-key retry.
10. Clean tracked screenshot/starter artifacts.

