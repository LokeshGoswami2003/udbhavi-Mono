import { FileCheck2 } from 'lucide-react'
import { navLinks } from '../../lib/landing-data'

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 px-5 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1fr] lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600">
              <FileCheck2 aria-hidden="true" size={20} />
            </span>
            <span className="text-lg font-black">Udbhavi</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
            AI-powered resume builder for structured editing, targeted optimization, and professional PDF output.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black">Product</h3>
          <div className="mt-4 grid gap-3">
            {navLinks.slice(0, 4).map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black">Company</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <a href="#top" className="transition hover:text-white">About</a>
            <a href="#top" className="transition hover:text-white">Privacy</a>
            <a href="#top" className="transition hover:text-white">Terms</a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black">Stay updated</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">Get product updates and resume-writing notes.</p>
          <form className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-black transition hover:bg-blue-500">
              Join
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-slate-400">
        © 2026 Udbhavi. All rights reserved.
      </div>
    </footer>
  )
}
