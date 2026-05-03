import { useAuth0 } from '@auth0/auth0-react'
import { FilePlus2, Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useAuthActions } from '../../auth/use-auth-actions'
import { fetchCurrentUser } from '../../api/api-client'

export function WorkspacePage() {
  const { isAuthenticated, isLoading } = useAuth0()
  const { getApiToken, login, logoutToHome } = useAuthActions()
  const [accountState, setAccountState] = useState({
    status: 'loading',
    user: null,
    error: '',
  })
  const [retryCount, setRetryCount] = useState(0)

  const retryAccountLoad = useCallback(() => {
    setAccountState({ status: 'loading', user: null, error: '' })
    setRetryCount((currentCount) => currentCount + 1)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let isActive = true

    fetchCurrentUser(getApiToken)
      .then((user) => {
        if (!isActive) {
          return
        }

        setAccountState({ status: 'ready', user, error: '' })
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        setAccountState({ status: 'error', user: null, error: error.message })
      })

    return () => {
      isActive = false
    }
  }, [getApiToken, isAuthenticated, retryCount])

  if (isLoading || (isAuthenticated && accountState.status === 'loading')) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <Loader2 className="animate-spin text-blue-600 dark:text-blue-300" size={30} aria-label="Loading workspace" />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <ShieldCheck className="mx-auto text-blue-600 dark:text-blue-300" size={30} aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black">Login required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Sign in to open your resume workspace.
          </p>
          <Button as="button" type="button" variant="accent" className="mt-5" onClick={() => login('/app')}>
            Log in
          </Button>
        </section>
      </main>
    )
  }

  if (accountState.status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <ShieldCheck className="mx-auto text-blue-600 dark:text-blue-300" size={30} aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black">Workspace unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {accountState.error || 'We could not load your workspace account. Please try again.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button as="button" type="button" variant="accent" onClick={retryAccountLoad}>
              Try again
            </Button>
            <Button as="button" type="button" variant="ghost" onClick={logoutToHome}>
              Log out
            </Button>
          </div>
        </section>
      </main>
    )
  }

  const account = accountState.user

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a href="/" className="text-lg font-black">Udbhavi</a>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{account?.name ?? 'Resume builder'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{account?.email}</p>
            </div>
            <Button as="button" type="button" variant="ghost" onClick={logoutToHome} aria-label="Log out">
              <LogOut aria-hidden="true" size={18} />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-5 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Workspace</p>
              <h1 className="mt-2 text-3xl font-black">Create your first resume</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Start with a resume project, then upload an existing resume or enter your details manually.
              </p>
            </div>
            <Button as="button" type="button" variant="accent">
              <FilePlus2 aria-hidden="true" size={18} />
              New resume
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
