const templates = [
  {
    id: "classic-ats",
    name: "Classic ATS",
    tone: "Clean, single-column, recruiter-friendly",
    layout: ["Header", "Summary", "Skills", "Experience", "Projects", "Education"],
  },
  {
    id: "modern-compact",
    name: "Modern Compact",
    tone: "Dense, polished, one-page focused",
    layout: ["Header", "Skills band", "Experience", "Projects", "Education"],
  },
  {
    id: "executive-clean",
    name: "Executive Clean",
    tone: "Senior, spacious, outcome-led",
    layout: ["Header", "Profile", "Leadership Impact", "Experience", "Education"],
  },
];

export function listTemplates() {
  return templates;
}

export function getTemplate(templateId) {
  return templates.find((template) => template.id === templateId) || templates[0];
}
