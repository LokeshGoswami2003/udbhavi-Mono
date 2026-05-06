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

function latexUrl(value = "") {
  return String(value).replaceAll("\\", "").replaceAll("{", "").replaceAll("}", "");
}

function latexHref(url, label) {
  if (!url) {
    return latexEsc(label || "");
  }

  return `\\href{${latexUrl(url)}}{${latexEsc(label || url)}}`;
}

function latexRawHref(url, rawLabel) {
  if (!url) {
    return rawLabel || "";
  }

  return `\\href{${latexUrl(url)}}{${rawLabel || latexEsc(url)}}`;
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

function renderSkillsHtml(skills = []) {
  if (!skills.length) {
    return "";
  }

  return skills
    .map((skill) => `<li><strong>${esc(skill.category)}:</strong> ${esc((skill.items || []).join(", "))}</li>`)
    .join("");
}

function renderExperienceHtml(experience = []) {
  return experience
    .slice(0, 4)
    .map((item) => `
      <div class="entry">
        <div class="item-title">
          <strong>${esc(item.role)}</strong>
          <span>${esc([item.company, item.location].filter(Boolean).join(", "))}</span>
          <span>${esc([item.startDate, item.endDate || (item.current ? "Present" : "")].filter(Boolean).join(" - "))}</span>
        </div>
        ${list(item.bullets || [])}
      </div>
    `)
    .join("");
}

function projectLinksHtml(item) {
  const links = (item.links && item.links.length ? item.links : item.url ? [{ url: item.url, label: "Link" }] : []);
  if (!links.length) return "";
  return `<span>${links.map((l) => esc(l.label || "Link")).join(" | ")}</span>`;
}

function renderProjectsHtml(projects = []) {
  return projects
    .slice(0, 3)
    .map((item) => `
      <div class="entry">
        <div class="item-title"><strong>${esc(item.name)}</strong>${projectLinksHtml(item)}</div>
        ${item.description ? `<div class="muted">${esc(item.description)}</div>` : ""}
        ${list(item.bullets || [])}
      </div>
    `)
    .join("");
}

function renderCertificationsHtml(data = {}) {
  const items = [...(data.certifications || []), ...(data.awards || [])];

  return items
    .slice(0, 4)
    .map((item) => {
      const title = item.name || item.title || item.label || "";
      const issuer = item.issuer || item.organization || "";
      const url = item.url || item.link || "";

      return `
        <div class="entry compact">
          <div class="item-title">
            <strong>${esc(title)}</strong>
            ${url ? `<span>Certificate</span>` : ""}
          </div>
          ${issuer ? `<div class="muted">${esc(issuer)}</div>` : ""}
        </div>
      `;
    })
    .join("");
}

function renderEducationHtml(education = []) {
  return education
    .slice(0, 3)
    .map((item) => `
      <div class="entry compact">
        <div class="item-title">
          <strong>${esc(item.degree || item.institution)}</strong>
          <span>${esc([item.institution, item.location].filter(Boolean).join(", "))}</span>
          <span>${esc(item.endDate || "")}</span>
        </div>
      </div>
    `)
    .join("");
}

function renderBody(data, template) {
  const basics = data.basics || {};
  const contact = [basics.email, basics.phone, basics.location, basics.linkedin, basics.github, basics.portfolio, basics.website].filter(Boolean);
  const includeExperience = template.id === "modern-compact";

  return `
    <article class="resume ${template.id}">
      <header>
        <h1>${esc(basics.fullName || "Your Name")}</h1>
        <p class="contact">${contact.map(esc).join(" · ")}</p>
      </header>
      ${section("Summary", basics.summary ? `<p class="summary-line">${esc(basics.summary)}</p>` : "")}
      ${section("Technical Skills", renderSkillsHtml(data.skills) ? `<ul>${renderSkillsHtml(data.skills)}</ul>` : "")}
      ${includeExperience ? section("Experience", renderExperienceHtml(data.experience)) : ""}
      ${section("Projects", renderProjectsHtml(data.projects))}
      ${section("Education", renderEducationHtml(data.education))}
      ${section("Achievements & Certifications", renderCertificationsHtml(data))}
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
    width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 0.58in;
    box-sizing: border-box;
    background: white;
    font-family: ${template.fontFamily};
    font-size: ${template.id === "modern-compact" ? "10px" : "10.4px"};
    line-height: ${template.id === "modern-compact" ? "1.28" : "1.32"};
  }
  h1 { margin: 0; text-align: center; font-size: 24px; letter-spacing: 0; }
  .contact { margin: 5px 0 0; text-align: center; }
  .contact, .muted { color: #374151; }
  h2 { margin: 8px 0 8px; border-bottom: 1px solid #111827; font-size: 13px; text-transform: uppercase; letter-spacing: 0; }
  p { margin: 0 0 5px; }
  .summary-line::before { content: "• "; }
  ul { margin: 3px 0 0 16px; padding: 0; }
  li { margin: ${template.id === "modern-compact" ? "0" : "2px"} 0; }
  .entry { margin: 0 0 ${template.id === "modern-compact" ? "4px" : "7px"}; }
  .compact { margin-bottom: 3px; }
  .item-title { display: flex; justify-content: space-between; gap: 16px; font-weight: 700; }
  .item-title span { white-space: nowrap; font-weight: 400; }
  .modern-compact h2 { margin: 5px 0 4px; border-bottom-color: #111827; color: #111827; }
</style>
</head>
<body>${renderBody(resumeData || {}, template)}</body>
</html>`;
}

const defaultRenderOptions = {
  fontSize: 10,
  topMarginAdjust: -0.75,
  sideMarginAdjust: -0.5,
  textWidthAdjust: 1.0,
  textHeightAdjust: 1.5,
  itemSpacing: "itemsep=1pt",
  titleSpace: "4pt",
  sectionSpacing: "8pt}{8pt",
  bulletSpacing: "2pt",
  experienceLimit: 5,
  projectsLimit: 3,
  bulletsPerExperience: 5,
  bulletsPerProject: 5,
};

const compactRenderOptions = {
  fontSize: 10,
  topMarginAdjust: -0.85,
  sideMarginAdjust: -0.6,
  textWidthAdjust: 1.2,
  textHeightAdjust: 1.7,
  itemSpacing: "itemsep=0pt,topsep=1pt",
  titleSpace: "2pt",
  sectionSpacing: "5pt}{4pt",
  bulletSpacing: "0pt",
  experienceLimit: 4,
  projectsLimit: 3,
  bulletsPerExperience: 4,
  bulletsPerProject: 3,
};

const COMPACTION_LEVELS = [
  // level 0 = normal compact density
  {
    fontSize: 10,
    topMarginAdjust: -0.85,
    sideMarginAdjust: -0.6,
    textWidthAdjust: 1.2,
    textHeightAdjust: 1.7,
    itemSpacing: "itemsep=0pt,topsep=1pt",
    titleSpace: "2pt",
    sectionSpacing: "5pt}{4pt",
    bulletsPerExperience: 4,
    bulletsPerProject: 3,
  },
  // level 1 = tighter spacing
  {
    fontSize: 10,
    topMarginAdjust: -0.95,
    sideMarginAdjust: -0.7,
    textWidthAdjust: 1.4,
    textHeightAdjust: 1.9,
    itemSpacing: "itemsep=-1pt,topsep=0pt",
    titleSpace: "1pt",
    sectionSpacing: "3pt}{2pt",
    bulletsPerExperience: 4,
    bulletsPerProject: 3,
  },
  // level 2 = smaller font
  {
    fontSize: 9.5,
    topMarginAdjust: -1.05,
    sideMarginAdjust: -0.7,
    textWidthAdjust: 1.4,
    textHeightAdjust: 2.1,
    itemSpacing: "itemsep=-2pt,topsep=0pt",
    titleSpace: "0pt",
    sectionSpacing: "2pt}{1pt",
    bulletsPerExperience: 4,
    bulletsPerProject: 3,
  },
  // level 3 = smallest
  {
    fontSize: 9,
    topMarginAdjust: -1.1,
    sideMarginAdjust: -0.75,
    textWidthAdjust: 1.5,
    textHeightAdjust: 2.2,
    itemSpacing: "itemsep=-3pt,topsep=0pt",
    titleSpace: "0pt",
    sectionSpacing: "2pt}{1pt",
    bulletsPerExperience: 3,
    bulletsPerProject: 3,
  },
];

function getCompactionLevel(level = 0) {
  return COMPACTION_LEVELS[Math.max(0, Math.min(level, COMPACTION_LEVELS.length - 1))];
}

function pickProjectLinks(item) {
  const list = Array.isArray(item.links) && item.links.length
    ? item.links
    : item.url
      ? [{ url: item.url, label: "Link", type: "other" }]
      : [];
  return list.filter((link) => link?.url);
}

function renderProjectLinksLatex(item) {
  const links = pickProjectLinks(item);
  if (!links.length) return "";
  const parts = links.map((link) => latexHref(link.url, link.label || "Link"));
  return ` \\hfill ${parts.join(" \\textbar{} ")}`;
}

function buildLatexBody(data, template, options) {
  const basics = data.basics || {};
  const compact = template.id === "modern-compact";
  const itemSpacing = options.itemSpacing;
  const sectionSpacing = options.sectionSpacing;
  const titleSpace = options.titleSpace;
  const bulletsPerExperience = options.bulletsPerExperience ?? 5;
  const bulletsPerProject = options.bulletsPerProject ?? 5;
  const location = basics.location || "";

  const contactParts = [
    basics.email ? latexRawHref(`mailto:${basics.email}`, `\\faEnvelope\\ ${latexEsc(basics.email)}`) : "",
    basics.phone ? `\\faPhone\\ ${latexEsc(basics.phone)}` : "",
    location ? latexEsc(location) : "",
    basics.linkedin ? latexRawHref(basics.linkedin, "\\faLinkedin\\ LinkedIn") : "",
    basics.github ? latexRawHref(basics.github, "\\faGithub\\ GitHub") : "",
    basics.portfolio ? latexRawHref(basics.portfolio, "\\faLink\\ Portfolio") : "",
    basics.website ? latexRawHref(basics.website, "\\faLink\\ Website") : "",
    ...((basics.links || []).map((link) => latexRawHref(link.url, `\\faLink\\ ${latexEsc(link.label || "Link")}`))),
  ].filter(Boolean).join(" \\textperiodcentered\\ ");

  const skills = (data.skills || [])
    .filter((skill) => skill.category || skill.items?.length)
    .map((skill) => `    \\item \\textbf{${latexEsc(skill.category)}:} ${latexEsc((skill.items || []).join(", "))}`)
    .join("\n");

  const experience = (data.experience || [])
    .filter((item) => item.role || item.company || item.bullets?.length)
    .slice(0, 4)
    .map((item) => {
      const dates = [item.startDate, item.endDate || (item.current ? "Present" : "")].filter(Boolean).join(" -- ");
      const heading = [item.role, item.company].filter(Boolean).join(" -- ");

      return `\\item\\resumetitle{${latexEsc(heading || "Experience")}}${item.location ? ` \\hfill ${latexEsc(item.location)}` : ""}${dates ? ` \\hfill ${latexEsc(dates)}` : ""}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${(item.bullets || []).slice(0, bulletsPerExperience).map((bullet) => `    \\item ${latexEsc(bullet)}`).join("\n")}
\\end{itemize}`;
    })
    .join("\n\n");

  const projects = (data.projects || [])
    .filter((item) => item.name || item.description || item.bullets?.length)
    .slice(0, 3)
    .map((item) => `
\\item\\resumetitle{${latexEsc(item.name || "Project")}}${renderProjectLinksLatex(item)}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${[item.description, ...(item.bullets || [])].filter(Boolean).slice(0, bulletsPerProject).map((bullet) => `    \\item ${latexEsc(bullet)}`).join("\n")}
\\end{itemize}`)
    .join("\n");

  const education = (data.education || [])
    .filter((item) => item.degree || item.institution)
    .slice(0, 3)
    .map((item) => `    \\item \\textbf{${latexEsc(item.degree || item.institution)}}${item.institution && item.degree ? `, ${latexEsc(item.institution)}` : ""}${item.location ? `, ${latexEsc(item.location)}` : ""}${item.endDate ? ` \\hfill ${latexEsc(item.endDate)}` : ""}`)
    .join("\n");

  const certifications = [...(data.certifications || []), ...(data.awards || [])]
    .filter((item) => item.name || item.title || item.label)
    .slice(0, 4)
    .map((item) => `\\item ${latexEsc(item.name || item.title || item.label || "")}${item.url || item.link ? ` \\hfill ${latexHref(item.url || item.link, "Certificate")}` : ""}`)
    .join("\n");

  const summarySection = basics.summary ? `\\section*{Summary}
${latexEsc(basics.summary)}` : "";
  const skillsSection = skills ? `\\section*{Technical Skills}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${skills}
\\end{itemize}` : "";
  const experienceSection = compact && experience ? `\\section*{Experience}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${experience}
\\end{itemize}` : "";
  const projectsSection = projects ? `\\section*{Projects}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${projects}
\\end{itemize}` : "";
  const educationSection = education ? `\\section*{Education}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${education}
\\end{itemize}` : "";
  const certificationsSection = certifications ? `\\section*{Achievements \\& Certifications}
\\begin{itemize}[leftmargin=*,${itemSpacing},parsep=0pt,partopsep=0pt]
${certifications}
\\end{itemize}` : "";

  const fontSize = options.fontSize === 9 ? 9 : options.fontSize === 9.5 ? 10 : 10;
  // \documentclass only supports 10/11/12pt; use \fontsize within document for finer control if needed.

  const sideMargin = options.sideMarginAdjust ?? -0.5;
  const textWidth = options.textWidthAdjust ?? 1.0;
  const topMargin = options.topMarginAdjust ?? -0.75;
  const textHeight = options.textHeightAdjust ?? 1.5;
  const fontDirective = options.fontSize && options.fontSize < 10
    ? `\\fontsize{${options.fontSize}}{${(options.fontSize * 1.15).toFixed(1)}}\\selectfont\n`
    : "";

  return `\\documentclass[letterpaper,${fontSize}pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,urlcolor=blue}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{fontawesome}
\\usepackage{lmodern}
\\renewcommand{\\familydefault}{\\sfdefault}
\\addtolength{\\oddsidemargin}{${sideMargin}in}
\\addtolength{\\evensidemargin}{${sideMargin}in}
\\addtolength{\\textwidth}{${textWidth}in}
\\addtolength{\\topmargin}{${topMargin}in}
\\addtolength{\\textheight}{${textHeight}in}
\\pagestyle{empty}
\\titleformat{\\section}{\\large\\scshape\\raggedright}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{${sectionSpacing}}
\\newcommand{\\resumetitle}[1]{%
    \\vspace{${titleSpace}}
    \\textbf{#1}
}
\\begin{document}
${fontDirective}\\begin{center}
    \\textbf{\\Large ${latexEsc(basics.fullName || "Your Name")}}
    \\vspace{3pt}

    \\small ${contactParts}
\\end{center}
${[summarySection, skillsSection, experienceSection, projectsSection, educationSection, certificationsSection].filter(Boolean).join("\n")}
\\end{document}`;
}

function stripLatexPreamble(latexSource = "") {
  return String(latexSource)
    .replace(/^[\s\S]*?\\begin\{document\}/, "")
    .replace(/\\end\{document\}[\s\S]*$/, "")
    .trim();
}

function latexInlineToHtml(value = "") {
  return esc(value)
    .replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_match, url, label) => `<a href="${esc(url)}">${latexInlineToHtml(label)}</a>`)
    .replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>")
    .replace(/\\Large\s*/g, "")
    .replace(/\\small\s*/g, "")
    .replace(/\\faEnvelope\\?/g, "")
    .replace(/\\faPhone\\?/g, "")
    .replace(/\\faLinkedin\\?/g, "")
    .replace(/\\faGithub\\?/g, "")
    .replace(/\\faLink\\?/g, "")
    .replace(/\\textperiodcentered\\?/g, "·")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\\$/g, "$")
    .replace(/\\hspace\{[^}]*\}/g, "")
    .replace(/\\vspace\{[^}]*\}/g, "")
    .replace(/\\resumetitle\{([^}]*)\}/g, "<strong>$1</strong>")
    .replace(/\\hfill/g, '<span class="fill"></span>')
    .replace(/\\\\/g, "<br />")
    .replace(/[{}]/g, "")
    .trim();
}

function latexBodyToHtml(latexSource = "") {
  const body = stripLatexPreamble(latexSource)
    .replace(/%.*$/gm, "")
    .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_match, content) => `<header>${latexInlineToHtml(content)}</header>`)
    .replace(/\\section\{([^}]*)\}/g, (_match, title) => `\n<section><h2>${esc(title)}</h2>\n`)
    .replace(/\\begin\{itemize\}(?:\[[^\]]*\])?/g, "<ul>")
    .replace(/\\end\{itemize\}/g, "</ul>")
    .replace(/\\item\s*/g, "<li>")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("<li>")) {
        return `<li>${latexInlineToHtml(line.slice(4))}</li>`;
      }

      if (line.startsWith("<header>") || line.startsWith("<section>") || line.startsWith("<h2>") || line.startsWith("<ul>") || line.startsWith("</ul>")) {
        return line;
      }

      return `<p>${latexInlineToHtml(line)}</p>`;
    })
    .join("\n");

  return body;
}

export function renderLatexPreviewHtml({ latexSource, templateId }) {
  const template = getTemplate(templateId);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    width: 8.5in;
    min-height: 11in;
    margin: 0;
    background: #fff;
    color: #111827;
    overflow: hidden;
  }
  .resume {
    width: 8.5in;
    height: 11in;
    margin: 0;
    padding: 0.58in;
    box-sizing: border-box;
    background: white;
    font-family: ${template.fontFamily};
    font-size: ${template.id === "modern-compact" ? "10px" : "10.4px"};
    line-height: ${template.id === "modern-compact" ? "1.28" : "1.32"};
    overflow: hidden;
    overflow-wrap: break-word;
  }
  header { text-align: center; font-size: 11px; }
  header strong:first-child { display: block; font-size: 24px; margin-bottom: 3px; }
  h2 { margin: ${template.id === "modern-compact" ? "5px 0 4px" : "8px 0 8px"}; border-bottom: 1px solid #111827; font-size: 13px; text-transform: uppercase; letter-spacing: 0; }
  p { margin: 0 0 5px; }
  ul { margin: 3px 0 0 16px; padding: 0; }
  li { margin: ${template.id === "modern-compact" ? "0" : "2px"} 0; }
  a { color: #1d4ed8; text-decoration: none; }
  .fill { display: inline-block; min-width: 1.2rem; }
  @media print {
    html, body { width: 8.5in; height: 11in; overflow: hidden; }
    .resume { box-shadow: none; }
  }
</style>
</head>
<body><article class="resume">${latexBodyToHtml(latexSource)}</article></body>
</html>`;
}

export function renderResumeLatex({ resumeData, templateId, renderOptions }) {
  const template = getTemplate(templateId);
  const compact = template.id === "modern-compact";
  const baseOptions = compact ? compactRenderOptions : defaultRenderOptions;
  const merged = { ...baseOptions, ...(renderOptions || {}) };
  return buildLatexBody(resumeData || {}, template, merged);
}

export function renderResumeLatexAtCompactionLevel({ resumeData, templateId, level = 0 }) {
  const template = getTemplate(templateId);
  const compact = template.id === "modern-compact";
  const baseOptions = compact ? compactRenderOptions : defaultRenderOptions;
  const levelOptions = compact ? getCompactionLevel(level) : { ...defaultRenderOptions };
  return buildLatexBody(resumeData || {}, template, { ...baseOptions, ...levelOptions });
}

export const RENDER_COMPACTION_LEVELS = COMPACTION_LEVELS.length;
