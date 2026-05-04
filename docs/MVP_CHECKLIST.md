# MVP Completion Checklist

Date: 2026-05-04

This checklist is the current build order for completing the resume SaaS MVP without growing stale code.

## Current Working Foundation

- Auth0 login/signup and `/me` user sync.
- MongoDB user context.
- Resume upload/manual entry with raw file storage and text/link extraction.
- ChatGPT-style workspace shell with sidebar projects.
- Project creation by name only.
- Template selection flow.
- Mock AI resume draft and feedback pipeline.

## Must Ship For MVP

1. Real AI provider path
   - Done: Bedrock provider behind a small interface.
   - Done: Mock provider remains available for local development.
   - Done: Prompts return structured JSON and never direct LaTeX.
   - Pending: run one real Bedrock smoke call after credentials/env are intentionally enabled.

2. Resume generation versions
   - Store generated structured resume draft per project.
   - Keep chat feedback messages.
   - Preserve factual-source constraints.

3. Template rendering preview
   - Render the generated resume into an HTML preview first.
   - Keep LaTeX/PDF as the next layer after the draft UX works.

4. Project workspace UX
   - Sidebar lists projects.
   - Main panel shows template selection, preview, and feedback chat.
   - Project creation asks only for a name.

5. Account limits
   - Basic free-tier quotas for projects, uploads, and AI calls.
   - User-safe quota messages.

6. Verification
   - Client lint/build.
   - Server import or smoke test.
   - Browser check for authenticated workspace when local services are fresh.

## Deferred Until MVP Core Works

- Stripe.
- Team workspaces.
- Admin dashboard.
- Template marketplace.
- S3/R2 storage.
- Background workers.
- Full analytics.
