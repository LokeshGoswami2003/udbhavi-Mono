import { faqs } from '../../lib/landing-data'
import { SectionLabel } from '../ui/SectionLabel'

export function FaqSection() {
  return (
    <section id="faq" className="bg-white px-5 py-20 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">Questions before the first upload</h2>
        </div>
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="surface-card-soft group rounded-xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-lg open:shadow-slate-200/60 dark:border-white/10 dark:!bg-slate-900/75 dark:open:!bg-slate-900 dark:open:shadow-black/20"
            >
              <summary className="cursor-pointer list-none text-base font-black text-slate-950 marker:hidden dark:text-white">
                {faq.question}
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
