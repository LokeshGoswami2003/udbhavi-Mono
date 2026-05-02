const variants = {
  primary:
    'bg-slate-950 !text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:!text-slate-950 dark:hover:bg-slate-100',
  accent:
    'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 !text-white shadow-[0_18px_42px_rgba(79,70,229,0.34)] hover:-translate-y-0.5',
  secondary:
    'border border-slate-200 bg-white/80 text-slate-900 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:!text-white dark:hover:bg-white/15',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
}

export function Button({
  as: Component = 'a',
  children,
  className = '',
  variant = 'primary',
  ...props
}) {
  return (
    <Component
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
