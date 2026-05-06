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
      summary: "",
      links: [],
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

const PROJECT_LINK_TYPES = new Set([
  "repo",
  "video",
  "live",
  "snapshot",
  "certificate",
  "portfolio",
  "other",
]);

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

function classifyProjectLinkType(url, label = "") {
  const haystack = `${label} ${url}`.toLowerCase();
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  if (/youtube\.com|youtu\.be/.test(host) || /youtube|video|demo video/.test(haystack)) return "video";
  if (host.includes("github.com")) return "repo";
  if (/snapshot|screenshot|images|gallery/.test(haystack)) return "snapshot";
  if (/certificate|credential|verify/.test(haystack)) return "certificate";
  if (/portfolio/.test(haystack)) return "portfolio";
  if (/live|demo|deploy|vercel\.app|netlify\.app|render\.com|firebaseapp\.com/.test(haystack)) return "live";
  if (/^https?:/i.test(url)) return "live";
  return "other";
}

function defaultLabelForType(type, host = "") {
  switch (type) {
    case "repo":
      return host.includes("github.com") ? "GitHub" : "Repo";
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
      return host || "Link";
  }
}

function normalizeProjectLink(link = {}) {
  const url = toUrlString(link.url);
  if (!url) {
    return null;
  }

  const explicitType = typeof link.type === "string" && PROJECT_LINK_TYPES.has(link.type) ? link.type : null;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  const inferredType = explicitType || classifyProjectLinkType(url, link.label);
  const label = toString(link.label) || defaultLabelForType(inferredType, host);

  return { label, url, type: inferredType };
}

function dedupeLinkList(links = []) {
  const seen = new Set();
  const out = [];
  for (const link of links) {
    if (!link?.url) continue;
    const key = link.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

function normalizeBasicsLinks(input) {
  if (!Array.isArray(input)) return [];
  return dedupeLinkList(input.map(normalizeProjectLink).filter(Boolean));
}

function normalizeProjectLinksArray(input, fallbackUrl = "") {
  const normalized = Array.isArray(input)
    ? dedupeLinkList(input.map(normalizeProjectLink).filter(Boolean))
    : [];

  if (fallbackUrl && !normalized.length) {
    const link = normalizeProjectLink({ url: fallbackUrl });
    if (link) {
      normalized.push(link);
    }
  }

  return normalized;
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
    summary: toString(basics.summary),
    links: normalizeBasicsLinks(basics.links),
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
        const links = normalizeProjectLinksArray(item.links, url);
        return {
          name: toString(item.name),
          description: toString(item.description),
          url: url || links[0]?.url || "",
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
