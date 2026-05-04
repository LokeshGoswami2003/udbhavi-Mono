import { X } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function ProjectDialog({ busy, onClose, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      title: form.get('title'),
    })
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/55 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-300">New project</p>
            <h2 className="text-2xl font-black">Name your project</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close project form">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-bold">
            Project name
            <input name="title" required placeholder="Senior Frontend Developer Resume" className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950" />
          </label>
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
            The project will use your primary resume context. You will choose the template next.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button as="button" type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button as="button" type="submit" variant="accent" disabled={busy}>Create project</Button>
        </div>
      </form>
    </div>
  )
}
