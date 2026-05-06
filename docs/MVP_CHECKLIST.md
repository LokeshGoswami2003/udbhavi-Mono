# MVP Completion Checklist

Date: 2026-05-04

This checklist is the current build order for completing the resume SaaS MVP without growing stale code.

## Current Working Foundation

- Auth0 login/signup and `/me` user sync.
- MongoDB user context.
- Resume upload/manual entry with raw file storage; upload extraction is not shown as candidate truth.
- ChatGPT-style workspace shell with sidebar projects.
- Project creation by name only.
- Template selection flow.
- Bedrock-backed MiniMax M2.5 resume extraction and chat-edit pipeline.

## Must Ship For MVP

1. Real AI provider path
   - Done: Bedrock provider behind a small interface.
   - Changed: MiniMax M2.5 is now the target Bedrock model with `BEDROCK_MODEL_ID=minimax.minimax-m2.5`.
   - Done: MiniMax M2.5 uses the Bedrock Converse API.
   - Done: Mock provider has been removed from the runtime path.
   - Changed: Prompts now return structured `ResumeData` and chat patch operations. The LLM does not return final LaTeX.
   - Done: Local env can enable `LLM_PROVIDER=bedrock`.
   - Done: `npm run smoke:bedrock` provides a sanitized Bedrock readiness check from `server/`.
   - Changed: Uploaded PDF/DOCX files are stored and sent directly to the Bedrock model during resume generation when available; local parsing is only a fallback source, not the displayed candidate profile.
   - Changed: Initial generation and chat edits send the full project conversation as context.

2. Resume generation versions
   - Done: Store generated structured `project.ai.resumeData` per project.
   - Done: Keep chat feedback messages with assistant metadata, suggestions, questions, and quick replies.
   - Done: Preserve factual-source constraints by forcing extraction/chat through structured JSON.

3. Template rendering preview
   - Done: Backend renders deterministic LaTeX from validated `ResumeData` and fixed templates.
   - Done: Backend compiles the rendered LaTeX into a real PDF using the no-Docker Node Tectonic compiler path.
   - Done: Initial generation stores `ResumeData` as the source of truth and derives `latexSource` from backend templates.
   - Done: Chat edits return safe patch operations, update `ResumeData`, and rerender `latexSource`.
   - Done: Client preview loads `/projects/:projectId/preview.pdf` as an authenticated PDF blob instead of regex-converted HTML.
   - Done: Download action returns the compiled PDF from `/projects/:projectId/download.pdf`.
   - Legacy: `renderedHtml` and the regex LaTeX-to-HTML renderer are fallback-only and are not the product preview path.

4. Project workspace UX
   - Done: Sidebar lists projects and stays inside the viewport on mobile and desktop.
   - Done: Template selection shows live document-style previews instead of skeleton cards.
   - Done: Main panel shows the generated resume result and AI chat.
   - Done: Chat shows pending user input and AI activity while a request is running.
   - Done: AI feedback, assistant suggestions, questions, and quick replies are clickable chat prompts so the assistant can guide revisions.
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
