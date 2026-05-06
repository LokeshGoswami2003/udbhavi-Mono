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

  function updateProject(index, updater) {
    onChange({
      ...data,
      projects: data.projects.map((project, projectIndex) => (projectIndex === index ? updater(project) : project)),
    })
  }

  function updateProjectLink(projectIndex, linkIndex, field, value) {
    updateProject(projectIndex, (project) => ({
      ...project,
      links: (project.links || []).map((link, index) => (index === linkIndex ? { ...link, [field]: value } : link)),
    }))
  }

  function addProjectLink(projectIndex) {
    updateProject(projectIndex, (project) => ({
      ...project,
      links: [...(project.links || []), { label: 'Link', url: '', type: 'other' }],
    }))
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

      {data.projects?.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Projects and links</h3>
          <div className="mt-3 grid gap-3">
            {data.projects.map((project, projectIndex) => (
              <div key={`${project.name}-${projectIndex}`} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <input
                  value={project.name || ''}
                  onChange={(event) => updateProject(projectIndex, (item) => ({ ...item, name: event.target.value }))}
                  className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
                  placeholder="Project name"
                />
                <div className="mt-3 grid gap-2">
                  {(project.links || []).map((link, linkIndex) => (
                    <div key={`${link.url}-${linkIndex}`} className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                      <input
                        value={link.label || ''}
                        onChange={(event) => updateProjectLink(projectIndex, linkIndex, 'label', event.target.value)}
                        className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
                        placeholder="Label"
                      />
                      <input
                        value={link.url || ''}
                        onChange={(event) => updateProjectLink(projectIndex, linkIndex, 'url', event.target.value)}
                        className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
                        placeholder="https://..."
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => addProjectLink(projectIndex)} className="justify-self-start rounded-md border border-blue-200 px-2 py-1 text-xs font-black text-blue-700 dark:border-blue-300/20 dark:text-blue-100">
                    Add link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
