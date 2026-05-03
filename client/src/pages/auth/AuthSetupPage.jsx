import { AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function AuthSetupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
            <AlertCircle aria-hidden="true" size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-black">Auth setup needed</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Add the Auth0 client environment values, then restart the client to enable login.
            </p>
            <div className="mt-5">
              <Button href="/" variant="secondary">Back to home</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
