import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function WorkspaceLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Loader2 className="animate-spin text-blue-600 dark:text-blue-300" size={30} aria-label="Loading workspace" />
    </main>
  )
}

export function LoginRequired({ onLogin }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
        <ShieldCheck className="mx-auto text-blue-600 dark:text-blue-300" size={30} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-black">Login required</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Sign in to open your resume workspace.</p>
        <Button as="button" type="button" variant="accent" className="mt-5" onClick={onLogin}>
          Log in
        </Button>
      </section>
    </main>
  )
}

export function WorkspaceError({ error, onRetry, onLogout }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
        <ShieldCheck className="mx-auto text-blue-600 dark:text-blue-300" size={30} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-black">Workspace unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {error || 'We could not load your workspace account. Please try again.'}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button as="button" type="button" variant="accent" onClick={onRetry}>
            Try again
          </Button>
          <Button as="button" type="button" variant="ghost" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </section>
    </main>
  )
}
