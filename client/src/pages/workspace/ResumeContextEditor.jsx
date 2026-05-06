import { ArrowLeft, Link2, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PdfViewer } from './components/PdfViewer'
import { ResumeReviewForm } from './ResumeReviewForm'

export function ResumeContextEditor({
  resume,
  busy,
  onBack,
  onChange,
  onSave,
  onMakePrimary,
  onDelete,
  onLoadSourceFile,
}) {
  const resumeId = resume?.id || resume?._id
  const quality = resume?.extraction?.extractionQuality || {}
  const sourceLinks = resume?.extraction?.sourceLinks || []
  const isPdf = resume?.file?.mimeType === 'application/pdf'

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-white/10">
        <div className="min-w-0">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-blue-600 dark:text-slate-300">
            <ArrowLeft size={15} aria-hidden="true" />
            Resume context
          </button>
          <h1 className="mt-1 truncate text-lg font-black">{resume.label}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {!resume.isPrimary ? (
            <Button as="button" type="button" variant="secondary" onClick={() => onMakePrimary(resumeId)} disabled={busy || !resumeId}>
              Make primary
            </Button>
          ) : null}
          <Button as="button" type="button" variant="ghost" onClick={() => onDelete(resumeId)} disabled={busy || !resumeId}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(460px,0.8fr)]">
        <div className="min-h-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
          {isPdf ? (
            <PdfViewer
              title="Original uploaded resume"
              loadPdf={() => {
                if (!resumeId) {
                  return Promise.reject(new Error("This resume source is missing its id. Please reopen the resume context."))
                }
                return onLoadSourceFile(resumeId)
              }}
              reloadKey={resumeId}
              busyLabel="Loading original resume..."
            />
          ) : (
            <div className="h-full overflow-auto bg-slate-950 p-5 text-sm leading-6 text-slate-100">
              <p className="font-black">{resume.file?.originalName || 'Manual resume'}</p>
              <pre className="mt-4 whitespace-pre-wrap font-sans">{resume.extraction?.rawText || 'No source preview is available for this resume type.'}</pre>
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-black">Extraction quality</h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Metric label="Raw text" value={quality.rawTextChars ?? resume.extraction?.rawText?.length ?? 0} />
              <Metric label="Visible links" value={quality.visibleLinkCount ?? resume.extraction?.linkCount ?? 0} />
              <Metric label="Embedded links" value={quality.embeddedLinkCount ?? 0} />
              <Metric label="Total links" value={quality.totalLinkCount ?? resume.extraction?.sourceLinkCount ?? 0} />
            </div>
            {quality.parserWarnings?.length ? (
              <p className="rounded-md bg-amber-50 p-2 text-xs font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-100">{quality.parserWarnings.join(' ')}</p>
            ) : null}
          </div>

          <LinkMappingPanel links={sourceLinks} />
          <ResumeReviewForm resume={resume} busy={busy} onChange={onChange} onSave={onSave} />
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 dark:bg-white/5">
      <p className="text-[10px] uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function LinkMappingPanel({ links = [] }) {
  const groups = [
    ['Profile links', ['linkedin', 'github', 'portfolio', 'website', 'leetcode', 'coding_profile']],
    ['Project links', ['project']],
    ['Certificate links', ['certificate']],
    ['Unmapped source links', ['other']],
  ]

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Link2 size={16} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
        <h2 className="text-sm font-black">Link mapping</h2>
      </div>
      <div className="mt-3 grid gap-3">
        {groups.map(([title, types]) => {
          const items = links.filter((link) => types.includes(link.type))
          return (
            <div key={title}>
              <p className="text-xs font-black uppercase text-slate-400">{title}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {items.length ? items.map((link) => (
                  <span key={link.normalizedUrl || link.url} className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {link.label || link.type || 'Link'} · {link.normalizedUrl || link.url}
                  </span>
                )) : <span className="text-xs font-bold text-slate-400">None</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
