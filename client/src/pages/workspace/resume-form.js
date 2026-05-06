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
    summary: '',
  },
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  awards: [],
  customSections: [],
}

export function normalizeResumeData(data = {}) {
  return {
    ...emptyResumeData,
    ...data,
    basics: {
      ...emptyResumeData.basics,
      ...(data.basics || {}),
    },
  }
}
