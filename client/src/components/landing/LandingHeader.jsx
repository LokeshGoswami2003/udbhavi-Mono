import { FileCheck2, Menu } from 'lucide-react'
import { navLinks } from '../../lib/landing-data'
import { Button } from '../ui/Button'
import { ThemeToggle } from './ThemeToggle'

export function LandingHeader({ theme, onThemeToggle }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/78 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Udbhavi home">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
            <FileCheck2 aria-hidden="true" size={20} />
          </span>
          <span className="text-lg font-black text-slate-950 dark:text-white">Udbhavi</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex dark:text-slate-300 dark:hover:text-white"
          >
            Log in
          </a>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <div className="hidden sm:block">
            <Button href="/signup" variant="accent">Start free</Button>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white"
            aria-label="Open menu"
          >
            <Menu aria-hidden="true" size={19} />
          </button>
        </div>
      </div>
    </header>
  )
}
