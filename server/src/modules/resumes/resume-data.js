import { normalizeUrl } from "../../utils/links.js";

export function emptyResumeData() {
  return {
    basics: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      portfolio: "",
      links: [],
      summary: "",
    },
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    awards: [],
    customSections: [],
  };
}

function toString(value) {
  return value == null ? "" : String(value).trim();
}

function toUrlString(value) {
  const trimmed = toString(value);
  return normalizeUrl(trimmed) || trimmed;
}

function stringArray(value) {
  return Array.isArray(value) ? value.map(toString).filter(Boolean) : [];
}

function normalizeLinkType(value) {
  const type = toString(value).toLowerCase();
  return ["repo", "video", "live", "snapshot", "certificate", "portfolio", "other"].includes(type) ? type : "other";
}

function labelForUrl(url, fallback = "Link") {
  const value = toString(url).toLowerCase();

  if (value.includes("github.com")) return "GitHub";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "YouTube";
  if (value.includes("certificate") || value.includes("credential")) return "Certificate";
  if (value.includes("snapshot") || value.includes("screenshot")) return "Snapshots";
  if (/(vercel\.app|netlify\.app|render\.com|firebaseapp\.com|demo|live)/i.test(value)) return "Live";

  return fallback;
}

function typeForUrl(url, label = "") {
  const value = `${url} ${label}`.toLowerCase();

  if (value.includes("github.com")) return "repo";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "video";
  if (value.includes("snapshot") || value.includes("screenshot")) return "snapshot";
  if (value.includes("certificate") || value.includes("credential")) return "certificate";
  if (/(vercel\.app|netlify\.app|render\.com|firebaseapp\.com|live|demo|deployed)/i.test(value)) return "live";
  if (/portfolio|website|personal/.test(value)) return "portfolio";

  return "other";
}

function linkArray(value) {
  const links = Array.isArray(value)
    ? value
        .map((item = {}) => {
          const url = toUrlString(item.url || item.normalizedUrl);
          const label = toString(item.label) || labelForUrl(url);
          return {
            label,
            url,
            type: normalizeLinkType(item.type) === "other" ? typeForUrl(url, label) : normalizeLinkType(item.type),
          };
        })
        .filter((item) => item.url)
    : [];
  const byUrl = new Map();

  for (const link of links) {
    if (!byUrl.has(link.url)) {
      byUrl.set(link.url, link);
    }
  }

  return [...byUrl.values()];
}

export function normalizeResumeData(input = {}) {
  const empty = emptyResumeData();
  const data = { ...empty, ...(input || {}) };
  const basics = input?.basics || {};

  data.basics = {
    ...empty.basics,
    fullName: toString(basics.fullName),
    headline: toString(basics.headline),
    email: toString(basics.email),
    phone: toString(basics.phone),
    location: toString(basics.location),
    website: toUrlString(basics.website),
    linkedin: toUrlString(basics.linkedin),
    github: toUrlString(basics.github),
    portfolio: toUrlString(basics.portfolio),
    links: linkArray(basics.links),
    summary: toString(basics.summary),
  };

  data.skills = Array.isArray(input.skills)
    ? input.skills.map((item = {}) => ({
        category: toString(item.category),
        items: stringArray(item.items),
      })).filter((item) => item.category || item.items.length)
    : [];

  data.experience = Array.isArray(input.experience)
    ? input.experience.map((item = {}) => ({
        company: toString(item.company),
        role: toString(item.role),
        location: toString(item.location),
        startDate: toString(item.startDate),
        endDate: toString(item.endDate),
        current: Boolean(item.current),
        bullets: stringArray(item.bullets),
        technologies: stringArray(item.technologies),
      })).filter((item) => item.company || item.role || item.bullets.length)
    : [];

  data.education = Array.isArray(input.education)
    ? input.education.map((item = {}) => ({
        institution: toString(item.institution),
        degree: toString(item.degree),
        field: toString(item.field),
        location: toString(item.location),
        startDate: toString(item.startDate),
        endDate: toString(item.endDate),
        gpa: toString(item.gpa),
        bullets: stringArray(item.bullets),
      })).filter((item) => item.institution || item.degree)
    : [];

  data.projects = Array.isArray(input.projects)
    ? input.projects.map((item = {}) => {
        const url = toUrlString(item.url);
        const links = linkArray(item.links);
        if (url && !links.some((link) => link.url === url)) {
          links.unshift({ label: labelForUrl(url), url, type: typeForUrl(url) });
        }

        return {
          name: toString(item.name),
          description: toString(item.description),
          url,
          links,
          bullets: stringArray(item.bullets),
          technologies: stringArray(item.technologies),
        };
      }).filter((item) => item.name || item.description || item.bullets.length)
    : [];

  data.certifications = Array.isArray(input.certifications)
    ? input.certifications.map((item = {}) => ({
        name: toString(item.name),
        issuer: toString(item.issuer),
        date: toString(item.date),
        url: toUrlString(item.url),
      })).filter((item) => item.name)
    : [];

  data.awards = Array.isArray(input.awards)
    ? input.awards.map((item = {}) => ({
        title: toString(item.title),
        issuer: toString(item.issuer),
        date: toString(item.date),
        description: toString(item.description),
      })).filter((item) => item.title)
    : [];

  data.customSections = Array.isArray(input.customSections)
    ? input.customSections.map((section = {}) => ({
        title: toString(section.title),
        items: Array.isArray(section.items)
          ? section.items.map((item = {}) => ({
              heading: toString(item.heading),
              subheading: toString(item.subheading),
              date: toString(item.date),
              bullets: stringArray(item.bullets),
            })).filter((item) => item.heading || item.subheading || item.bullets.length)
          : [],
      })).filter((section) => section.title && section.items.length)
    : [];

  return data;
}
