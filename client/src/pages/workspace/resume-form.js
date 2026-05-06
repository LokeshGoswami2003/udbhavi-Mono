export const emptyResumeData = {
  basics: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: '',
    links: [],
  },
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  awards: [],
  customSections: [],
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeLink(link) {
  if (!link) return null
  const url = (link.url || '').trim()
  if (!url) return null
  return {
    label: (link.label || '').trim(),
    url,
    type: link.type || 'other',
  }
}

function normalizeProject(project) {
  if (!project) return null
  const links = safeArray(project.links).map(normalizeLink).filter(Boolean)
  const fallbackUrl = (project.url || '').trim()
  if (fallbackUrl && !links.length) {
    links.push({ label: 'Link', url: fallbackUrl, type: 'other' })
  }
  return {
    name: (project.name || '').trim(),
    description: (project.description || '').trim(),
    url: fallbackUrl || links[0]?.url || '',
    links,
    bullets: safeArray(project.bullets).map((b) => String(b)),
    technologies: safeArray(project.technologies).map((t) => String(t)),
  }
}

export function normalizeResumeData(data = {}) {
  const basics = data.basics || {}
  return {
    ...emptyResumeData,
    ...data,
    basics: {
      ...emptyResumeData.basics,
      ...basics,
      links: safeArray(basics.links).map(normalizeLink).filter(Boolean),
    },
    skills: safeArray(data.skills),
    experience: safeArray(data.experience),
    education: safeArray(data.education),
    projects: safeArray(data.projects).map(normalizeProject).filter(Boolean),
    certifications: safeArray(data.certifications),
    awards: safeArray(data.awards),
    customSections: safeArray(data.customSections),
  }
}
