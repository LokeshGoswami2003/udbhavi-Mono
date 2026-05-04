const templates = [
  {
    id: "classic-ats",
    name: "Classic ATS",
    tone: "Clean, single-column, recruiter-friendly",
    layout: ["Header", "Summary", "Skills", "Experience", "Projects", "Education"],
    fontFamily: "Times New Roman, serif",
    latexSample: String.raw`\documentclass[letterpaper,10pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{fontawesome}
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\textwidth}{1.0in}
\addtolength{\topmargin}{-0.75in}
\addtolength{\textheight}{1.5in}
\titleformat{\section}{\large\scshape\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{8pt}{8pt}
\begin{document}
\begin{center}
  \textbf{\Large FULL NAME}\\
  \small CONTACT LINKS IN ONE LINE
\end{center}
\section{Summary}
One concise summary paragraph.
\section{Technical Skills}
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
  \item \textbf{Category:} Skill, Skill, Skill
\end{itemize}
\section{Projects}
\item\textbf{Project Name} \hfill Links
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
  \item Impact bullet with factual metric.
\end{itemize}
\end{document}`,
  },
  {
    id: "modern-compact",
    name: "Modern Compact",
    tone: "Dense, polished, one-page focused",
    layout: ["Header", "Skills band", "Experience", "Projects", "Education"],
    fontFamily: "Arial, sans-serif",
    latexSample: String.raw`\documentclass[letterpaper,10pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{fontawesome}
\usepackage{lmodern}
\renewcommand{\familydefault}{\sfdefault}
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\textwidth}{1.0in}
\addtolength{\topmargin}{-0.75in}
\addtolength{\textheight}{1.5in}
\titleformat{\section}{\large\scshape\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{5pt}{4pt}
\begin{document}
\begin{center}
  \textbf{\Large FULL NAME}\\
  \small CONTACT LINKS IN ONE LINE
\end{center}
\section{Summary}
Dense role-focused summary with strongest facts.
\section{Technical Skills}
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
  \item \textbf{Backend:} Skill, Skill, Skill
\end{itemize}
\section{Experience}
\item\textbf{Role} \hfill Company \hfill Dates
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
  \item Tight bullet with clear scope and outcome.
\end{itemize}
\end{document}`,
  },
];

export function listTemplates() {
  return templates;
}

export function getTemplate(templateId) {
  return templates.find((template) => template.id === templateId) || templates[0];
}
