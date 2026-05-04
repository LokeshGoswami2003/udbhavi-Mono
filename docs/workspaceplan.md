# Workspace Architecture Plan

Date: 2026-05-04

Status: planning contract for the next workspace phase.

## Goal

Auth is now considered complete enough for the next product phase. The next goal is to build the main workspace foundation around a user-owned resume context:

- A user completes onboarding once by uploading a resume or entering details manually.
- The backend stores the user's resume profile and raw resume files in MongoDB.
- Resume text, links, and structured resume data are extracted and saved for reuse.
- Projects are created after onboarding and reuse the user's saved resume context.
- A user should not upload a resume again for every project.
- AI workflow, JD optimization, ATS scoring, and PDF rendering can continue later.

This keeps the first workspace phase small: account context, resume intake, extraction, storage, onboarding state, and project creation entry points.

## Current Implementation Baseline

Implemented now:

- Landing page.
- Auth0 login/signup.
- Protected `/app` workspace gate.
- Backend `GET /api/v1/health`.
- Backend `GET /api/v1/me`.
- MongoDB user sync from verified Auth0 access tokens.

Not implemented yet:

- Onboarding.
- Resume upload/manual resume profile.
- Project CRUD.
- Template selection.
- Resume editor.
- AI workflow.
- PDF preview/download.

## Revised Product Flow

```txt
Landing
  -> Auth0 login/signup
  -> /app
  -> backend /me syncs local user
  -> workspace checks onboarding state
  -> if no resume context:
       onboarding
         -> upload resume OR enter details manually
         -> extract and store resume data
         -> review/edit extracted details
         -> mark onboarding complete
  -> dashboard
  -> create project
       -> select saved resume context
       -> enter optional target role/job details
       -> choose template
       -> project workspace
```

Important change from the older plan:

```txt
Resume source belongs to the user account first.
Projects consume a selected saved resume instead of owning the original upload.
```

## Revised Project UX

The workspace should now behave more like a focused chat/productivity surface:

```txt
Vertical sidebar
  -> New project
  -> Project list
  -> Resume context

Main panel
  -> Selected project
  -> Template previews if no template is selected
  -> Live resume preview after template selection
  -> AI feedback chat beside the preview
```

Project creation is intentionally small:

```txt
New project
  -> enter project name only
  -> backend uses the user's primary resume context
  -> project opens in template selection state
```

Template selection starts the generation pipeline:

```txt
Choose template
  -> backend builds prompt from project + resume context + template rules
  -> provider returns resume draft + feedback questions
  -> UI shows live resume preview and interactive feedback chat
```

The implementation uses a Bedrock provider interface:

```txt
LLM_PROVIDER=bedrock
  -> AWS Bedrock JSON call using backend env vars
  -> Amazon Nova models use the Converse API
```

The prompt pipeline is already shaped for Bedrock. The app should only run real Bedrock calls after the backend environment is intentionally configured and the user is comfortable sending resume context to AWS.

Current Bedrock status:

```txt
LLM_PROVIDER=bedrock is wired.
AWS bearer-token env is supported.
Nova Pro is configured with `BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0`.
Nova models use the Bedrock Converse API.
Run npm run smoke:bedrock from server/ to verify readiness.
The app-path smoke works with Nova Pro after the model switch.
Treat the app's Bedrock API key as the source of truth; the local AWS CLI may be configured for a different account.
Mock AI responses are removed from the runtime path; provider failures now return clear API errors.
Uploaded PDF/DOCX files are sent directly to Nova during generation when available, with parser output used only as backup context.
```

## Preview Rendering Direction

The preview should feel closer to Overleaf than a markdown editor:

```txt
Project selected
  -> center panel shows a document page
  -> right panel shows AI feedback/chat
  -> backend stores ResumeData, rendered HTML, and LaTeX source
```

Current implementation:

- Two templates only: `classic-ats` and `modern-compact`.
- Template selection cards render live document-style previews instead of skeleton placeholders.
- The selected template's LaTeX sample is sent in the prompt as the formatting contract.
- Server generates escaped LaTeX source.
- Server generates an Overleaf-like HTML page preview from the same resume data.
- Existing old projects can rebuild their preview through the current renderer.
- The workspace shell is viewport-bound; sidebar, preview, and chat scroll independently.
- Chat shows pending user input and AI activity while the Bedrock request is running.

Pending for true compiled preview:

- Install/configure `tectonic`, `latexmk`, or `pdflatex` on the local/server runtime.
- Add preview/download endpoints that compile the stored LaTeX source.

## Workspace UX Model

### First-Time User

The first workspace screen should feel like onboarding, not an empty dashboard.

Recommended steps:

1. Welcome
   - Short product confirmation.
   - One primary action: `Set up resume profile`.
2. Resume Source
   - Upload resume: PDF/DOCX.
   - Enter manually.
3. Extracting
   - Show simple progress states: uploading, reading file, extracting details, ready for review.
   - Do not show technical parser names or implementation notes.
4. Review Details
   - Editable profile sections: personal info, links, summary, skills, experience, education, projects, certifications.
   - User can fix missing or incorrect extracted data.
5. Done
   - User lands on dashboard and can create the first project.

### Returning User

Dashboard should show:

- Resume profile status.
- Saved resumes.
- Projects.
- Create project action.
- Settings/profile access.

### Create Project

Project creation should not ask for another resume upload by default and should not ask for target details up front.

Recommended fields:

- Project name.

After creation:

- User chooses a template from visual preview cards.
- Backend starts resume generation.
- User gives target role, job description, missing metrics, and preferences through the chat-style feedback flow.

The upload action can exist as a secondary path:

- `Add another resume` from resume settings/profile.
- `Use a different resume` inside create project, which saves it to the user's resume library first.

## Data Ownership

```txt
User
  owns one UserData document
  owns many Resumes
  owns many Projects

Resume
  stores raw file metadata
  stores raw file bytes in MongoDB/GridFS
  stores extracted text and links
  stores structured ResumeData

Project
  references userId
  references resumeId
  stores target/job/template/project state
```

## MongoDB Collections

MongoDB collections are used instead of SQL tables, but the product concepts map to `user_data`, `resumes`, and `projects`.

### users

Existing auth-owned account collection.

```ts
{
  _id: ObjectId,
  auth0Sub: string,
  email?: string,
  name?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### user_data

One document per user for onboarding and reusable profile context.

```ts
{
  _id: ObjectId,
  userId: ObjectId,

  onboarding: {
    status: "not_started" | "resume_pending" | "review_pending" | "complete",
    completedAt?: Date
  },

  primaryResumeId?: ObjectId,

  profile: {
    basics?: ResumeData["basics"],
    links?: {
      label: string,
      url: string,
      source: "resume" | "manual"
    }[],
    preferredRoles?: string[],
    preferredTemplateId?: string
  },

  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```txt
userId unique
```

### resumes

Stores each uploaded or manually entered resume source for a user.

```ts
{
  _id: ObjectId,
  userId: ObjectId,

  sourceType: "upload" | "manual",
  label: string,
  isPrimary: boolean,

  file?: {
    storage: "gridfs",
    fileId: ObjectId,
    originalName: string,
    mimeType: string,
    size: number,
    sha256: string
  },

  extraction: {
    status: "pending" | "processing" | "ready" | "failed",
    parser: "pdf-parse" | "mammoth" | "manual",
    rawText?: string,
    links: {
      url: string,
      label?: string,
      source: "text" | "metadata"
    }[],
    parsedAt?: Date,
    errorCode?: string
  },

  resumeData: ResumeData,

  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}
```

Indexes:

```txt
{ userId: 1, updatedAt: -1 }
{ userId: 1, isPrimary: 1 }
{ userId: 1, "file.sha256": 1 }
```

### projects

Projects no longer store the original resume upload. They reference a saved resume.

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  resumeId: ObjectId,

  title: string,
  status: "draft" | "template_pending" | "ready" | "failed",

  target: {
    role?: string,
    company?: string,
    jobDescription?: string
  },

  templateId?: string,
  activeVersionId?: ObjectId,

  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}
```

Indexes:

```txt
{ userId: 1, updatedAt: -1 }
{ userId: 1, resumeId: 1 }
```

## ResumeData Shape

Keep the existing planned `ResumeData` shape from `docs/ResumeBuilderPlan.md` as the reusable normalized profile:

```ts
type ResumeData = {
  basics: {
    fullName: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    summary?: string;
  };
  skills: { category: string; items: string[] }[];
  experience: {
    company: string;
    role: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    bullets: string[];
    technologies?: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    bullets?: string[];
  }[];
  projects?: {
    name: string;
    description?: string;
    url?: string;
    bullets: string[];
    technologies?: string[];
  }[];
  certifications?: { name: string; issuer?: string; date?: string }[];
  awards?: { title: string; issuer?: string; date?: string; description?: string }[];
  customSections?: {
    title: string;
    items: {
      heading?: string;
      subheading?: string;
      date?: string;
      bullets?: string[];
    }[];
  }[];
};
```

## Storage Decision

For MVP, store raw resumes in MongoDB using GridFS.

Reasoning:

- It matches the current "MongoDB only" constraint.
- It avoids adding S3/R2 before the product flow is proven.
- It keeps uploaded file bytes out of normal Mongo documents.
- It supports files larger than the 16 MB document limit, though the MVP upload limit should stay much lower.

MVP upload rules:

```txt
Allowed types: PDF, DOCX
Max size: 5 MB
Storage: MongoDB GridFS
Do not log file contents, raw text, or extracted resume data
```

## Extraction Strategy

Use simple Express-side extraction first.

Recommended packages:

```txt
multer
pdf-parse
mammoth
crypto
mongoose GridFSBucket
```

MVP extraction flow:

```txt
Upload file
  -> validate type and size
  -> hash file
  -> save raw file to GridFS
  -> extract raw text
  -> extract URLs from raw text
  -> create preliminary ResumeData
  -> save resume document
  -> return review-ready state
```

For the first phase, URL extraction can be text-based:

```txt
https://...
http://...
www....
mailto links if present in text
common profile domains such as linkedin.com and github.com
```

PDF annotation-level hyperlink extraction can be added later if needed. It is not required for the first small implementation.

## API Plan

Base URL:

```txt
http://localhost:4000/api/v1
```

All routes below require Auth0 JWT validation and synced `req.user`.

### User Context

```txt
GET   /me
GET   /me/context
PATCH /me/context
```

`GET /me/context` returns:

```json
{
  "ok": true,
  "data": {
    "user": {},
    "userData": {},
    "primaryResume": {},
    "onboarding": {
      "status": "complete"
    }
  }
}
```

### Resume Library

```txt
GET    /resumes
POST   /resumes/upload
POST   /resumes/manual
GET    /resumes/:resumeId
PATCH  /resumes/:resumeId
POST   /resumes/:resumeId/primary
DELETE /resumes/:resumeId
```

Upload form field:

```txt
file: resume.pdf
```

Manual body:

```json
{
  "label": "Main resume",
  "resumeData": {}
}
```

### Projects

```txt
GET    /projects
POST   /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
```

Create project body:

```json
{
  "title": "Backend Engineer Resume",
  "resumeId": "saved_resume_id",
  "target": {
    "role": "Backend Engineer",
    "company": "Example",
    "jobDescription": ""
  },
  "templateId": "classic-ats"
}
```

Ownership rule:

```ts
Project.findOne({ _id: projectId, userId: req.user._id, deletedAt: null });
Resume.findOne({ _id: resumeId, userId: req.user._id, deletedAt: null });
```

Return `404` for missing or cross-user resources.

## Backend Module Shape

Keep modules feature-local and small.

```txt
server/src/modules/user-data/
  user-data.model.js
  user-data.routes.js
  user-data.controller.js
  user-data.service.js

server/src/modules/resumes/
  resume.model.js
  resume.routes.js
  resume.controller.js
  resume.service.js
  resume-extract.service.js
  resume-storage.service.js
  resume.schema.js

server/src/modules/projects/
  project.model.js
  project.routes.js
  project.controller.js
  project.service.js
  project.schema.js
```

Shared helpers only when needed:

```txt
server/src/middleware/upload.js
server/src/middleware/validate.js
server/src/utils/hash.js
server/src/utils/links.js
```

## Logging Rules For This Phase

Add practical backend logs, but keep them sanitized.

Allowed:

- request ID
- user ID
- route/module name
- resume ID/project ID
- file size
- mime type
- extraction status
- sanitized error code

Forbidden:

- raw resume text
- raw PDF/DOCX bytes
- full extracted profile data
- secrets
- tokens
- full connection strings
- prompts or future AI provider payloads

Example lifecycle events:

```txt
resume.upload.accepted
resume.storage.saved
resume.extraction.started
resume.extraction.completed
resume.extraction.failed
project.created
```

## Frontend Route Plan

Keep the first workspace UI compact:

```txt
/app
  dashboard or onboarding redirect state

/app/onboarding
  upload/manual/review/done flow

/app/resumes
  saved resume profile/library

/app/projects/new
  create project using saved resume

/app/projects/:projectId
  project detail shell
```

Manual routing is already close to its limit. If project route params become awkward, introduce a small route map or React Router before the editor grows.

## Frontend Component Plan

```txt
WorkspacePage
WorkspaceShell
WorkspaceSidebar
OnboardingFlow
ResumeSourceStep
ResumeUploadPanel
ManualResumeForm
ResumeExtractionStatus
ResumeReviewForm
ResumeLibrary
ProjectList
CreateProjectPage
TemplatePicker
```

UI principle:

```txt
Show product states, not implementation details.
```

Good user-facing labels:

- Reading your resume.
- We found your details.
- Review your profile.
- Create your first project.

Avoid user-facing labels:

- Running pdf-parse.
- Saving GridFS file.
- Mongoose document created.
- Parser returned raw text.

## Implementation Phases

### Phase 1: Workspace Context And Onboarding Plan

Definition of done:

- `workspaceplan.md` documents the revised architecture.
- Current auth flow remains unchanged.
- No project code is added before the plan is agreed.

### Phase 2: Backend Resume Context Foundation

Build:

- `user_data` model/service.
- `resumes` model/service.
- GridFS raw file storage.
- PDF/DOCX text extraction.
- URL extraction from text.
- Manual resume save.
- `GET /me/context`.
- resume library routes.

Definition of done:

- Authenticated user can upload a PDF/DOCX.
- Raw file is stored in MongoDB GridFS.
- Extracted text and links are stored in `resumes`.
- Manual details can create a resume without upload.
- User context points to the primary resume.

### Phase 3: Frontend Onboarding

Build:

- Workspace onboarding state.
- Upload/manual source step.
- Extraction status.
- Review/edit resume data.
- Resume library summary.

Definition of done:

- New user is guided through resume setup.
- Returning user lands on dashboard.
- No dead `New resume` action remains.

### Phase 4: Project Creation From Saved Resume

Build:

- Project model/service/routes.
- Create project UI.
- Saved resume selector.
- Target role/job details.
- Template selection.

Definition of done:

- User can create a project from an existing resume.
- Project references `resumeId`.
- Project does not duplicate raw resume file data.

### Later: AI And Editor

After the resume context and project foundation:

- AI extraction to improve structured `ResumeData`.
- JD optimizer.
- ATS-style score.
- Resume versions.
- LaTeX render and PDF preview/download.
- Chat-based editing.

## Open Decisions

These do not block the first plan, but should be decided before implementation grows:

- Whether onboarding completion requires review confirmation or can complete after successful extraction.
- Whether users can have multiple primary-like resume profiles for different job families.
- Whether unverified Auth0 emails can upload sensitive resume data.
- Whether to keep Auth0 token persistence in localStorage.
- Whether project creation should require a template immediately or allow a draft without template.

## Final Principle

```txt
The user owns resume context at the account level.
Projects are job/template workspaces built from that saved context.
Raw files, extracted text, links, and structured resume data are stored once and reused.
```
