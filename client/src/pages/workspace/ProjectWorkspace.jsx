import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Loader2,
  Printer,
  SendHorizontal,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { PdfViewer } from './components/PdfViewer'

const templates = [
  {
    id: 'classic-ats',
    name: 'Template 1 — Classic ATS',
    desc: 'Clean ATS layout with projects first. Best for early-career, projects-led resumes.',
    sections: ['Summary', 'Technical Skills', 'Projects', 'Education', 'Achievements'],
    accent: '#111827',
  },
  {
    id: 'modern-compact',
    name: 'Template 2 — Modern Compact',
    desc: 'Dense, single-page layout that includes Experience plus Projects.',
    sections: ['Summary', 'Technical Skills', 'Experience', 'Projects', 'Education'],
    accent: '#111827',
  },
]

const previewContent = {
  'classic-ats': {
    summary:
      'B.Tech CSE graduate with hands-on MERN-stack experience. Builds full-stack platforms with REST APIs, JWT auth, and cloud deployment. Comfortable with custom proxies, complex JSON parsing, and real-time UI patterns.',
    skills: [
      ['Languages', 'JavaScript, TypeScript, Java, C++'],
      ['Web', 'React.js, Node.js, Express.js, REST APIs'],
      ['Databases', 'MongoDB, MySQL'],
      ['Cloud', 'AWS, Firebase, Google Cloud'],
    ],
    projects: [
      ['Social-Media Platform', 'GitHub | YouTube | Live'],
      ['MunchMob Swiggy Clone', 'GitHub | Snapshots'],
      ['The Game Room — Tic Tac Toe', 'GitHub | YouTube'],
    ],
    showExperience: false,
  },
  'modern-compact': {
    summary:
      'Software Development Intern and B.Tech CSE graduate with hands-on microservices, REST APIs, WebSockets, and React/Node.js. Builds scalable backend services and real-time apps.',
    skills: [
      ['Languages', 'JavaScript, TypeScript, Java, C++'],
      ['Backend', 'Node.js, Express.js, REST APIs, Microservices, WebSockets'],
      ['Frontend', 'React.js, Axios'],
      ['Cloud', 'AWS, Firebase, Google Cloud, Docker, Nginx'],
    ],
    projects: [
      ['Social-Media Platform', 'GitHub | YouTube | Live'],
      ['MunchMob Swiggy Clone', 'GitHub | Snapshots'],
      ['The Game Room — Tic Tac Toe', 'GitHub | YouTube'],
    ],
    showExperience: true,
  },
}

export function ProjectWorkspace({ project, busy, onSelectTemplate, onSendMessage, onDownloadPdf, onLoadPreviewPdf }) {
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
    return <TemplateChooser project={project} busy={busy} onSelectTemplate={onSelectTemplate} />
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3 dark:border-white/10">
        <div>
          <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">{project.status}</p>
          <h1 className="mt-1 truncate text-lg font-black">{project.title}</h1>
        </div>
        <PreviewActions project={project} busy={busy} onDownloadPdf={onDownloadPdf} />
      </header>

      <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(420px,32vw)] xl:grid-cols-[minmax(0,1fr)_500px]">
        <PdfPreviewPanel project={project} busy={busy} onLoadPreviewPdf={onLoadPreviewPdf} onDownloadPdf={onDownloadPdf} />
        <ChatPanel project={project} busy={busy} onSendMessage={onSendMessage} />
      </div>
    </section>
  )
}

function TemplateChooser({ project, busy, onSelectTemplate }) {
  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 py-4 lg:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{project.title}</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">Choose a template</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Pick the resume layout that best fits this role. The selected template controls section order and density.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 grid min-h-0 w-full max-w-7xl gap-5 overflow-y-auto pb-4 lg:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            disabled={busy.selectingTemplate}
            onSelect={() => onSelectTemplate(project.id, template.id)}
          />
        ))}
      </div>
    </section>
  )
}

function TemplateCard({ template, disabled, onSelect }) {
  const content = previewContent[template.id]
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-400 hover:shadow-lg dark:border-white/10 dark:bg-slate-900">
      <div className="grid place-items-center bg-slate-100 p-4 dark:bg-slate-950">
        <div className="aspect-[8.5/11] w-full max-w-[420px] overflow-hidden rounded-md bg-white shadow-md ring-1 ring-slate-200 dark:ring-white/10">
          <TemplateThumbnail template={template} content={content} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">{template.name}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{template.desc}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {template.sections.map((section) => (
            <span
              key={section}
              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300"
            >
              {section}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-2">
          <Button
            as="button"
            type="button"
            variant="accent"
            className="w-full justify-center"
            onClick={onSelect}
            disabled={disabled}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {disabled ? 'Generating' : 'Use this template'}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  )
}

function TemplateThumbnail({ template, content }) {
  return (
    <div className="flex h-full w-full flex-col gap-2 px-5 py-5 text-[8px] leading-tight text-slate-800">
      <div className="text-center">
        <p className="text-[14px] font-black tracking-tight text-slate-900">Lokesh Goswami</p>
        <p className="mt-0.5 text-[7px] font-bold text-slate-500">
          email@example.com · +91 0000 · {template.id === 'modern-compact' ? 'Hyderabad' : 'Faridabad'} · LinkedIn · GitHub · LeetCode
        </p>
      </div>

      <ThumbSection title="Summary">
        <p className="text-slate-700">{content.summary}</p>
      </ThumbSection>

      <ThumbSection title="Technical Skills">
        <ul className="ml-3 list-disc">
          {content.skills.map(([label, value]) => (
            <li key={label}>
              <span className="font-bold">{label}:</span> {value}
            </li>
          ))}
        </ul>
      </ThumbSection>

      {content.showExperience ? (
        <ThumbSection title="Experience">
          <div className="font-bold">Software Development Intern — Arcstream Technologies</div>
          <div className="text-slate-500">Hyderabad · Jan 2026 – Present</div>
          <ul className="ml-3 list-disc">
            <li>Microservice architecture, API Gateway routing, and service integrations.</li>
            <li>Real-time chat via WebSockets in a Connect Service microservice.</li>
          </ul>
        </ThumbSection>
      ) : null}

      <ThumbSection title="Projects">
        {content.projects.map(([name, links]) => (
          <div key={name} className="flex justify-between gap-2">
            <span className="font-bold">{name}</span>
            <span className="text-blue-600">{links}</span>
          </div>
        ))}
      </ThumbSection>

      <ThumbSection title="Education">
        <div className="flex justify-between">
          <span>
            <span className="font-bold">B.Tech CSE</span>, GLA University, Mathura
          </span>
          <span>2024</span>
        </div>
      </ThumbSection>
    </div>
  )
}

function ThumbSection({ title, children }) {
  return (
    <div>
      <p className="border-b border-slate-300 pb-0.5 text-[9px] font-black uppercase tracking-wide text-slate-900">{title}</p>
      <div className="mt-1 text-slate-700">{children}</div>
    </div>
  )
}

function PreviewActions({ project, busy, onDownloadPdf }) {
  const hasLatex = Boolean(project.ai?.latexSource)

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => onDownloadPdf(project.id)}
        disabled={!hasLatex || busy.downloadingPdf}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      >
        {busy.downloadingPdf ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : <Printer size={15} aria-hidden="true" />}
        {busy.downloadingPdf ? 'Preparing' : 'Download PDF'}
      </button>
    </div>
  )
}

function PdfPreviewPanel({ project, busy, onLoadPreviewPdf, onDownloadPdf }) {
  const reloadKey = `${project.id}:${project.activeVersionId || ''}:${project.ai?.pdf?.latexHash || ''}:${project.ai?.pdf?.compiledAt || ''}:${project.updatedAt || ''}`
  const hasLatexSource = Boolean(project.ai?.latexSource)
  const ready = project.status === 'ready' && hasLatexSource

  const loadPdf = useCallback(async () => {
    if (!ready) return null
    return onLoadPreviewPdf(project.id)
  }, [onLoadPreviewPdf, project.id, ready])

  const busyLabel = busy.selectingTemplate || project.status === 'processing'
    ? 'Generating draft...'
    : busy.sendingMessage
      ? 'Updating preview...'
      : busy.loadingPreview
        ? 'Compiling PDF...'
        : ''

  if (!ready) {
    return (
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[#1f2937]">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[#293241] px-4 text-white">
          <span className="text-sm font-black">PDF preview</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold uppercase text-slate-200">
            {busyLabel || 'Building resume...'}
          </span>
        </div>
        <div className="grid min-h-0 place-items-center p-6 text-center text-sm font-bold text-slate-200">
          <div>
            <Loader2 className="mx-auto mb-3 animate-spin text-blue-300" size={22} aria-hidden="true" />
            <p>{busyLabel || 'Building your resume preview...'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PdfViewer
      title="Resume PDF"
      loadPdf={loadPdf}
      reloadKey={reloadKey}
      busyLabel={busyLabel || undefined}
      onDownload={onDownloadPdf ? () => onDownloadPdf(project.id) : undefined}
    />
  )
}

function ChatPanel({ project, busy, onSendMessage }) {
  const messagesEndRef = useRef(null)
  const feedbackActions = (project.ai?.feedback || []).slice(0, 3)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [busy.sendingMessage, project.ai?.messages?.length])

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
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black">
            <Bot size={18} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
            AI chat
          </div>
          <ChatStatusPill project={project} busy={busy} />
        </div>
        {feedbackActions.length ? (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {feedbackActions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSendMessage(project.id, item)}
                disabled={busy.sendingMessage}
                className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-left text-[11px] font-black leading-4 text-blue-900 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-300/20 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/15"
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {['Paste job description', 'Improve wording', 'Fix links'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSendMessage(project.id, item)}
                disabled={busy.sendingMessage}
                className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="grid gap-3">
          {(project.ai?.messages || []).map((message, index) => (
            <ChatMessage
              key={`${message.role}-${index}`}
              message={message}
              busy={busy}
              onQuickReply={(reply) => onSendMessage(project.id, reply)}
            />
          ))}
          {busy.sendingMessage && project.templateId ? (
            <div className="mr-auto flex max-w-[92%] items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm font-bold text-blue-950 dark:bg-blue-500/10 dark:text-blue-100">
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              Updating resume...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 p-3 dark:border-white/10">
        <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <textarea
            name="message"
            rows="2"
            placeholder="Ask for a change or add missing context..."
            className="max-h-32 min-h-14 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 outline-none"
            disabled={busy.sendingMessage}
          />
          <Button
            as="button"
            type="submit"
            variant="accent"
            className="min-h-12 px-4 py-2"
            disabled={busy.sendingMessage}
            aria-label="Send message"
          >
            {busy.sendingMessage ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <SendHorizontal size={17} aria-hidden="true" />}
          </Button>
        </div>
      </form>
    </aside>
  )
}

function ChatStatusPill({ project, busy }) {
  let label = project.status
  let cls = 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'

  if (busy.sendingMessage) {
    label = 'Updating resume'
    cls = 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
  } else if (busy.loadingPreview) {
    label = 'Compiling PDF'
    cls = 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
  } else if (project.status === 'failed') {
    label = 'Failed'
    cls = 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200'
  } else if (project.status === 'ready') {
    label = 'Ready'
    cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
  }

  return (
    <span className={`rounded-md px-2 py-1 text-[11px] font-black uppercase ${cls}`}>{label}</span>
  )
}

function ChatMessage({ message, busy, onQuickReply }) {
  const metadata = message.metadata || {}
  const isUser = message.role === 'user'

  return (
    <div
      className={`max-w-[92%] rounded-lg p-3 text-sm leading-6 ${
        isUser ? 'ml-auto bg-slate-100 dark:bg-white/10' : 'mr-auto bg-blue-50 dark:bg-blue-500/10'
      }`}
    >
      <p>{message.content}</p>

      {!isUser && metadata.changeSummary?.length ? (
        <div className="mt-3 rounded-md bg-white/70 p-2 text-xs leading-5 text-slate-700 dark:bg-slate-950/35 dark:text-slate-200">
          <p className="font-black">Changed</p>
          <ul className="mt-1 space-y-1">
            {metadata.changeSummary.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={13} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!isUser && metadata.questions?.length ? (
        <div className="mt-3 grid gap-2">
          {metadata.questions.map((question) => (
            <div key={question} className="rounded-md border border-blue-200 bg-white/80 p-2 text-xs font-bold leading-5 text-blue-950 dark:border-blue-300/20 dark:bg-slate-950/35 dark:text-blue-100">
              {question}
            </div>
          ))}
        </div>
      ) : null}

      {!isUser && metadata.suggestions?.length ? (
        <details className="mt-3 rounded-md bg-blue-100/70 px-2 py-1.5 text-xs font-bold text-blue-900 dark:bg-blue-400/15 dark:text-blue-100">
          <summary className="cursor-pointer">Suggestions ({metadata.suggestions.length})</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {metadata.suggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onQuickReply(suggestion)}
                disabled={busy.sendingMessage}
                className="rounded-md bg-white px-2 py-1 text-left text-[11px] font-bold text-blue-800 transition hover:bg-blue-50 disabled:opacity-60 dark:bg-white/5 dark:text-blue-100 dark:hover:bg-white/10"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </details>
      ) : null}

      {!isUser && metadata.quickReplies?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {metadata.quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => onQuickReply(reply)}
              disabled={busy.sendingMessage}
              className="rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-black text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-300/20 dark:bg-white/5 dark:text-blue-100 dark:hover:bg-white/10"
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
