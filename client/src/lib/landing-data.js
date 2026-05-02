import {
  Bot,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Palette,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from 'lucide-react'

export const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Templates', href: '#templates' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export const proofPoints = [
  { value: '4 steps', label: 'from old resume to polished PDF' },
  { value: '100%', label: 'structured resume data before rendering' },
  { value: '1 page', label: 'formatting target for focused applications' },
]

export const workflowSteps = [
  {
    title: 'Upload your resume',
    description:
      'Start with a PDF, DOCX, or manual details. The app extracts facts without treating your resume as instructions.',
    icon: UploadCloud,
  },
  {
    title: 'Choose a template',
    description:
      'Pick an ATS-friendly layout built for readability, recruiter scanning, and clean PDF output.',
    icon: Palette,
  },
  {
    title: 'Optimize with AI',
    description:
      'Rewrite bullets, match a job description, and get practical suggestions without inventing experience.',
    icon: WandSparkles,
  },
  {
    title: 'Preview and download',
    description:
      'Review a LaTeX-quality PDF, keep versions, and download the resume when it is ready to send.',
    icon: Download,
  },
]

export const features = [
  {
    title: 'AI resume rewrite',
    description:
      'Turn rough bullets into clear, impact-focused statements while preserving your real facts.',
    icon: Sparkles,
    accent: 'from-indigo-500 to-sky-500',
  },
  {
    title: 'Job description optimizer',
    description:
      'Paste a role and tune your resume toward its language, requirements, and missing keywords.',
    icon: MessageSquareText,
    accent: 'from-cyan-500 to-emerald-500',
  },
  {
    title: 'ATS-style match score',
    description:
      'See a practical score for keywords, clarity, structure, and completeness without fake guarantees.',
    icon: Gauge,
    accent: 'from-amber-500 to-rose-500',
  },
  {
    title: 'LaTeX-quality PDF output',
    description:
      'Structured resume data renders into consistent templates instead of fragile prompt-made formatting.',
    icon: FileCheck2,
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    title: 'Version-safe editing',
    description:
      'Every meaningful edit can become a resume version, so you can compare changes and recover context.',
    icon: Layers3,
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    title: 'Privacy-first controls',
    description:
      'Account-owned projects, protected access, deletion paths, and no raw user LaTeX in the MVP.',
    icon: ShieldCheck,
    accent: 'from-emerald-500 to-teal-500',
  },
]

export const templates = [
  {
    name: 'Classic ATS',
    tag: 'Best for parsing',
    description: 'A crisp one-column layout for recruiters and application systems.',
  },
  {
    name: 'Modern Compact',
    tag: 'Best for one page',
    description: 'Dense, polished spacing for candidates with more experience.',
  },
  {
    name: 'Executive Clean',
    tag: 'Best for senior roles',
    description: 'Stronger hierarchy for leadership scope and business impact.',
  },
]

export const trustItems = [
  'Your resume data stays inside your account',
  'Delete projects and resume data when needed',
  'AI edits structured JSON, not final LaTeX',
  'No credit card required to start',
]

export const testimonials = [
  {
    quote:
      'The best part was seeing the PDF change as the bullets improved. It felt controlled, not random.',
    name: 'Maya R.',
    role: 'Frontend Engineer',
  },
  {
    quote:
      'I could tailor one resume to three job descriptions without losing the original version.',
    name: 'Arjun P.',
    role: 'Backend Developer',
  },
  {
    quote:
      'The score helped me understand what was missing without pretending to guarantee interviews.',
    name: 'Leah M.',
    role: 'Product Analyst',
  },
]

export const faqs = [
  {
    question: 'Does the AI create fake experience?',
    answer:
      'No. The product is designed to preserve facts, ask for missing details, and improve presentation without inventing companies, metrics, or credentials.',
  },
  {
    question: 'Why use LaTeX rendering?',
    answer:
      'LaTeX gives consistent, professional PDF output. The app controls templates and escaping so formatting remains reliable.',
  },
  {
    question: 'Can I optimize for a specific job?',
    answer:
      'Yes. Paste a job description to compare keywords, rewrite bullets, and produce a targeted version of the resume.',
  },
  {
    question: 'Is it free to start?',
    answer:
      'The MVP is planned around a free tier with practical limits for projects, AI calls, uploads, previews, and downloads.',
  },
]

export const heroBadges = [
  { label: 'ATS-style score', icon: Gauge },
  { label: 'AI bullet rewrites', icon: Bot },
  { label: 'PDF preview', icon: FileText },
]

export const secureBullets = [
  { label: 'Private projects', icon: LockKeyhole },
  { label: 'Structured validation', icon: CheckCircle2 },
  { label: 'Safe PDF rendering', icon: FileCheck2 },
]
