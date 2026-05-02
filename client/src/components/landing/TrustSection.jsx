import { ShieldCheck } from 'lucide-react'
import { secureBullets, trustItems } from '../../lib/landing-data'
import { Button } from '../ui/Button'

export function TrustSection() {
  return (
    <section className="bg-slate-50 px-5 py-16 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[0.86fr_1.14fr] dark:border-white/10 dark:bg-slate-950 dark:shadow-black/20">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_30%_20%,#dbeafe,transparent_38%),linear-gradient(135deg,#eef2ff,#f0fdfa)] p-8 lg:border-b-0 lg:border-r dark:border-white/10 dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.26),transparent_38%),linear-gradient(135deg,#0f172a,#042f2e)]">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white text-blue-600 shadow-xl dark:bg-slate-900 dark:text-blue-300">
            <ShieldCheck aria-hidden="true" size={38} />
          </div>
          <h2 className="mt-8 text-3xl font-black text-slate-950 dark:text-white">Your data is private, structured, and secure</h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            The privacy story is simple enough to understand on the landing page and strong enough to support the product plan.
          </p>
        </div>

        <div className="p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="surface-card-soft rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:!bg-slate-900/75 dark:text-slate-200">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {secureBullets.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <Icon aria-hidden="true" className="text-emerald-500" size={18} />
                  {item.label}
                </div>
              )
            })}
          </div>
          <Button href="/signup" variant="accent" className="mt-8">
            Start with a private project
          </Button>
        </div>
      </div>
    </section>
  )
}
