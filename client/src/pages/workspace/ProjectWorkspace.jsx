import { Bot, FileText, SendHorizontal, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const templates = [
  { id: 'classic-ats', name: 'Classic ATS', desc: 'Clean single-column layout for ATS parsing.' },
  { id: 'modern-compact', name: 'Modern Compact', desc: 'Dense one-page layout with polished spacing.' },
  { id: 'executive-clean', name: 'Executive Clean', desc: 'Outcome-led structure for senior profiles.' },
]

export function ProjectWorkspace({ project, busy, onSelectTemplate, onSendMessage }) {
  if (!project) {
    return (
      <section className="grid min-h-screen place-items-center px-6">
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
      <section className="min-h-screen px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{project.title}</p>
          <h1 className="mt-2 text-3xl font-black">Choose a template</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Pick a live preview style. Generation starts right after selection.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(project.id, template.id)}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="aspect-[3/4] rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
                  <div className="h-3 w-2/3 rounded bg-slate-800 dark:bg-white" />
                  <div className="mt-4 grid gap-2">
                    <div className="h-2 rounded bg-blue-500/70" />
                    <div className="h-2 rounded bg-slate-300 dark:bg-slate-700" />
                    <div className="h-2 w-5/6 rounded bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="mt-5 grid gap-2">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="h-2 rounded bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </div>
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
    <section className="grid min-h-screen grid-rows-[auto_1fr]">
      <header className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">{project.status}</p>
        <h1 className="mt-1 text-xl font-black">{project.title}</h1>
      </header>

      <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="overflow-y-auto bg-slate-100 p-5 dark:bg-slate-950/60">
          <article className="mx-auto min-h-[900px] max-w-3xl rounded-lg bg-white p-8 shadow-sm dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-300">
              <FileText size={18} aria-hidden="true" />
              Live resume preview
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800 dark:text-slate-100">
              {project.ai?.resumeDraft || 'Generating resume preview...'}
            </pre>
          </article>
        </div>

        <ChatPanel project={project} busy={busy} onSendMessage={onSendMessage} />
      </div>
    </section>
  )
}

function ChatPanel({ project, busy, onSendMessage }) {
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
      <div className="border-b border-slate-200 p-4 dark:border-white/10">
        <div className="flex items-center gap-2 text-sm font-black">
          <Bot size={18} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
          AI feedback
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
            <div key={`${message.role}-${index}`} className={`rounded-lg p-3 text-sm ${message.role === 'user' ? 'ml-8 bg-slate-100 dark:bg-white/10' : 'mr-8 bg-blue-50 dark:bg-blue-500/10'}`}>
              {message.content}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 dark:border-white/10">
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950">
          <input name="message" placeholder="Add context or ask for a change..." className="min-h-10 flex-1 bg-transparent px-2 text-sm outline-none" />
          <Button as="button" type="submit" variant="accent" className="min-h-10 px-3 py-2" disabled={busy} aria-label="Send message">
            <SendHorizontal size={17} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </aside>
  )
}
