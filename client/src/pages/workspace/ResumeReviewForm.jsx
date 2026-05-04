import { CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { normalizeResumeData } from './resume-form'

export function ResumeReviewForm({ resume, busy, onChange, onSave }) {
  const data = normalizeResumeData(resume?.resumeData)

  function updateBasics(field, value) {
    onChange({
      ...data,
      basics: {
        ...data.basics,
        [field]: value,
      },
    })
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">Review profile</p>
          <h2 className="mt-1 text-2xl font-black">We found your resume details</h2>
        </div>
        <Button as="button" type="button" variant="accent" onClick={() => onSave(data)} disabled={busy}>
          <CheckCircle2 size={18} aria-hidden="true" />
          Save profile
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[
          ['fullName', 'Full name'],
          ['headline', 'Headline'],
          ['email', 'Email'],
          ['phone', 'Phone'],
          ['location', 'Location'],
          ['linkedin', 'LinkedIn'],
          ['github', 'GitHub'],
          ['website', 'Website'],
        ].map(([field, label]) => (
          <label key={field} className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {label}
            <input
              value={data.basics[field] || ''}
              onChange={(event) => updateBasics(field, event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 block text-sm font-bold text-slate-700 dark:text-slate-200">
        Summary
        <textarea
          value={data.basics.summary || ''}
          onChange={(event) => updateBasics('summary', event.target.value)}
          rows={5}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
        />
      </label>
    </section>
  )
}
