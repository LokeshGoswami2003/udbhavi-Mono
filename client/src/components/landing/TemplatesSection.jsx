import { ArrowRight, Star } from 'lucide-react'
import { templates } from '../../lib/landing-data'
import { Button } from '../ui/Button'
import { SectionLabel } from '../ui/SectionLabel'

function TemplatePreview({ name }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-inner dark:border-white/10 dark:bg-slate-100">
      <div className="mb-3 h-2 w-24 rounded-full bg-slate-900" />
      <div className="mb-5 h-1.5 w-36 rounded-full bg-slate-300" />
      <div className="space-y-2">
        {Array.from({ length: name === 'Modern Compact' ? 8 : 6 }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full bg-slate-200 ${index % 4 === 0 ? 'w-full' : index % 4 === 1 ? 'w-11/12' : index % 4 === 2 ? 'w-9/12' : 'w-7/12'}`}
          />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="h-1.5 rounded-full bg-blue-200" />
        <div className="h-1.5 rounded-full bg-emerald-200" />
      </div>
    </div>
  )
}

export function TemplatesSection() {
  return (
    <section id="templates" className="border-y border-slate-200 bg-white px-5 py-20 sm:px-6 lg:px-8 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Templates</SectionLabel>
          <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">
            Choose templates made for real applications
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Start with layouts designed for recruiter scanning, compact one-page resumes, and professional PDF output.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {templates.map((template) => (
            <article
              key={template.name}
              className="surface-card-soft rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70 dark:border-white/10 dark:!bg-slate-950/70 dark:hover:!bg-slate-900 dark:hover:shadow-black/20"
            >
              <TemplatePreview name={template.name} />
              <div className="mt-5">
                <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-200">{template.tag}</span>
                <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{template.name}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{template.description}</p>
              </div>
            </article>
          ))}

          <article className="flex flex-col justify-between rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-400/20 dark:bg-blue-400/10">
            <div>
              <Star aria-hidden="true" className="text-blue-600 dark:text-blue-200" size={30} />
              <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">More templates coming soon</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                The template system is ready to grow after the MVP proves the core workflow.
              </p>
            </div>
            <Button href="/signup" variant="secondary" className="mt-8 w-full">
              View all templates
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
          </article>
        </div>
      </div>
    </section>
  )
}
