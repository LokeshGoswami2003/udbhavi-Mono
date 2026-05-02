import { Quote } from 'lucide-react'
import { testimonials } from '../../lib/landing-data'
import { SectionLabel } from '../ui/SectionLabel'

export function TestimonialsSection() {
  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Proof</SectionLabel>
          <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">
            Built around the moments resume builders usually get wrong
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="surface-card-soft rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:!bg-slate-900/75">
              <Quote aria-hidden="true" className="text-blue-600 dark:text-blue-300" size={24} />
              <p className="mt-5 text-base leading-8 text-slate-700 dark:text-slate-200">"{testimonial.quote}"</p>
              <div className="mt-6">
                <p className="font-black text-slate-950 dark:text-white">{testimonial.name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
