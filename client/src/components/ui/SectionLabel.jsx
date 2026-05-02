export function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
      {children}
    </span>
  )
}
