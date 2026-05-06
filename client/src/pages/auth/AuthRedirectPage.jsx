import { useAuth0 } from '@auth0/auth0-react'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useAuthActions } from '../../auth/use-auth-actions'
import { replaceWith } from '../../router/navigation'

const copy = {
  login: {
    title: 'Taking you to login',
    body: 'Use your Udbhavi account to continue.',
  },
  signup: {
    title: 'Creating your account',
    body: 'Start free and open your resume workspace.',
  },
}

export function AuthRedirectPage({ mode }) {
  const { isAuthenticated, isLoading } = useAuth0()
  const { login, signup } = useAuthActions()
  const pageCopy = copy[mode]

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (isAuthenticated) {
      replaceWith('/app')
      return
    }

    const redirect = mode === 'signup' ? signup : login
    redirect('/app')
  }, [isAuthenticated, isLoading, login, mode, signup])

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
        <Loader2 className="mx-auto animate-spin text-blue-600 dark:text-blue-300" size={28} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-black">{pageCopy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{pageCopy.body}</p>
      </section>
    </main>
  )
}
