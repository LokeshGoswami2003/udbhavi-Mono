export function emptyResumeData() {
  return {
    basics: { fullName: "" },
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    awards: [],
    customSections: [],
  };
}

export function normalizeResumeData(input = {}) {
  const data = { ...emptyResumeData(), ...input };
  data.basics = { ...emptyResumeData().basics, ...(input.basics || {}) };

  for (const key of ["skills", "experience", "education", "projects", "certifications", "awards", "customSections"]) {
    data[key] = Array.isArray(data[key]) ? data[key] : [];
  }

  return data;
}
