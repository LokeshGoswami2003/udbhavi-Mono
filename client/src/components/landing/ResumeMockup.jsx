import { Bot, CheckCircle2, Download, FileText, Gauge, Sparkles } from 'lucide-react'

export function ResumeMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_70%_90%,rgba(124,58,237,0.2),transparent_35%)] blur-xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-2xl shadow-slate-300/60 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/30">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
              <FileText aria-hidden="true" size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-white">Backend Engineer Resume</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Saved just now</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
            <Download aria-hidden="true" size={14} />
            PDF
          </button>
        </div>

        <div className="grid min-w-0 gap-0 md:grid-cols-[0.84fr_1.16fr]">
          <aside className="border-b border-slate-200/80 bg-slate-50/80 p-4 md:border-b-0 md:border-r dark:border-white/10 dark:bg-slate-950/45">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-200">
                <Bot aria-hidden="true" size={16} />
                AI assistant
              </div>
              <p className="rounded-lg bg-blue-600 p-3 text-sm font-semibold text-white">
                Rewrite my experience for a backend developer role.
              </p>
              <div className="mt-3 rounded-lg bg-white p-3 text-xs leading-5 text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                Improved 3 bullets, kept facts intact, and added stronger action verbs.
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-950 dark:text-white">ATS-style score</span>
                <Gauge aria-hidden="true" className="text-emerald-500" size={17} />
              </div>
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[conic-gradient(#10b981_0_82%,#dbeafe_82%_100%)] p-2 dark:bg-[conic-gradient(#34d399_0_82%,#1e293b_82%_100%)]">
                  <div className="grid h-full w-full place-items-center rounded-full bg-white text-xl font-black text-slate-950 dark:bg-slate-900 dark:text-white">
                    82
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Strong match</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Add Docker and CI/CD only if you have used them.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {['JSON valid', 'One page'].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                >
                  <CheckCircle2 aria-hidden="true" className="text-emerald-500" size={15} />
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 bg-white p-4 dark:bg-slate-100 sm:p-5">
            <div className="mx-auto min-h-[470px] max-w-sm rounded-sm border border-slate-200 bg-white p-8 text-slate-950 shadow-xl shadow-slate-200/80">
              <div className="mb-5 border-b border-slate-200 pb-4">
                <p className="text-2xl font-black">JOHN DOE</p>
                <p className="mt-1 text-sm font-semibold">Backend Developer</p>
                <p className="mt-2 text-[10px] text-slate-500">
                  john@example.com | New York, USA | linkedin.com/in/johndoe
                </p>
              </div>
              {[
                ['SUMMARY', 2],
                ['EXPERIENCE', 5],
                ['PROJECTS', 3],
                ['EDUCATION', 2],
              ].map(([title, rows]) => (
                <section key={title} className="mb-5">
                  <h3 className="mb-2 text-[11px] font-black">{title}</h3>
                  <div className="space-y-2">
                    {Array.from({ length: rows }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full bg-slate-200 ${
                          index % 3 === 0 ? 'w-full' : index % 3 === 1 ? 'w-10/12' : 'w-8/12'
                        }`}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-24 hidden rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800 shadow-xl shadow-amber-200/50 lg:flex dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
        <Sparkles aria-hidden="true" className="mr-2" size={15} />
        3 stronger bullets
      </div>
    </div>
  )
}
