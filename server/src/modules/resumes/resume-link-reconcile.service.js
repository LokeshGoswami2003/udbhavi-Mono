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

  const evidence = `${link.label || ""} ${link.context || ""} ${pathText(link)}`;
  let score = Number(link.confidence || 0);
  const matchedWords = projectWords.filter((word) => text(evidence).includes(word));
  score += matchedWords.length * 0.22;

  if (link.type === "project") {
    score += 0.35;
  }

  if (hasAnyNeedle(link.label, ["live", "demo", "app", "link"])) {
    score += 0.3;
  }

  if (host(link).includes("github.com")) {
    score += 0.12;
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
    if (project.url) {
      usedUrls.add(project.url);
      return project;
    }

    const candidates = trustedLinks
      .map((link) => ({ link, score: projectScore(project, link, usedUrls) }))
      .filter((candidate) => candidate.score >= 0.9)
      .sort((a, b) => b.score - a.score);
    const selected = candidates[0]?.link;

    if (!selected) {
      return project;
    }

    usedUrls.add(selected.normalizedUrl);
    return { ...project, url: selected.normalizedUrl };
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
