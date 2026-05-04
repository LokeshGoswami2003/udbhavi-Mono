import { getTemplate } from "../templates/template.service.js";

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function latexEsc(value = "") {
  return String(value)
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("_", "\\_")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}");
}

function section(title, body) {
  if (!body) {
    return "";
  }

  return `<section><h2>${esc(title)}</h2>${body}</section>`;
}

function list(items = []) {
  const filtered = items.filter(Boolean);
  return filtered.length ? `<ul>${filtered.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function renderSkills(skills = []) {
  if (!skills.length) {
    return "";
  }

  return skills
    .map((skill) => `<p><strong>${esc(skill.category)}:</strong> ${esc((skill.items || []).join(", "))}</p>`)
    .join("");
}

function renderExperience(experience = []) {
  return experience
    .slice(0, 4)
    .map((item) => `
      <div class="entry">
        <div class="entry-head">
          <strong>${esc(item.role)}</strong>
          <span>${esc([item.startDate, item.endDate || (item.current ? "Present" : "")].filter(Boolean).join(" - "))}</span>
        </div>
        <div class="muted">${esc([item.company, item.location].filter(Boolean).join(" · "))}</div>
        ${list(item.bullets || [])}
      </div>
    `)
    .join("");
}

function renderProjects(projects = []) {
  return projects
    .slice(0, 3)
    .map((item) => `
      <div class="entry">
        <div class="entry-head"><strong>${esc(item.name)}</strong>${item.url ? `<span>${esc(item.url)}</span>` : ""}</div>
        ${item.description ? `<div class="muted">${esc(item.description)}</div>` : ""}
        ${list(item.bullets || [])}
      </div>
    `)
    .join("");
}

function renderEducation(education = []) {
  return education
    .slice(0, 3)
    .map((item) => `
      <div class="entry compact">
        <div class="entry-head">
          <strong>${esc(item.degree || item.institution)}</strong>
          <span>${esc(item.endDate || "")}</span>
        </div>
        <div class="muted">${esc([item.institution, item.field, item.location].filter(Boolean).join(" · "))}</div>
      </div>
    `)
    .join("");
}

function renderBody(data, template) {
  const basics = data.basics || {};
  const contact = [basics.email, basics.phone, basics.location, basics.linkedin, basics.github, basics.website].filter(Boolean);

  return `
    <article class="resume ${template.id}">
      <header>
        <h1>${esc(basics.fullName || "Your Name")}</h1>
        ${basics.headline ? `<p class="headline">${esc(basics.headline)}</p>` : ""}
        <p class="contact">${contact.map(esc).join(" · ")}</p>
      </header>
      ${section("Summary", basics.summary ? `<p>${esc(basics.summary)}</p>` : "")}
      ${section("Skills", renderSkills(data.skills))}
      ${section("Experience", renderExperience(data.experience))}
      ${section("Projects", renderProjects(data.projects))}
      ${section("Education", renderEducation(data.education))}
    </article>
  `;
}

export function renderResumeHtml({ resumeData, templateId }) {
  const template = getTemplate(templateId);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; background: #e5e7eb; color: #111827; }
  .resume {
    width: 100%;
    max-width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 0.58in;
    box-sizing: border-box;
    background: white;
    font-family: ${template.fontFamily};
    font-size: ${template.id === "modern-compact" ? "10px" : "10.5px"};
    line-height: 1.34;
  }
  h1 { margin: 0; text-align: center; font-size: 24px; letter-spacing: 0; }
  .headline, .contact { margin: 5px 0 0; text-align: center; }
  .contact, .muted { color: #374151; }
  h2 { margin: 13px 0 6px; border-bottom: 1px solid #111827; font-size: 13px; text-transform: uppercase; letter-spacing: 0; }
  p { margin: 0 0 5px; }
  ul { margin: 4px 0 0 16px; padding: 0; }
  li { margin: 2px 0; }
  .entry { margin: 0 0 7px; }
  .entry-head { display: flex; justify-content: space-between; gap: 16px; }
  .entry-head span { white-space: nowrap; }
  .modern-compact h2 { margin-top: 9px; color: #1d4ed8; border-bottom-color: #93c5fd; }
</style>
</head>
<body>${renderBody(resumeData || {}, template)}</body>
</html>`;
}

export function renderResumeLatex({ resumeData, templateId }) {
  const data = resumeData || {};
  const basics = data.basics || {};
  const skills = (data.skills || []).map((skill) => `\\item \\textbf{${latexEsc(skill.category)}:} ${latexEsc((skill.items || []).join(", "))}`).join("\n");
  const experience = (data.experience || []).slice(0, 4).map((item) => `
\\item \\textbf{${latexEsc(item.role)}} \\hfill ${latexEsc([item.startDate, item.endDate || (item.current ? "Present" : "")].filter(Boolean).join(" -- "))}
\\\\ ${latexEsc([item.company, item.location].filter(Boolean).join(", "))}
\\begin{itemize}
${(item.bullets || []).slice(0, 4).map((bullet) => `\\item ${latexEsc(bullet)}`).join("\n")}
\\end{itemize}`).join("\n");

  return `\\documentclass[letterpaper,10pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\pagestyle{empty}
\\begin{document}
\\begin{center}
{\\Large \\textbf{${latexEsc(basics.fullName || "Your Name")}}}\\\\
${latexEsc([basics.email, basics.phone, basics.location, basics.linkedin, basics.github].filter(Boolean).join(" \\textperiodcentered\\ "))}
\\end{center}
\\section*{Summary}
${latexEsc(basics.summary || "")}
\\section*{Skills}
\\begin{itemize}[leftmargin=*]
${skills}
\\end{itemize}
\\section*{Experience}
\\begin{itemize}[leftmargin=*]
${experience}
\\end{itemize}
\\end{document}`;
}
