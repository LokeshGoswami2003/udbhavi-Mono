import { features } from '../../lib/landing-data'
import { SectionLabel } from '../ui/SectionLabel'

export function FeatureSection() {
  return (
    <section id="features" className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">
              Everything needed to create a stronger resume
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
            The landing page should sell a reliable workflow: upload, structure, optimize, render, version, and download.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="surface-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 dark:border-white/10 dark:!bg-slate-950/70 dark:hover:shadow-black/20"
              >
                <span className={`inline-grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${feature.accent} text-white shadow-lg`}>
                  <Icon aria-hidden="true" size={21} />
                </span>
                <h3 className="mt-6 text-lg font-black text-slate-950 dark:text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
