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
    ? input.projects.map((item = {}) => ({
        name: toString(item.name),
        description: toString(item.description),
        url: toUrlString(item.url),
        bullets: stringArray(item.bullets),
        technologies: stringArray(item.technologies),
      })).filter((item) => item.name || item.description || item.bullets.length)
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
