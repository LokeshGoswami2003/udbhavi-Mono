import { ArrowRight } from 'lucide-react'
import { workflowSteps } from '../../lib/landing-data'
import { SectionLabel } from '../ui/SectionLabel'

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-slate-200 bg-white px-5 py-20 sm:px-6 lg:px-8 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">
            From old resume to polished PDF in four focused steps
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Each step moves the user closer to a real downloadable resume, with AI helping and the product staying in control.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <article
                key={step.title}
                className="surface-card-soft group relative rounded-xl border border-slate-200 bg-slate-50/80 p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70 dark:border-white/10 dark:!bg-slate-900/80 dark:hover:!bg-slate-900 dark:hover:shadow-black/20"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-7 text-lg font-black text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.description}</p>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute -right-5 top-1/2 hidden text-slate-300 lg:block dark:text-white/20"
                    size={22}
                  />
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
