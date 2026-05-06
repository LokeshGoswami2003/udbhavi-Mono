const templates = [
  {
    id: "classic-ats",
    name: "Template 1",
    tone: "Clean single-column, ATS-friendly, project-led",
    layout: ["Header", "Summary", "Technical Skills", "Projects", "Education", "Achievements & Certifications"],
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  {
    id: "modern-compact",
    name: "Template 2",
    tone: "Dense, one-page, experience-led",
    layout: ["Header", "Summary", "Technical Skills", "Experience", "Projects", "Education", "Achievements & Certifications"],
    fontFamily: "Arial, Helvetica, sans-serif",
  },
];

export function listTemplates() {
  return templates;
}

export function getTemplate(templateId) {
  return templates.find((template) => template.id === templateId) || templates[0];
}
