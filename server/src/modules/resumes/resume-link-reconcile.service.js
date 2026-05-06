import { normalizeUrl } from "../../utils/links.js";
import { normalizeResumeData } from "./resume-data.js";

const technologyHosts = new Set([
  "socket.io",
  "react.dev",
  "nodejs.org",
  "expressjs.com",
  "mongodb.com",
  "mysql.com",
  "postgresql.org",
  "typescriptlang.org",
  "tailwindcss.com",
  "vitejs.dev",
  "nextjs.org",
  "nestjs.com",
  "npmjs.com",
]);

function text(value) {
  return String(value || "").toLowerCase();
}

function words(value) {
  return text(value).replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length >= 3);
}

function host(link = {}) {
  try {
    return new URL(link.normalizedUrl || normalizeUrl(link.url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function hostOfUrl(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathText(link = {}) {
  try {
    return new URL(link.normalizedUrl || normalizeUrl(link.url)).pathname.replace(/[^a-z0-9]+/gi, " ").toLowerCase();
  } catch {
    return "";
  }
}

function profileGithub(link) {
  if (!host(link).includes("github.com")) {
    return false;
  }

  try {
    return new URL(link.normalizedUrl).pathname.split("/").filter(Boolean).length === 1;
  } catch {
    return false;
  }
}

function bestLink(sourceLinks, predicate) {
  return [...sourceLinks]
    .filter((link) => link?.normalizedUrl && predicate(link))
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))[0];
}

function setIfEmpty(target, key, link) {
  if (!target[key] && link?.normalizedUrl) {
    target[key] = link.normalizedUrl;
  }
}

function setEmailIfEmpty(target, link) {
  if (!target.email && link?.normalizedUrl?.startsWith("mailto:")) {
    target.email = link.normalizedUrl.replace(/^mailto:/, "");
  }
}

function clearUnsupportedBasicsLinks(basics) {
  for (const key of ["website", "portfolio", "linkedin", "github"]) {
    const normalized = normalizeUrl(basics[key]);

    if (!normalized) {
      basics[key] = "";
      continue;
    }

    const hostname = hostOfUrl(normalized);
    if (technologyHosts.has(hostname)) {
      basics[key] = "";
    } else if (key === "linkedin" && !hostname.includes("linkedin.com")) {
      basics[key] = "";
    } else if (key === "github" && !hostname.includes("github.com")) {
      basics[key] = "";
    } else {
      basics[key] = normalized;
    }
  }
}

function projectLinkType(url, link = {}) {
  const hostname = host(link) || hostOfUrl(url);
  const haystack = `${link.label || ""} ${link.context || ""} ${url}`.toLowerCase();
  if (/youtube\.com|youtu\.be/.test(hostname) || /youtube|video|demo video/.test(haystack)) {
    return "video";
  }
  if (hostname.includes("github.com")) {
    return "repo";
  }
  if (/snapshot|screenshot|gallery|images?\b/.test(haystack)) {
    return "snapshot";
  }
  if (/certificate|credential|verify/.test(haystack)) {
    return "certificate";
  }
  if (/portfolio/.test(haystack)) {
    return "portfolio";
  }
  if (/live|demo|deploy|vercel\.app|netlify\.app|render\.com|firebaseapp\.com/.test(haystack)) {
    return "live";
  }
  return "other";
}

function defaultLabelFor(type, hostname = "") {
  switch (type) {
    case "repo":
      return hostname.includes("github.com") ? "GitHub" : "Repo";
    case "video":
      return "YouTube";
    case "live":
      return "Live";
    case "snapshot":
      return "Snapshots";
    case "certificate":
      return "Certificate";
    case "portfolio":
      return "Portfolio";
    default:
      return hostname || "Link";
  }
}

function projectScore(project, link) {
  if (!link?.normalizedUrl) {
    return 0;
  }

  const projectWords = words(`${project.name} ${project.description} ${(project.technologies || []).join(" ")}`);
  if (!projectWords.length) {
    return 0;
  }

  const evidence = `${link.label || ""} ${link.context || ""} ${pathText(link)}`;
  let score = Number(link.confidence || 0);
  const matchedWords = projectWords.filter((word) => text(evidence).includes(word));
  score += matchedWords.length * 0.22;

  if (link.type === "project") {
    score += 0.35;
  }

  if (/\b(live|demo|app|youtube|github|snapshot|deployed|repo|repository)\b/i.test(`${link.label || ""} ${link.context || ""}`)) {
    score += 0.3;
  }

  return matchedWords.length || text(link.context).includes(text(project.name)) ? score : 0;
}

function certificationScore(certification, link) {
  if (!link?.normalizedUrl) {
    return 0;
  }

  const evidence = `${link.label || ""} ${link.context || ""} ${pathText(link)}`;
  const certWords = words(`${certification.name} ${certification.issuer}`);
  const matchedWords = certWords.filter((word) => text(evidence).includes(word));
  let score = Number(link.confidence || 0);

  if (link.type === "certificate") {
    score += 0.5;
  }

  if (/certificate|credential|verify/i.test(evidence)) {
    score += 0.25;
  }

  score += matchedWords.length * 0.2;
  return link.type === "certificate" || matchedWords.length ? score : 0;
}

function buildProjectLink(link) {
  const url = link.normalizedUrl;
  if (!url) return null;
  const hostname = host(link);
  const type = projectLinkType(url, link);
  const explicitLabel = link.label && /^(github|youtube|live|demo|snapshots?|repo|repository|portfolio|certificate|link)$/i.test(link.label)
    ? capitalizeLabel(link.label)
    : "";
  const label = explicitLabel || defaultLabelFor(type, hostname);
  return { label, url, type };
}

function capitalizeLabel(label = "") {
  const lc = label.toLowerCase();
  if (lc === "github") return "GitHub";
  if (lc === "youtube") return "YouTube";
  if (lc === "snapshot" || lc === "snapshots") return "Snapshots";
  if (lc === "live" || lc === "demo") return "Live";
  if (lc === "repo" || lc === "repository") return "Repo";
  if (lc === "certificate") return "Certificate";
  if (lc === "portfolio") return "Portfolio";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function dedupeLinks(links = []) {
  const out = [];
  const seen = new Set();
  for (const link of links) {
    if (!link?.url) continue;
    const key = link.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

export function reconcileResumeLinks({ resumeData, sourceLinks = [], userProvidedLinks = [] }) {
  const next = normalizeResumeData(resumeData);
  const trustedLinks = sourceLinks
    .map((link) => ({
      ...link,
      normalizedUrl: normalizeUrl(link.normalizedUrl || link.url),
    }))
    .filter((link) => link.normalizedUrl);
  const usedUrls = new Set();

  clearUnsupportedBasicsLinks(next.basics);

  setIfEmpty(next.basics, "linkedin", bestLink(trustedLinks, (link) => link.type === "linkedin"));
  setIfEmpty(next.basics, "github", bestLink(trustedLinks, (link) => link.type === "github" || profileGithub(link)));
  setIfEmpty(next.basics, "portfolio", bestLink(trustedLinks, (link) => link.type === "portfolio"));
  setIfEmpty(next.basics, "website", bestLink(trustedLinks, (link) => link.type === "website" && /personal website|website|homepage|site/i.test(`${link.label || ""} ${link.context || ""}`)));
  setEmailIfEmpty(next.basics, bestLink(trustedLinks, (link) => link.type === "email"));

  for (const url of [next.basics.linkedin, next.basics.github, next.basics.portfolio, next.basics.website, next.basics.email].filter(Boolean)) {
    usedUrls.add(url);
  }

  next.projects = next.projects.map((project) => {
    const existing = (project.links || []).map((link) => ({ ...link, url: normalizeUrl(link.url) || link.url })).filter((link) => link.url);
    for (const link of existing) {
      usedUrls.add(link.url);
    }

    const candidates = trustedLinks
      .map((link) => ({ link, score: projectScore(project, link) }))
      .filter((candidate) => candidate.score >= 0.9)
      .sort((a, b) => b.score - a.score);

    const merged = [...existing];
    const mergedTypes = new Set(merged.map((link) => link.type));

    for (const candidate of candidates) {
      const trustedUrl = candidate.link.normalizedUrl;
      if (usedUrls.has(trustedUrl)) {
        continue;
      }
      const built = buildProjectLink(candidate.link);
      if (!built) continue;
      if (merged.some((existingLink) => existingLink.url === built.url)) continue;
      // avoid two of same type unless explicitly different (allow multiple "other")
      if (built.type !== "other" && mergedTypes.has(built.type)) continue;
      merged.push(built);
      mergedTypes.add(built.type);
      usedUrls.add(trustedUrl);
    }

    const deduped = dedupeLinks(merged);
    return {
      ...project,
      links: deduped,
      url: project.url || deduped[0]?.url || "",
    };
  });

  next.certifications = next.certifications.map((certification) => {
    if (certification.url) {
      usedUrls.add(certification.url);
      return certification;
    }

    const candidates = trustedLinks
      .map((link) => ({ link, score: certificationScore(certification, link) }))
      .filter((candidate) => candidate.score >= 1 && !usedUrls.has(candidate.link.normalizedUrl))
      .sort((a, b) => b.score - a.score);
    const selected = candidates[0]?.link;

    if (!selected) {
      return certification;
    }

    usedUrls.add(selected.normalizedUrl);
    return { ...certification, url: selected.normalizedUrl };
  });

  return next;
}
