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
   - Done: Amazon Nova models use the Bedrock Converse API.
   - Done: Local config is pointed at Nova Pro with `BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0`.
   - Done: Mock provider has been removed from the runtime path.
   - Done: Prompts return structured JSON and never direct LaTeX.
   - Done: Local env can enable `LLM_PROVIDER=bedrock`.
   - Done: `npm run smoke:bedrock` provides a sanitized Bedrock readiness check from `server/`.
   - Done: Bedrock smoke works with Nova Pro in the app environment.
   - Done: Uploaded PDF/DOCX files are sent directly to Nova during resume generation when available.

2. Resume generation versions
   - Store generated structured resume draft per project.
   - Keep chat feedback messages.
   - Preserve factual-source constraints.

3. Template rendering preview
   - Done: Render the generated resume into an Overleaf-like HTML page preview.
   - Done: Generate LaTeX source from the same resume data.
   - Done: Prompt includes the selected template's LaTeX sample as the formatting contract.
   - Pending: install/configure a LaTeX compiler for true PDF preview/download.

4. Project workspace UX
   - Done: Sidebar lists projects and stays inside the viewport on mobile and desktop.
   - Done: Template selection shows live document-style previews instead of skeleton cards.
   - Done: Main panel shows the generated resume result and AI chat.
   - Done: Chat shows pending user input and AI activity while a request is running.
   - Done: Project creation asks only for a name.

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
