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

function hasAnyNeedle(haystack, needles) {
  const value = text(haystack);
  return needles.some((needle) => value.includes(text(needle)));
}

function urlPathWords(url = "") {
  try {
    return words(new URL(normalizeUrl(url)).pathname);
  } catch {
    return [];
  }
}

function linkHostFromUrl(url = "") {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function linkLabel(link = {}) {
  const value = `${link.label || ""} ${link.context || ""} ${link.normalizedUrl || ""}`.toLowerCase();
  const hostname = host(link);

  if (hostname.includes("github.com")) return "GitHub";
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";
  if (/snapshot|screenshot|image/.test(value)) return "Snapshots";
  if (/certificate|credential|verify/.test(value)) return "Certificate";
  if (/live|demo|deployed|vercel\.app|netlify\.app|render\.com|firebaseapp\.com/.test(value)) return "Live";
  if (/portfolio|personal website|website/.test(value)) return "Website";

  return link.label || "Link";
}

function linkKind(link = {}) {
  const label = linkLabel(link).toLowerCase();
  const hostname = host(link);

  if (hostname.includes("github.com")) return "repo";
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "video";
  if (label.includes("snapshot")) return "snapshot";
  if (label.includes("certificate")) return "certificate";
  if (label.includes("live") || label.includes("demo")) return "live";
  if (label.includes("website") || label.includes("portfolio")) return "portfolio";

  return "other";
}

function toResumeLink(link) {
  return {
    label: linkLabel(link),
    url: link.normalizedUrl,
    type: linkKind(link),
  };
}

function isHttpUrl(url = "") {
  return /^https?:\/\//i.test(normalizeUrl(url));
}

function projectLinkSupportsProject(project, link = {}) {
  const normalizedUrl = normalizeUrl(link.url || link.normalizedUrl);

  if (!normalizedUrl || !isHttpUrl(normalizedUrl)) {
    return false;
  }

  const hostname = linkHostFromUrl(normalizedUrl);
  const projectWords = words(`${project.name} ${project.description} ${(project.technologies || []).join(" ")}`);
  const evidence = `${link.label || ""} ${link.context || ""} ${normalizedUrl} ${pathText({ normalizedUrl })}`;

  if (projectWords.some((word) => text(evidence).includes(word))) {
    return true;
  }

  if (hostname.includes("github.com")) {
    const repoWords = urlPathWords(normalizedUrl).slice(1);
    return projectWords.some((word) => repoWords.includes(word));
  }

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return /youtube|demo|video/i.test(String(link.label || ""));
  }

  if (/vercel\.app|netlify\.app|render\.com|firebaseapp\.com/.test(hostname)) {
    return !/link$/i.test(String(link.label || "Link")) || projectWords.some((word) => text(normalizedUrl).includes(word));
  }

  return !/^(link|website)$/i.test(String(link.label || "Link"));
}

function cleanProjectLinks(project = {}) {
  const links = Array.isArray(project.links) ? [...project.links] : [];
  if (project.url && !links.some((link) => normalizeUrl(link.url) === normalizeUrl(project.url))) {
    links.unshift({ label: "Link", url: project.url, type: "other" });
  }

  const byUrl = new Map();
  for (const link of links) {
    const normalizedUrl = normalizeUrl(link.url || link.normalizedUrl);
    if (!normalizedUrl || !projectLinkSupportsProject(project, { ...link, url: normalizedUrl, normalizedUrl })) {
      continue;
    }

    if (!byUrl.has(normalizedUrl)) {
      byUrl.set(normalizedUrl, {
        label: link.label || linkLabel({ ...link, normalizedUrl }),
        url: normalizedUrl,
        type: link.type || linkKind({ ...link, normalizedUrl }),
      });
    }
  }

  const cleanedLinks = [...byUrl.values()];
  const cleanedUrl = cleanedLinks.some((link) => link.url === normalizeUrl(project.url))
    ? normalizeUrl(project.url)
    : cleanedLinks[0]?.url || "";

  return { ...project, url: cleanedUrl, links: cleanedLinks };
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

function sourceKey(sourceLinks = [], userProvidedLinks = []) {
  return new Set([...sourceLinks, ...userProvidedLinks].map((link) => normalizeUrl(link.normalizedUrl || link.url || link)).filter(Boolean));
}

function clearUnsupportedBasicsLinks(basics, trustedUrls) {
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

function projectScore(project, link, usedUrls) {
  if (!link?.normalizedUrl || usedUrls.has(link.normalizedUrl)) {
    return 0;
  }

  const projectWords = words(`${project.name} ${project.description} ${(project.technologies || []).join(" ")}`);
  if (!projectWords.length) {
    return 0;
  }

  const evidence = `${link.label || ""} ${link.context || ""} ${pathText(link)} ${link.normalizedUrl || ""}`;
  let score = Number(link.confidence || 0);
  const matchedWords = projectWords.filter((word) => text(evidence).includes(word));
  score += matchedWords.length * 0.22;

  if (link.type === "project") {
    score += 0.35;
  }

  if (hasAnyNeedle(link.label, ["live", "demo", "app", "link", "youtube", "snapshots", "github"])) {
    score += 0.3;
  }

  if (host(link).includes("github.com")) {
    score += 0.12;
  }

  if (host(link).includes("youtube.com") || host(link).includes("youtu.be")) {
    score += 0.18;
  }

  return matchedWords.length || hasAnyNeedle(link.context, [project.name]) ? score : 0;
}

function certificationScore(certification, link, usedUrls) {
  if (!link?.normalizedUrl || usedUrls.has(link.normalizedUrl)) {
    return 0;
  }

  const evidence = `${link.label || ""} ${link.context || ""} ${pathText(link)}`;
  const certWords = words(`${certification.name} ${certification.issuer}`);
  const matchedWords = certWords.filter((word) => text(evidence).includes(word));
  let score = Number(link.confidence || 0);

  if (link.type === "certificate") {
    score += 0.5;
  }

  if (hasAnyNeedle(evidence, ["certificate", "credential", "verify"])) {
    score += 0.25;
  }

  score += matchedWords.length * 0.2;
  return link.type === "certificate" || matchedWords.length ? score : 0;
}

export function reconcileResumeLinks({ resumeData, sourceLinks = [], userProvidedLinks = [] }) {
  const next = normalizeResumeData(resumeData);
  const trustedLinks = sourceLinks
    .map((link) => ({
      ...link,
      normalizedUrl: normalizeUrl(link.normalizedUrl || link.url),
    }))
    .filter((link) => link.normalizedUrl);
  const trustedUrls = sourceKey(trustedLinks, userProvidedLinks);
  const usedUrls = new Set();

  clearUnsupportedBasicsLinks(next.basics, trustedUrls);

  setIfEmpty(next.basics, "linkedin", bestLink(trustedLinks, (link) => link.type === "linkedin"));
  setIfEmpty(next.basics, "github", bestLink(trustedLinks, (link) => link.type === "github" || profileGithub(link)));
  setIfEmpty(next.basics, "portfolio", bestLink(trustedLinks, (link) => link.type === "portfolio"));
  setIfEmpty(next.basics, "website", bestLink(trustedLinks, (link) => link.type === "website" && /personal website|website|homepage|site/i.test(`${link.label || ""} ${link.context || ""}`)));
  setEmailIfEmpty(next.basics, bestLink(trustedLinks, (link) => link.type === "email"));

  for (const url of [next.basics.linkedin, next.basics.github, next.basics.portfolio, next.basics.website, next.basics.email].filter(Boolean)) {
    usedUrls.add(url);
  }

  next.projects = next.projects.map((project) => {
    const cleanedProject = cleanProjectLinks(project);
    const currentLinks = Array.isArray(cleanedProject.links) ? [...cleanedProject.links] : [];
    for (const link of currentLinks) {
      if (link.url) {
        usedUrls.add(link.url);
      }
    }
    if (cleanedProject.url) {
      usedUrls.add(cleanedProject.url);
    }

    const candidates = trustedLinks
      .filter((link) => link.type === "project" || link.type === "website")
      .filter((link) => projectLinkSupportsProject(cleanedProject, link))
      .map((link) => ({ link, score: projectScore(cleanedProject, link, usedUrls) }))
      .filter((candidate) => candidate.score >= 0.72)
      .sort((a, b) => b.score - a.score);

    for (const candidate of candidates.slice(0, 4)) {
      if (!currentLinks.some((link) => link.url === candidate.link.normalizedUrl)) {
        currentLinks.push(toResumeLink(candidate.link));
        usedUrls.add(candidate.link.normalizedUrl);
      }
    }

    return cleanProjectLinks({ ...cleanedProject, links: currentLinks, url: cleanedProject.url || currentLinks[0]?.url || "" });
  });

  next.certifications = next.certifications.map((certification) => {
    if (certification.url) {
      usedUrls.add(certification.url);
      return certification;
    }

    const candidates = trustedLinks
      .map((link) => ({ link, score: certificationScore(certification, link, usedUrls) }))
      .filter((candidate) => candidate.score >= 1)
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
