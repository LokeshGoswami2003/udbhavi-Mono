import { FileUp, Keyboard, Loader2, Sparkles } from 'lucide-react'
import { emptyResumeData } from './resume-form'
import { ResumeReviewForm } from './ResumeReviewForm'

export function OnboardingFlow({ resume, busy, error, onUpload, onManual, onResumeChange, onSave }) {
  if (resume) {
    return (
      <div className="mx-auto max-w-5xl">
        <ResumeReviewForm resume={resume} busy={busy} onChange={onResumeChange} onSave={onSave} />
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-300">Welcome</p>
        <h1 className="mt-2 text-3xl font-black">Build your resume profile once</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Upload a resume or enter the basics manually. Projects will reuse this profile, so you do not have to start from scratch again.
        </p>
        <div className="mt-6 grid gap-3">
          {['Save your resume context', 'Reuse it across projects', 'Review before creating workspaces'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-bold">
              <Sparkles size={17} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-xl font-black">Choose source</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">PDF and DOCX are supported for upload.</p>
        {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</p> : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/70 p-5 text-center transition hover:border-blue-500 dark:border-blue-500/30 dark:bg-blue-500/10">
            {busy ? <Loader2 className="animate-spin text-blue-600" size={28} /> : <FileUp className="text-blue-600 dark:text-blue-300" size={30} />}
            <span className="mt-3 text-sm font-black">Upload resume</span>
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF or DOCX</span>
            <input className="sr-only" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onUpload} disabled={busy} />
          </label>

          <button
            type="button"
            onClick={() => onManual(emptyResumeData)}
            disabled={busy}
            className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-5 text-center transition hover:border-blue-400 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-white/5"
          >
            <Keyboard className="text-blue-600 dark:text-blue-300" size={30} aria-hidden="true" />
            <span className="mt-3 text-sm font-black">Enter manually</span>
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Start with basic fields</span>
          </button>
        </div>
      </section>
    </div>
  )
}
