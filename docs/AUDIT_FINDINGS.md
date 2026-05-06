# Current Application Audit Findings

Date: 2026-05-03

Scope:

- Client authentication flow after basic Auth0 setup
- Landing page routing and UX
- Current workspace placeholder
- Server foundation quality
- Repo hygiene and stale artifacts

This document records known issues for later cleanup. It is not a changelog and does not mean every item must be fixed immediately. Use it as a strict quality backlog before expanding the app workspace and backend protected routes.

---

## Summary

The project is still small and modular enough to correct quickly. The main risks are not large architecture failures yet. They are early drift points:

- Auth failures are hidden behind a generic signed-out state.
- Mobile navigation shows a button that does nothing.
- Some user-facing copy exposes implementation status.
- Auth env examples are stale.
- `App.jsx` is starting to collect routing, auth, and theme responsibilities.
- Server error logging needs sanitization before protected routes, uploads, and AI work.
- Server has no useful smoke test target.
- Some generated files and starter assets remain in tracked source.

---

## Finding 1: Auth Errors Are Swallowed

Priority: P2

File:

```txt
client/src/pages/workspace/WorkspacePage.jsx
```

Lines:

```txt
18-29
```

Issue:

When Auth0 redirects back to the client with an error query string, such as:

```txt
/app?error=invalid_request&error_description=...
```

the app still renders the `/app` route and falls into the generic `Login required` state. This hides the actual Auth0 problem from the user and from developers. During setup, this made an Auth0 API audience/client authorization issue look like a normal signed-out state.

Why it matters:

- Users see the wrong state.
- Developers lose the real Auth0 error message.
- Future auth bugs will be slower to diagnose.
- The UI cannot distinguish expired session, unauthenticated user, and provider configuration failure.

Suggested later fix:

- Add an auth callback/error parser for `error` and `error_description` query params.
- Show a concise, user-safe auth error state.
- Keep detailed provider text out of normal user copy, but make it visible enough during development.
- Clear the query string after handling the error.

Expected UX:

```txt
We could not complete sign in.
Please try again, or contact support if this keeps happening.
```

Development detail can be shown below that only when useful:

```txt
Auth0 returned: invalid_request
```

---

## Finding 2: Mobile Header Menu Is Dead UI

Priority: P2

File:

```txt
client/src/components/landing/LandingHeader.jsx
```

Lines:

```txt
37-46
```

Issue:

The mobile header shows a menu button, but the button has no open state, no drawer, no links, and no login/signup actions. On smaller screens, the visible desktop login/start controls are hidden, so mobile users are left with a control that appears interactive but does nothing.

Why it matters:

- It blocks a key conversion path on mobile.
- It reduces trust because visible UI is non-functional.
- It makes the landing page feel unfinished.

Suggested later fix:

- Add a small mobile navigation panel or replace the dead menu with visible auth actions.
- Include landing anchor links, `Log in`, and `Start free`.
- Close the menu after navigation.
- Keep the implementation minimal; no full navigation framework is required yet.

Expected behavior:

```txt
Tap menu -> see sections + Log in + Start free -> tap item -> menu closes
```

---

## Finding 3: Implementation Note Leaks Into UX

Priority: P2

Status: Resolved on 2026-05-03 for the workspace empty state.

File:

```txt
client/src/pages/workspace/WorkspacePage.jsx
```

Lines:

```txt
58-61
```

Issue:

The workspace placeholder says:

```txt
Your projects will appear here after the server project flow is connected.
```

This exposes internal implementation sequencing to the user. End-user surfaces should describe the user's next step, not the app's unfinished backend work.

Why it matters:

- It makes the product feel like a developer preview.
- It breaks the product-first UX direction for this repo.
- It teaches users implementation detail instead of guiding action.

Suggested later fix:

Replace the copy with user-facing empty state language, for example:

```txt
Start with a resume project, then upload an existing resume or enter details manually.
```

If the action is not wired yet, disable the button with polished copy or keep it as a non-destructive placeholder without implementation wording.

---

## Finding 4: Example Auth Env Is Stale

Priority: P2

File:

```txt
client/.env.example
```

Line:

```txt
3
```

Issue:

The example env file still contains an older Auth0 client ID while the active local environment and credentials doc use the newer `udbhavi-client` value.

Why it matters:

- Future setup may copy the wrong value.
- Auth0 login can fail with misleading client/audience errors.
- Docs and environment contracts drift early.

Suggested later fix:

- Update `client/.env.example` to match the current Auth0 public client ID.
- Keep only public frontend values in client env files.
- Never place the Auth0 client secret in any Vite environment file.

Expected client env shape:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_AUTH0_DOMAIN=udbhaviauth.us.auth0.com
VITE_AUTH0_CLIENT_ID=<current public SPA client id>
VITE_AUTH0_AUDIENCE=https://api.udbhavi.local
```

---

## Finding 5: App Owns Too Many Concerns

Priority: P3

File:

```txt
client/src/App.jsx
```

Lines:

```txt
9-52
```

Issue:

`App.jsx` currently owns:

- Theme initialization
- Theme persistence
- Browser path state
- Navigation subscription
- Auth config gating
- Page selection

This is acceptable for the current small app, but it will become a central dumping ground once project routes, setup routes, editor routes, and settings routes arrive.

Why it matters:

- Future route additions will make `App.jsx` harder to review.
- Auth concerns and theme concerns will become coupled.
- Route-level logic will be harder to test.

Suggested later fix:

Split responsibilities before adding the app workspace routes:

```txt
client/src/theme/
  ThemeProvider.jsx
  use-theme.js

client/src/router/
  AppRoutes.jsx
  navigation.js

client/src/auth/
  AuthProvider.jsx
  auth-config.js
  use-auth-actions.js
```

Keep `App.jsx` as a composition root only:

```jsx
function App() {
  return <AppRoutes />
}
```

---

## Finding 6: Error Logging Is Not Sanitized Enough

Priority: P3

Status: Addressed on 2026-05-03 for the shared request error middleware. Keep applying the same rule to future provider, upload, resume, and AI-specific logs.

File:

```txt
server/src/middleware/error.js
```

Lines:

```txt
8-13
```

Issue:

The error middleware logs the raw `err` object. That is currently low risk because the backend is small, but it becomes risky once the server handles:

- Auth bearer tokens
- Auth0 JWT validation errors
- Resume uploads
- AI provider errors
- Prompt/response failures
- PDF compiler errors

The repository guide asks for practical logging with sanitized error details and no secrets, tokens, passwords, raw credentials, or sensitive user data.

Why it matters:

- Raw provider errors can include sensitive request metadata.
- Upload and AI errors may later include resume text or prompts.
- Logs should help debugging without leaking private data.

Suggested later fix:

- Add a `serializeError` or `sanitizeError` helper.
- Log only safe fields:

```txt
name
message
code
statusCode
stack in development only
requestId
route/module context
```

- Do not log request bodies, authorization headers, connection strings, prompts, resume text, or raw provider payloads.

---

## Finding 7: Server Has No Useful Test Target

Priority: P3

File:

```txt
server/package.json
```

Lines:

```txt
9-13
```

Issue:

The server test script currently exits intentionally:

```txt
Error: no test specified
```

This means there is no backend smoke test for app creation, health routing, middleware order, or future auth middleware.

Why it matters:

- Protected route work will be riskier.
- Middleware ordering bugs will be harder to catch.
- Agents and developers cannot run a quick backend verification command.

Suggested later fix:

- Add a minimal test runner.
- Add a smoke test for `createApp()`.
- Test `GET /api/v1/health` without requiring a live MongoDB connection.

Good first target:

```txt
npm test
```

should verify:

```txt
GET /api/v1/health -> 200
response.ok -> true
request id header exists
```

---

## Repo Hygiene Notes

The following tracked files look stale or artifact-like:

```txt
client/landing-desktop.png
client/landing-mobile.png
client/landing-mobile-2.png
client/landing-mobile-3.png
client/landing-tall.png
client/landing-tall-fixed.png
client/landing-tall-final.png
client/landing-tall-restarted.png
client/src/assets/react.svg
client/src/assets/vite.svg
```

Current log files are ignored by `client/.gitignore`, but several generated logs exist locally and should stay untracked:

```txt
client/auth-flow-dev.log
client/auth-flow-dev.err.log
client/static-preview.log
client/static-preview.err.log
client/vite-auth.log
client/vite-auth.err.log
client/vite-dev.log
client/vite-dev.err.log
```

Suggested later fix:

- Remove unused starter assets from `client/src/assets`.
- Move useful landing screenshots to `docs/` only if they are reference artifacts.
- Delete old screenshot iterations that are no longer useful.
- Keep runtime source directories focused on app code, not verification artifacts.

---

## Current Verification Snapshot

Client:

```txt
npm run lint
```

Passed.

```txt
npm run build
```

Passed.

Server:

```txt
npm test
```

Failed because the package intentionally has no useful test target.

---

## Suggested Fix Order

1. Fix stale Auth0 env example and README settings.
2. Add Auth0 error handling for `/app?error=...`.
3. Remove implementation-facing workspace copy.
4. Make mobile header navigation functional.
5. Split route/theme/auth responsibilities out of `App.jsx`.
6. Add sanitized server error serialization.
7. Add a minimal server smoke test.
8. Remove or relocate stale tracked assets.
