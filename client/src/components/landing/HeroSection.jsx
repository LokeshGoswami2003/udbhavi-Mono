import { ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react'
import { heroBadges, proofPoints } from '../../lib/landing-data'
import { Button } from '../ui/Button'
import { SectionLabel } from '../ui/SectionLabel'
import { ResumeMockup } from './ResumeMockup'

export function HeroSection() {
  return (
    <section id="top" className="relative isolate overflow-hidden px-5 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f1f5ff_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-700/20" />
      <div className="absolute right-0 top-24 -z-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="max-w-3xl">
          <SectionLabel>AI-powered resume builder</SectionLabel>
          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.03] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
            Build a job-ready resume in minutes, not hours.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
            Upload your resume, tailor it to any job description, and generate a clean ATS-friendly PDF with AI-powered suggestions and controlled formatting.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/signup" variant="accent">
              Start building free
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
            <Button href="#templates" variant="secondary">
              <PlayCircle aria-hidden="true" size={18} />
              View sample resume
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {heroBadges.map((item) => {
              const Icon = item.icon
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:!bg-slate-900/80 dark:text-slate-300"
                >
                  <Icon aria-hidden="true" size={15} />
                  {item.label}
                </span>
              )
            })}
          </div>
        </div>

        <ResumeMockup />
      </div>

      <div className="mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-3">
        {proofPoints.map((point) => (
          <div
            key={point.label}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:!bg-slate-900/80"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-500" size={18} />
            <div>
              <p className="font-black text-slate-950 dark:text-white">{point.value}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{point.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
