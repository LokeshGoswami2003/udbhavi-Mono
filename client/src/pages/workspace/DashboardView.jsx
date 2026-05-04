import { FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function DashboardView({ view, resumes, projects, onCreateProject, onDeleteProject, onPrimaryResume, onDeleteResume }) {
  const primaryResume = resumes.find((resume) => resume.isPrimary)
  const showResumes = view === 'dashboard' || view === 'resumes'
  const showProjects = view === 'dashboard' || view === 'projects'

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-300">Workspace</p>
            <h1 className="mt-1 text-3xl font-black">Resume context is ready</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {primaryResume ? `Using ${primaryResume.label} as your primary resume.` : 'Add a resume to start creating projects.'}
            </p>
          </div>
          <Button as="button" type="button" variant="accent" onClick={onCreateProject} disabled={!resumes.length}>
            <Plus size={18} aria-hidden="true" />
            New project
          </Button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {showResumes ? <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-xl font-black">Uploaded resumes</h2>
          <div className="mt-4 grid gap-3">
            {resumes.map((resume) => (
              <article key={resume.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText size={17} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
                      <h3 className="truncate text-sm font-black">{resume.label}</h3>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {resume.sourceType === 'upload' ? resume.file?.originalName : 'Manual entry'} · {resume.extraction?.links?.length || 0} links found
                    </p>
                  </div>
                  {resume.isPrimary ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Primary</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!resume.isPrimary ? (
                    <Button as="button" type="button" variant="secondary" className="min-h-9 px-3 py-2 text-xs" onClick={() => onPrimaryResume(resume.id)}>
                      Make primary
                    </Button>
                  ) : null}
                  <Button as="button" type="button" variant="ghost" className="min-h-9 px-3 py-2 text-xs" onClick={() => onDeleteResume(resume.id)}>
                    <Trash2 size={15} aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section> : null}

        {showProjects ? <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-xl font-black">Projects</h2>
          <div className="mt-4 grid gap-3">
            {projects.length ? (
              projects.map((project) => (
                <article key={project.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black">{project.title}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{project.target?.role || 'No target role'} · {project.templateId}</p>
                    </div>
                    <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-white/10" onClick={() => onDeleteProject(project.id)} aria-label={`Delete ${project.title}`}>
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-white/10">
                <p className="text-sm font-bold">No projects yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create one from your saved resume.</p>
              </div>
            )}
          </div>
        </section> : null}
      </div>
    </div>
  )
}
