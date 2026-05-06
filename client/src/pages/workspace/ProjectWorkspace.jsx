import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  Printer,
  SendHorizontal,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'

const templates = [
  {
    id: 'classic-ats',
    name: 'Template 1',
    desc: 'Clean ATS layout with projects first.',
    sections: ['Summary', 'Technical Skills', 'Projects', 'Education', 'Achievements'],
    accent: '#111827',
  },
  {
    id: 'modern-compact',
    name: 'Template 2',
    desc: 'Compact layout with experience included.',
    sections: ['Summary', 'Technical Skills', 'Experience', 'Projects', 'Education'],
    accent: '#111827',
  },
]

const previewContent = {
  'classic-ats': {
    location: 'Faridabad',
    summary:
      'B.Tech CSE graduate with hands-on experience in MERN stack development, REST APIs, and cloud deployment. Built a full-stack social media application using MongoDB, Express, React, and Node.js with features like authentication, API integration, and frontend-backend connectivity. Developed a real-time data-fetching project using Swiggy APIs, working with complex JSON schemas and resolving CORS issues by creating a custom proxy server on Google Cloud VM using Nginx.',
    skills: [
      ['Languages', 'JavaScript, TypeScript, Java, C++'],
      ['Web Development', 'React.js, Node.js, Express.js, HTML, CSS, RESTful APIs'],
      ['Databases', 'MongoDB, MySQL'],
      ['Cloud', 'AWS (EC2, Lambda, S3), Firebase, Google Cloud (Compute Engine)'],
      ['Tools', 'Git, Docker, Nginx'],
      ['Methodologies', 'Agile, Scrum, CI/CD'],
    ],
    experience: [],
    projects: [
      {
        name: 'Social-Media Platform',
        links: 'GitHub | YouTube | Live',
        bullets: [
          'Built a full-stack social media platform using ReactJS, Node.js, Express, MongoDB with 25+ RESTful APIs covering posts, users, likes, comments, and follow system.',
          'Implemented secure authentication and authorization using JWT, bcrypt, and custom middleware for validation, error handling, and rate limiting.',
          'Integrated Cloudinary for optimized media uploads with auto-compression and caching, reducing image load times by 20-25%.',
          'Improved API reliability by 30% using Axios interceptors and designed a scalable MongoDB schema with indexing.',
          'Developed structured backend logic and reusable frontend components for clean architecture and consistent data flow.',
        ],
      },
      {
        name: 'MunchMob Swiggy Clone',
        links: 'GitHub | Snapshots',
        bullets: [
          'Developed a fast, responsive ReactJS/Hooks interface to fetch and display real-time restaurant and menu data by reverse-engineering complex Swiggy API JSON schemas.',
          'Designed a custom Node.js/Express proxy server to fully bypass CORS restrictions and enable stable cross-origin data fetching.',
          'Deployed the backend on a Google Cloud VM and configured Nginx, custom domain, and HTTPS for reliable API access.',
          'Implemented efficient client-side data fetching using Axios with interceptors, reducing redundant network requests.',
          'Optimized parsing logic for large nested JSON responses, reducing processing time and enabling smoother UI updates.',
        ],
      },
      {
        name: 'The Game Room - Real-Time Tic Tac Toe',
        links: 'GitHub | YouTube',
        bullets: [
          'Designed and implemented key ReactJS components for the real-time Tic Tac Toe interface, including board, turn indicators, and result modals.',
          'Built interactive UI elements and managed game state using React Hooks, reducing unnecessary re-renders.',
          'Collaborated with teammates handling Socket.io and backend game logic to ensure seamless UI-server synchronization.',
        ],
      },
    ],
  },
  'modern-compact': {
    location: 'Hyderabad',
    summary:
      'Software Development Intern and B.Tech CSE graduate with hands-on experience in microservices, REST APIs, WebSockets, API Gateway, API authentication, React, Node.js, MongoDB, and cloud deployment. Built scalable backend services, real-time applications, and full-stack products, with exposure to hierarchy-based systems, third-party integrations, and configurable business logic.',
    skills: [
      ['Languages', 'JavaScript, TypeScript, Java, C++'],
      ['Backend', 'Node.js, Express.js, REST APIs, Microservices, API Gateway, WebSockets, API Key Authentication, JWT'],
      ['Frontend', 'React.js, HTML, CSS, Axios'],
      ['Databases', 'MongoDB, MySQL'],
      ['Architecture & Systems', 'Service Integration, Third-Party API Access, In-Memory Hierarchy Mapping, Real-Time Chat Systems'],
      ['Cloud, Tools & Practices', 'AWS, Firebase, Google Cloud, Git, Docker, Nginx, Linux, Agile, Scrum, CI/CD'],
    ],
    experience: [
      {
        role: 'Software Development Intern',
        meta: 'Arcstream Technologies, Hyderabad',
        dates: 'Jan 2026 - Present',
        bullets: [
          'Worked on a production-oriented microservice architecture, contributing to backend services, service integrations, and API Gateway-based request routing.',
          'Built an independent Connect Service microservice and integrated a real-time chat application using WebSockets for low-latency communication.',
          'Implemented in-memory hierarchical data construction using relationship mappings to build and traverse hierarchy-based user structures.',
          'Designed API key-based authentication for secure third-party access, and contributed across backend, frontend, and Dynamic Rule Engine modules.',
        ],
      },
    ],
    projects: [
      {
        name: 'Social-Media Platform',
        links: 'GitHub | YouTube | Live',
        bullets: [
          'Built a full-stack social media platform using ReactJS, Node.js, Express, MongoDB with 25+ REST APIs.',
          'Implemented secure authentication and authorization using JWT, bcrypt, plus middleware for validation and rate limiting.',
          'Integrated Cloudinary, Axios interceptors, and optimized MongoDB schemas with indexing.',
        ],
      },
      {
        name: 'MunchMob Swiggy Clone',
        links: 'GitHub | Snapshots',
        bullets: [
          'Developed a responsive ReactJS interface to fetch and display restaurant and menu data from complex Swiggy API JSON schemas.',
          'Built a custom Node.js/Express proxy server to bypass CORS restrictions and enable stable data fetching.',
          'Deployed the backend on a Google Cloud VM with Nginx, HTTPS, and a custom domain.',
        ],
      },
      {
        name: 'The Game Room - Real-Time Tic Tac Toe',
        links: 'GitHub | YouTube',
        bullets: [
          'Designed and implemented key ReactJS components for a real-time Tic Tac Toe interface.',
          'Collaborated with teammates working on Socket.io and backend logic to ensure smooth gameplay state updates.',
        ],
      },
    ],
  },
}

function templatePreviewHtml(template) {
  const compact = template.id === 'modern-compact'
  const content = previewContent[template.id]
  const itemSpacing = compact ? '0' : '2px'
  const sectionSpacing = compact ? '5px 0 4px' : '8px 0 8px'
  const renderBullets = (bullets) => `<ul>${bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`
  const renderEntry = (item) => `
    <div class="entry">
      <div class="head"><span>${item.name || item.role}</span><span>${item.links || item.dates || ''}</span></div>
      ${item.meta ? `<p>${item.meta}</p>` : ''}
      ${renderBullets(item.bullets)}
    </div>`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; background: #f8fafc; color: #111827; }
  .page { width: 8.5in; min-height: 11in; padding: .58in; box-sizing: border-box; background: white; font-family: Arial, Helvetica, sans-serif; font-size: ${compact ? '10px' : '10.4px'}; line-height: ${compact ? '1.28' : '1.32'}; }
  h1 { margin: 0; text-align: center; font-size: 23px; letter-spacing: 0; }
  .contact { margin: 4px 0 0; text-align: center; color: #475569; }
  h2 { margin: ${sectionSpacing}; border-bottom: 1px solid ${template.accent}; color: ${template.accent}; font-size: 12px; letter-spacing: 0; text-transform: uppercase; }
  p { margin: 0 0 4px; }
  .head { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }
  ul { margin: 3px 0 0 15px; padding: 0; }
  li { margin: ${itemSpacing} 0; }
  .entry { margin: 0 0 ${compact ? '4px' : '7px'}; }
  .summary::before { content: "• "; }
</style>
</head>
<body>
  <article class="page">
    <h1>Lokesh Goswami</h1>
    <p class="contact">lokesh.goswami.2003@gmail.com · +917017095682 · ${content.location} · LinkedIn · GitHub · LeetCode</p>
    <h2>Summary</h2>
    <p class="summary">${content.summary}</p>
    <h2>Technical Skills</h2>
    <ul>${content.skills.map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`).join('')}</ul>
    ${content.experience.length ? `<h2>Experience</h2>${content.experience.map(renderEntry).join('')}` : ''}
    <h2>Projects</h2>
    ${content.projects.map(renderEntry).join('')}
    <h2>Education</h2>
    <ul><li><strong>B.Tech in Computer Science and Engineering</strong> GLA University, Mathura <span style="float:right">2024</span></li><li><strong>Senior Secondary (Class 12)</strong> Saraswati Vidya Mandir, Kosi Kalan <span style="float:right">2020</span></li></ul>
    <h2>Achievements & Certifications</h2>
    <ul><li>Solved <strong>200+ DSA problems</strong> on LeetCode and completed DSA from <strong>Coding Ninjas</strong> <span style="float:right">Certificate</span></li><li>Built multiple full-stack MERN projects and completed the <strong>CodingShuttle Full-Stack Development Course</strong> <span style="float:right">Certificate</span></li></ul>
  </article>
</body>
</html>`
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
    return (
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 py-4 lg:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{project.title}</p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Choose a template</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Pick the resume layout that best fits this role.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 grid min-h-0 w-full max-w-6xl gap-4 overflow-y-auto pb-2 md:grid-cols-2">
            {templates.map((template) => (
              <article
                key={template.id}
                className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-400 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="grid min-h-0 flex-1 place-items-center overflow-hidden rounded-md bg-slate-100 p-2 dark:bg-slate-950">
                  <div className="relative aspect-[8.5/11] h-[min(56dvh,620px)] max-h-full overflow-hidden bg-white shadow-sm">
                    <iframe
                      title={`${template.name} template preview`}
                      srcDoc={templatePreviewHtml(template)}
                      className="pointer-events-none absolute left-0 top-0 h-[1056px] w-[816px] origin-top-left scale-[0.42] border-0 bg-white"
                      tabIndex={-1}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-sm font-black">{template.name}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{template.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {template.sections.slice(0, 4).map((section) => (
                        <span key={section} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button as="button" type="button" variant="accent" className="min-h-10 shrink-0 px-3 py-2 text-xs" onClick={() => onSelectTemplate(project.id, template.id)} disabled={busy.selectingTemplate}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {busy.selectingTemplate ? 'Generating' : 'Use template'}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                </div>
              </article>
            ))}
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
        <PreviewActions project={project} busy={busy} onDownloadPdf={onDownloadPdf} />
      </header>

      <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(420px,32vw)] xl:grid-cols-[minmax(0,1fr)_500px]">
        <PdfPreview project={project} busy={busy} onLoadPreviewPdf={onLoadPreviewPdf} />

        <ChatPanel project={project} busy={busy} onSendMessage={onSendMessage} />
      </div>
    </section>
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

function PdfPreview({ project, busy, onLoadPreviewPdf }) {
  const [pdfUrl, setPdfUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pdfUrlRef = useRef('')
  const compiledAt = project.ai?.pdf?.compiledAt || ''
  const hasLatexSource = Boolean(project.ai?.latexSource)
  const previewStatus = busy.selectingTemplate || busy.sendingMessage || project.status === 'processing'
    ? 'Updating resume...'
    : loading || busy.loadingPreview
      ? 'Compiling PDF...'
      : pdfUrl
        ? 'Preview ready'
        : 'Building resume...'

  useEffect(() => {
    let isActive = true

    async function loadPdf() {
      if (!project?.id || project.status !== 'ready' || !hasLatexSource) {
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current)
          pdfUrlRef.current = ''
        }
        setPdfUrl('')
        setError('')
        return
      }

      setLoading(true)
      setError('')

      try {
        const blob = await onLoadPreviewPdf(project.id)
        const objectUrl = URL.createObjectURL(blob)

        if (isActive) {
          if (pdfUrlRef.current) {
            URL.revokeObjectURL(pdfUrlRef.current)
          }
          pdfUrlRef.current = objectUrl
          setPdfUrl(objectUrl)
        } else {
          URL.revokeObjectURL(objectUrl)
        }
      } catch (loadError) {
        if (isActive) {
          setPdfUrl('')
          setError(loadError.message || 'Could not load the PDF preview.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      isActive = false
    }
  }, [compiledAt, hasLatexSource, onLoadPreviewPdf, project?.activeVersionId, project?.id, project?.status])

  useEffect(() => () => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current)
    }
  }, [])

  return (
    <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[#111827]">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[#293241] px-4">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <FileText size={17} className="text-blue-200" aria-hidden="true" />
          PDF preview
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-black uppercase text-slate-200">
          {previewStatus}
        </span>
      </div>

      <div className="min-h-0 bg-[#1f2937] p-4">
        <div className="h-full overflow-hidden rounded-sm bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
          {pdfUrl ? (
            <div className="relative h-full">
              <iframe title="Resume PDF preview" src={pdfUrl} className="h-full w-full border-0 bg-white" />
              {loading || busy.loadingPreview || busy.sendingMessage || busy.selectingTemplate ? (
                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-slate-950/80 px-3 py-2 text-xs font-bold text-white shadow-lg">
                  <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                  {previewStatus}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid h-full place-items-center bg-slate-950 p-8 text-center text-sm font-bold text-slate-200">
              {error ? (
                <div className="max-w-md rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</div>
              ) : (
                <div>
                  <Loader2 className="mx-auto mb-3 animate-spin text-blue-300" size={22} aria-hidden="true" />
                  <p>{previewStatus}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">
            {project.status}
          </span>
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
            <ChatMessage key={`${message.role}-${index}`} message={message} busy={busy} onQuickReply={(reply) => onSendMessage(project.id, reply)} />
          ))}
          {busy.sendingMessage && project.templateId ? (
            <div className="mr-auto flex max-w-[92%] items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm font-bold text-blue-950 dark:bg-blue-500/10 dark:text-blue-100">
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              Updating the draft
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
          <Button as="button" type="submit" variant="accent" className="min-h-12 px-4 py-2" disabled={busy.sendingMessage} aria-label="Send message">
            {busy.sendingMessage ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <SendHorizontal size={17} aria-hidden="true" />}
          </Button>
        </div>
      </form>
    </aside>
  )
}

function ChatMessage({ message, busy, onQuickReply }) {
  const metadata = message.metadata || {}
  const isUser = message.role === 'user'

  return (
    <div className={`max-w-[92%] rounded-lg p-3 text-sm leading-6 ${isUser ? 'ml-auto bg-slate-100 dark:bg-white/10' : 'mr-auto bg-blue-50 dark:bg-blue-500/10'}`}>
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
