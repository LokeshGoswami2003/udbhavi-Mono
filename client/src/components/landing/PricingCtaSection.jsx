import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionLabel } from '../ui/SectionLabel'

export function PricingCtaSection() {
  return (
    <section id="pricing" className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.78fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/20">
          <SectionLabel>Free to start</SectionLabel>
          <h2 className="mt-5 max-w-3xl text-3xl font-black text-slate-950 sm:text-5xl dark:text-white">
            Ready to build your next resume?
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Create a polished, job-targeted resume and download it as a professional PDF. Start with the free MVP limits, upgrade paths can come later.
          </p>
          <Button href="/signup" variant="accent" className="mt-8">
            Start building free
            <ArrowRight aria-hidden="true" size={18} />
          </Button>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No credit card required.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-slate-950">
          <p className="text-sm font-black uppercase text-blue-700 dark:text-blue-200">MVP free tier</p>
          <div className="mt-5 space-y-4">
            {['3 resume projects', 'Daily AI edit allowance', 'PDF previews and downloads', 'Private account workspace'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <CheckCircle2 aria-hidden="true" className="text-emerald-500" size={18} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
