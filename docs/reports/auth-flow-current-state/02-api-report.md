# API Report

Date: 2026-05-03

Base URL:

```txt
http://localhost:4000/api/v1
```

Current implemented APIs:

- `GET /health`
- `GET /me`

The broader API list in `docs/ResumeBuilderPlan.md` is planned future scope, not implemented current behavior.

## API Middleware Stack

Implemented in `server/src/app.js`:

```txt
requestIdMiddleware
helmet
cors({ origin: env.frontendUrl, credentials: true })
express.json({ limit: "1mb" })
express.urlencoded({ extended: true })
morgan request logging
publicApiLimiter on /api/v1
healthRoutes on /api/v1
authenticateJwt + userRoutes on /api/v1
notFoundMiddleware
errorMiddleware
```

Important behavior:

- Every request gets an `x-request-id` response header.
- Helmet security headers are enabled globally.
- CORS allows only `FRONTEND_URL`.
- JSON body size is capped at 1 MB.
- Rate limiting is IP-based and applies to all `/api/v1` routes.
- `/health` is public.
- `/me` requires a valid Auth0 API access token.

## GET /api/v1/health

Purpose:

- Public operational check for the API process and MongoDB connection state.

Controller:

- `server/src/modules/health/health.controller.js`

Service:

- `server/src/modules/health/health.service.js`

Response shape:

```json
{
  "ok": true,
  "data": {
    "service": "udbhavi-api",
    "database": {
      "status": "connected",
      "name": "udbhavi"
    },
    "uptimeSeconds": 123
  }
}
```

Notes:

- Health does not require auth.
- It reports Mongoose ready state, not a deep database read/write.
- In the current server startup flow, the API only listens after MongoDB connects. That means this endpoint cannot report `disconnected` if startup connection fails, because the HTTP server is not running.

Poke holes:

- There is no readiness/liveness split.
- There is no version/build info.
- There is no dependency latency check.
- There is no smoke test guaranteeing the route stays public.

Recommended next version:

- Keep this endpoint public.
- Add a test that expects `200`, `ok: true`, and `x-request-id`.
- Later split `GET /health/live` and `GET /health/ready` if deployment needs it.

## GET /api/v1/me

Purpose:

- Validates the current API token, syncs the Auth0 account into MongoDB, and returns the local user profile.

Route:

- `server/src/modules/users/user.routes.js`

Middleware path:

```txt
publicApiLimiter
authenticateJwt
syncUser
getMe
```

Required request header:

```txt
Authorization: Bearer <Auth0 API access token>
```

Response shape:

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "mongo-id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

User sync behavior:

- Reads `sub` from the verified token payload.
- Finds email/name claims from standard and namespaced claim keys.
- Upserts a MongoDB user by `auth0Sub`.
- Stores only `auth0Sub`, `email`, and `name`.
- Does not store passwords.

Good choices:

- Auth0 subject is the stable identity key.
- Email is not used as the primary identity key.
- User creation is automatic after a valid token.
- Response excludes Auth0 payload and internal fields.

Poke holes:

- Missing email verification enforcement.
- Missing email format/length validation.
- Missing explicit duplicate-key race handling for simultaneous first login.
- Missing user status fields such as disabled/deleted account state.
- Missing request ID propagation to client error objects.
- Missing tests for valid token, invalid token, and sync failure paths.

Recommended next version:

- Add `emailVerified` capture or enforce verified email before workspace access if product policy requires it.
- Add schema constraints for email/name lengths.
- Handle Mongo duplicate key errors during upsert by retrying `findOne`.
- Return or surface `x-request-id` in client failures.

## Error Response Shape

Shared error middleware returns:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-safe message"
  }
}
```

Behavior:

- 500 responses hide the raw internal message.
- Non-500 responses expose `err.message`.
- Error logs include request ID, method, path, code, status, and serialized error.

Poke holes:

- Some third-party auth errors may produce technical messages that are not ideal for end users.
- Stack traces are logged in development. That is useful locally but should never include request bodies, tokens, prompts, or resume text later.
- The client currently collapses API errors into one generic message.

Recommended next version:

- Create a small API error helper with stable codes.
- Include client-visible support fields only when safe:

```json
{
  "ok": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Please sign in again.",
    "requestId": "..."
  }
}
```

## Rate Limiting

Current limiter:

- Window: 15 minutes
- Limit: 100 requests
- Scope: all `/api/v1`
- Key: default IP key from `express-rate-limit`

Good:

- Minimal protection exists before any expensive routes are added.
- Standard rate limit headers are enabled.
- Legacy headers are disabled.

Weaknesses:

- It is not user-aware.
- It can punish shared networks.
- It does not map to product quotas.
- It is not enough for future AI, upload, PDF, or compile endpoints.

Recommended next version:

- Keep IP limiter for public abuse protection.
- Add user-level quota middleware for resume uploads, AI calls, and PDF compiles.
- Return stable app-specific codes for quota failures.

## CORS

Current CORS config:

```txt
origin: env.frontendUrl
credentials: true
```

Good:

- Single configured origin.
- Not wildcard.

Poke holes:

- `credentials: true` is not needed for bearer-token-only auth.
- Future cookie auth would need a more deliberate CORS/cookie policy.

Recommended next version:

- Remove `credentials: true` unless cookies are introduced.
- If cookies are introduced later, document SameSite, Secure, and CSRF strategy.

## Implemented vs Planned API Surface

Implemented:

- Health
- Current user sync/read

Planned but not implemented:

- Project CRUD
- Resume source upload/manual entry
- Templates
- Resume generation
- Versions
- PDF preview/download
- AI chat edits
- JD optimization
- ATS-style scoring
- Usage/quota APIs
- Account data deletion

Implementation guidance:

- Do not add all planned routes at once.
- Add project CRUD next only after current auth flow has tests.
- Every project route should load by `{ _id, userId, deletedAt: null }`.
- Return 404 for cross-user access to avoid leaking object existence.

