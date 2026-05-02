import { CheckCircle2, MessageSquareText, ScanSearch } from 'lucide-react'
import { Button } from '../ui/Button'

export function ProductPreviewSection() {
  return (
    <section id="product-preview" className="bg-white px-5 py-20 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef6ff_48%,#f7f5ff)] p-6 shadow-2xl shadow-slate-200/60 md:p-10 lg:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0f172a,#082f49_48%,#1e1b4b)] dark:shadow-black/30">
        <div className="flex flex-col justify-center">
          <span className="text-sm font-black uppercase text-blue-700 dark:text-blue-200">Live editor preview</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">
            A resume builder that feels like a focused workspace
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            Users should immediately understand that Udbhavi is more than a prompt box. It is a controlled editing flow with assistant guidance, match scoring, and a real PDF preview.
          </p>
          <div className="mt-7 space-y-3">
            {['Chat edits create structured changes', 'Score suggestions stay practical', 'PDF preview stays beside the work'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <CheckCircle2 aria-hidden="true" className="text-emerald-500" size={18} />
                {item}
              </div>
            ))}
          </div>
          <Button href="/signup" variant="accent" className="mt-8 w-fit">
            Create your first resume
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/70 bg-white p-5 shadow-xl shadow-slate-300/40 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/20">
            <MessageSquareText aria-hidden="true" className="text-blue-600 dark:text-blue-300" size={25} />
            <h3 className="mt-5 font-black text-slate-950 dark:text-white">Assistant panel</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Ask for stronger bullets, missing detail prompts, or role-specific edits.
            </p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white p-5 shadow-xl shadow-slate-300/40 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/20">
            <ScanSearch aria-hidden="true" className="text-emerald-600 dark:text-emerald-300" size={25} />
            <h3 className="mt-5 font-black text-slate-950 dark:text-white">JD optimizer</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Compare against a job description and see what to improve honestly.
            </p>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-white/70 bg-white p-5 shadow-xl shadow-slate-300/40 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-slate-950 dark:text-white">Resume version timeline</h3>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">Ready</span>
            </div>
            <div className="space-y-3">
              {['Uploaded source resume', 'Optimized for backend role', 'Compiled one-page PDF'].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:!bg-slate-800/70 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
