import { Bot, Loader2, SendHorizontal, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const templates = [
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    desc: 'Clean single-column layout for ATS parsing.',
    accent: '#111827',
    font: 'Georgia, "Times New Roman", serif',
  },
  {
    id: 'modern-compact',
    name: 'Modern Compact',
    desc: 'Dense one-page layout with polished spacing.',
    accent: '#2563eb',
    font: 'Arial, sans-serif',
  },
]

function templatePreviewHtml(template) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; background: #f8fafc; color: #111827; }
  .page { width: 8.5in; min-height: 11in; padding: .58in; box-sizing: border-box; background: white; font-family: ${template.font}; font-size: 10.4px; line-height: 1.32; }
  h1 { margin: 0; text-align: center; font-size: 23px; letter-spacing: 0; }
  .contact, .role { margin: 4px 0 0; text-align: center; color: #475569; }
  h2 { margin: 12px 0 5px; border-bottom: 1px solid ${template.accent}; color: ${template.accent}; font-size: 12px; letter-spacing: 0; text-transform: uppercase; }
  p { margin: 0 0 4px; }
  .head { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }
  ul { margin: 3px 0 0 15px; padding: 0; }
  li { margin: 2px 0; }
</style>
</head>
<body>
  <article class="page">
    <h1>Riya Sharma</h1>
    <p class="role">Full Stack Engineer</p>
    <p class="contact">riya@email.com · Bengaluru · linkedin.com/in/riya</p>
    <h2>Summary</h2>
    <p>Full stack engineer focused on reliable web products, clean APIs, and measurable user-facing improvements.</p>
    <h2>Skills</h2>
    <p><strong>Frontend:</strong> React, TypeScript, Tailwind</p>
    <p><strong>Backend:</strong> Node.js, Express, MongoDB, AWS</p>
    <h2>Experience</h2>
    <div class="head"><span>Software Engineer · Arcstream</span><span>2024 - Present</span></div>
    <ul>
      <li>Built reusable product workflows that reduced repeated setup steps across client projects.</li>
      <li>Improved API response consistency and error handling for authenticated workspace actions.</li>
    </ul>
    <h2>Projects</h2>
    <div class="head"><span>Resume SaaS Workspace</span><span>React · Express</span></div>
    <ul><li>Designed a document preview and AI editing flow around structured resume data.</li></ul>
    <h2>Education</h2>
    <p><strong>B.Tech Computer Science</strong> · Example Institute</p>
  </article>
</body>
</html>`
}

export function ProjectWorkspace({ project, busy, pendingMessage, onSelectTemplate, onSendMessage }) {
  if (!project) {
    return (
      <section className="grid h-full place-items-center overflow-auto px-6">
        <div className="max-w-xl text-center">
          <Sparkles className="mx-auto text-blue-600 dark:text-blue-300" size={34} aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black">Choose or create a project</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Your projects live in the sidebar. Each project starts with a saved resume context, then moves into template and AI feedback.
          </p>
        </div>
      </section>
    )
  }

  if (!project.templateId) {
    return (
      <section className="h-full overflow-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{project.title}</p>
          <h1 className="mt-2 text-3xl font-black">Choose a template</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Pick a live preview style. Generation starts right after selection.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(project.id, template.id)}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="aspect-[8.5/11] overflow-hidden rounded-md bg-slate-200 dark:bg-slate-950">
                  <iframe
                    title={`${template.name} template preview`}
                    srcDoc={templatePreviewHtml(template)}
                    className="h-[440%] w-[440%] origin-top-left scale-[0.227] border-0 bg-white"
                    tabIndex={-1}
                  />
                </div>
                <h2 className="mt-4 text-sm font-black">{template.name}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{template.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3 dark:border-white/10">
        <div>
          <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">{project.status}</p>
          <h1 className="mt-1 truncate text-lg font-black">{project.title}</h1>
        </div>
        <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Resume preview
        </div>
      </header>

      <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-h-0 overflow-auto bg-slate-200 p-4 dark:bg-slate-950/70 sm:p-5">
          <div className="mx-auto w-fit max-w-full rounded-lg bg-slate-300 p-3 shadow-inner dark:bg-slate-900 sm:p-4">
            {project.ai?.renderedHtml ? (
              <iframe
                title="Rendered resume preview"
                srcDoc={project.ai.renderedHtml}
                className="h-[980px] w-[760px] max-w-[calc(100vw-2.5rem)] rounded-sm border-0 bg-white shadow-xl"
              />
            ) : (
              <div className="grid h-[680px] w-[560px] max-w-[calc(100vw-2.5rem)] place-items-center rounded-sm bg-white p-8 text-center text-sm font-bold text-slate-500">
                <div>
                  <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" size={22} aria-hidden="true" />
                  <p>Your resume preview will appear after the AI draft is ready.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChatPanel project={project} busy={busy} pendingMessage={pendingMessage} onSendMessage={onSendMessage} />
      </div>
    </section>
  )
}

function ChatPanel({ project, busy, pendingMessage, onSendMessage }) {
  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const message = form.get('message')?.trim()

    if (!message) {
      return
    }

    event.currentTarget.reset()
    onSendMessage(project.id, message)
  }

  return (
    <aside className="flex min-h-0 flex-col border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900 lg:border-l lg:border-t-0">
      <div className="shrink-0 border-b border-slate-200 p-4 dark:border-white/10">
        <div className="flex items-center gap-2 text-sm font-black">
          <Bot size={18} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
          AI chat
        </div>
        <div className="mt-3 grid gap-2">
          {(project.ai?.feedback || []).map((item) => (
            <p key={item} className="rounded-lg bg-blue-50 p-3 text-sm text-blue-950 dark:bg-blue-500/10 dark:text-blue-100">{item}</p>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          {(project.ai?.messages || []).map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-lg p-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-slate-100 dark:bg-white/10' : 'mr-auto bg-blue-50 dark:bg-blue-500/10'}`}>
              {message.content}
            </div>
          ))}
          {pendingMessage ? (
            <div className="ml-auto max-w-[88%] rounded-lg bg-slate-100 p-3 text-sm leading-6 dark:bg-white/10">
              {pendingMessage}
            </div>
          ) : null}
          {busy && project.templateId ? (
            <div className="mr-auto flex max-w-[88%] items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm font-bold text-blue-950 dark:bg-blue-500/10 dark:text-blue-100">
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              Updating the draft
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 p-3 dark:border-white/10">
        <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950">
          <textarea
            name="message"
            rows="1"
            placeholder="Ask for a change or add missing context..."
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            disabled={busy}
          />
          <Button as="button" type="submit" variant="accent" className="min-h-10 px-3 py-2" disabled={busy} aria-label="Send message">
            <SendHorizontal size={17} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </aside>
  )
}
