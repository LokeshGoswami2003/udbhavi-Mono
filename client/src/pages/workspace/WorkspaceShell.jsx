import { FileText, LogOut, MessageSquarePlus, Rocket, Trash2, UserRound } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function WorkspaceShell({ account, projects = [], activeProjectId, onProjectSelect, onNewProject, onDeleteProject, onShowResumes, onLogout, children }) {
  return (
    <div className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-900 md:flex md:w-72 md:flex-col md:border-b-0 md:border-r">
          <div className="flex items-center justify-between md:block">
            <a href="/" className="flex items-center gap-2 text-lg font-black">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
                <Rocket size={17} aria-hidden="true" />
              </span>
              Udbhavi
            </a>
            <Button as="button" type="button" variant="ghost" className="md:hidden" onClick={onLogout} aria-label="Log out">
              <LogOut size={18} aria-hidden="true" />
            </Button>
          </div>

          <Button as="button" type="button" variant="accent" className="mt-4 w-full" onClick={onNewProject}>
            <MessageSquarePlus size={18} aria-hidden="true" />
            New project
          </Button>

          <button
            type="button"
            onClick={onShowResumes}
            className="mt-3 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <FileText size={17} aria-hidden="true" />
            Resume context
          </button>

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
            <p className="px-3 text-xs font-black uppercase text-slate-400">Projects</p>
            <div className="mt-2 grid gap-1">
              {projects.map((project) => (
                <div key={project.id} className={`group flex items-center gap-2 rounded-lg ${activeProjectId === project.id ? 'bg-white shadow-sm dark:bg-white/10' : ''}`}>
                  <button
                    type="button"
                    onClick={() => onProjectSelect(project.id)}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm font-bold text-slate-700 hover:text-slate-950 dark:text-slate-200"
                  >
                    {project.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    className="mr-1 rounded-md p-2 text-slate-400 opacity-100 hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-red-500/10"
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {!projects.length ? <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">No projects yet.</p> : null}
            </div>
          </div>

          <div className="mt-8 hidden rounded-lg border border-slate-200 p-3 dark:border-white/10 md:block">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-slate-100 dark:bg-white/10">
                <UserRound size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{account?.name || 'Resume workspace'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{account?.email}</p>
              </div>
            </div>
            <Button as="button" type="button" variant="ghost" className="mt-3 w-full" onClick={onLogout}>
              <LogOut size={17} aria-hidden="true" />
              Log out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
