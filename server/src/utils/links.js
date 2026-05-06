const allowedProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);
const trailingPunctuation = /[.,)\]\};:]+$/;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const fullUrlPattern = /\b(?:https?:\/\/|mailto:|tel:|www\.)[^\s<>"']+/gi;
const bareDomainPattern = /\b(?:github\.com|linkedin\.com|leetcode\.com|hackerrank\.com|codechef\.com|codingninjas\.com|geeksforgeeks\.org|kaggle\.com|behance\.net|dribbble\.com|medium\.com|dev\.to|youtube\.com|youtu\.be|vercel\.app|netlify\.app|render\.com|firebaseapp\.com|[a-z0-9][a-z0-9-]{1,62}\.(?:com|dev|io|app|in|net|org|me|co|ai|site|space|tech))(?:\/[^\s<>"']*)?/gi;

const projectLabelPattern = /\b(project|live|demo|deployed|deployment|repository|repo|source|github|link|app)\b/i;
const certificateLabelPattern = /\b(certificate|certification|credential|verify|coursera|udemy|issuer)\b/i;
const portfolioLabelPattern = /\b(portfolio|personal site|personal website|website|site)\b/i;
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
const technologyContextPattern = /\b(skill|skills|technical|technologies|tech stack|backend|frontend|framework|library|libraries|api|apis|websocket|websockets|database|databases|tools)\b/i;

function cleanCandidate(value = "") {
  let next = String(value).trim();
  while (trailingPunctuation.test(next)) {
    next = next.replace(trailingPunctuation, "");
  }
  return next;
}

function hasAllowedProtocol(value) {
  try {
    return allowedProtocols.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

function shouldPreserveQuery(hostname, pathname, search) {
  if (!search) {
    return false;
  }

  if (/coursera\.org|credly\.com|udemy\.com|youtube\.com|youtu\.be/i.test(hostname)) {
    return true;
  }

  return /verify|certificate|credential|cert/i.test(`${pathname} ${search}`);
}

function toUrlCandidate(value) {
  const candidate = cleanCandidate(value);

  if (!candidate) {
    return "";
  }

  if (/^(javascript|data|file|vbscript):/i.test(candidate)) {
    return "";
  }

  if (/^mailto:/i.test(candidate)) {
    const email = candidate.replace(/^mailto:/i, "").split("?")[0].trim();
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email) ? `mailto:${email.toLowerCase()}` : "";
  }

  if (/^tel:/i.test(candidate)) {
    const phone = candidate.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
    return phone ? `tel:${phone}` : "";
  }

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(candidate)) {
    return `mailto:${candidate.toLowerCase()}`;
  }

  if (/^www\./i.test(candidate)) {
    return `https://${candidate}`;
  }

  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate) && /\.[a-z]{2,}(?:\/|$)/i.test(candidate)) {
    return `https://${candidate}`;
  }

  return candidate;
}

export function normalizeUrl(url) {
  const candidate = toUrlCandidate(url);

  if (!candidate || !hasAllowedProtocol(candidate)) {
    return "";
  }

  try {
    const parsed = new URL(candidate);
    parsed.hash = "";

    if (parsed.protocol === "mailto:") {
      return `mailto:${parsed.pathname.toLowerCase()}`;
    }

    if (parsed.protocol === "tel:") {
      return `tel:${parsed.pathname.replace(/[^\d+]/g, "")}`;
    }

    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.hostname.startsWith("www.")) {
      parsed.hostname = parsed.hostname.slice(4);
    }
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";

    if (!shouldPreserveQuery(parsed.hostname, parsed.pathname, parsed.search)) {
      parsed.search = "";
    }

    const normalized = parsed.toString();
    return parsed.pathname === "/" && !parsed.search ? normalized.replace(/\/$/, "") : normalized;
  } catch {
    return "";
  }
}

function hostnameOf(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTechnologyHost(hostname = "") {
  return technologyHosts.has(hostname.replace(/^www\./, ""));
}

export function classifyLink({ url, label = "", context = "" } = {}) {
  const normalizedUrl = normalizeUrl(url);
  const haystack = `${label} ${context} ${normalizedUrl}`.toLowerCase();
  const hostname = hostnameOf(normalizedUrl);

  if (normalizedUrl.startsWith("mailto:")) {
    return "email";
  }

  if (normalizedUrl.startsWith("tel:")) {
    return "phone";
  }

  if (isTechnologyHost(hostname)) {
    return "other";
  }

  if (hostname.includes("linkedin.com") && /\/in\//i.test(normalizedUrl)) {
    return "linkedin";
  }

  if (hostname.includes("github.com")) {
    const pathParts = new URL(normalizedUrl).pathname.split("/").filter(Boolean);
    return pathParts.length >= 2 ? "project" : "github";
  }

  if (hostname.includes("leetcode.com")) {
    return haystack.includes("leetcode") ? "leetcode" : "coding_profile";
  }

  if (/hackerrank\.com|codechef\.com|codingninjas\.com|geeksforgeeks\.org|kaggle\.com/.test(hostname)) {
    return "coding_profile";
  }

  if (certificateLabelPattern.test(haystack)) {
    return "certificate";
  }

  if (portfolioLabelPattern.test(haystack) || /behance\.net|dribbble\.com/.test(hostname)) {
    return "portfolio";
  }

  if (/vercel\.app|netlify\.app|render\.com|firebaseapp\.com/.test(hostname) || projectLabelPattern.test(haystack)) {
    return "project";
  }

  if (/medium\.com|dev\.to|youtube\.com|youtu\.be/.test(hostname)) {
    return "website";
  }

  return hostname ? "website" : "other";
}

function contextAround(text, start, end) {
  const before = text.slice(Math.max(0, start - 90), start);
  const after = text.slice(end, Math.min(text.length, end + 90));
  return cleanCandidate(`${before} ${after}`.replace(/\s+/g, " "));
}

function labelNearContext(context = "") {
  return context.match(/\b(LinkedIn|GitHub|Portfolio|Website|Live|Demo|Certificate|Credential|LeetCode|HackerRank|CodeChef|Kaggle|Medium|YouTube|Link)\b/i)?.[0] || undefined;
}

export function toSourceLink({ url, label, source = "visible_text", context, pageNumber, confidence = 0.7 } = {}) {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) {
    return null;
  }

  const hostname = hostnameOf(normalizedUrl);
  const type = classifyLink({ url: normalizedUrl, label, context });

  if (isTechnologyHost(hostname) && type === "other" && technologyContextPattern.test(String(context || ""))) {
    return null;
  }

  const next = {
    url: cleanCandidate(url),
    normalizedUrl,
    label: label ? cleanCandidate(label) : undefined,
    type,
    source,
    context: context ? cleanCandidate(context).slice(0, 500) : undefined,
    pageNumber,
    confidence,
  };

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined && value !== ""));
}

export function extractVisibleLinksFromText(rawText = "") {
  const text = String(rawText || "");
  const links = [];

  for (const match of text.matchAll(fullUrlPattern)) {
    links.push(toSourceLink({
      url: match[0],
      label: labelNearContext(contextAround(text, match.index, match.index + match[0].length)),
      source: "visible_text",
      context: contextAround(text, match.index, match.index + match[0].length),
      confidence: 0.72,
    }));
  }

  for (const match of text.matchAll(bareDomainPattern)) {
    if (text[match.index - 1] === "@") {
      continue;
    }

    links.push(toSourceLink({
      url: match[0],
      label: labelNearContext(contextAround(text, match.index, match.index + match[0].length)),
      source: "visible_text",
      context: contextAround(text, match.index, match.index + match[0].length),
      confidence: 0.68,
    }));
  }

  for (const match of text.matchAll(emailPattern)) {
    links.push(toSourceLink({
      url: match[0],
      source: "visible_text",
      context: contextAround(text, match.index, match.index + match[0].length),
      confidence: 0.9,
    }));
  }

  for (const match of text.matchAll(phonePattern)) {
    const digits = match[0].replace(/[^\d]/g, "");
    if (digits.length >= 8 && digits.length <= 15) {
      links.push(toSourceLink({
        url: `tel:${match[0]}`,
        source: "visible_text",
        context: contextAround(text, match.index, match.index + match[0].length),
        confidence: 0.55,
      }));
    }
  }

  return dedupeLinks(links.filter(Boolean));
}

function richness(link = {}) {
  return [
    link.label ? 2 : 0,
    link.context ? Math.min(3, Math.ceil(String(link.context).length / 80)) : 0,
    link.pageNumber ? 1 : 0,
    link.source === "pdf_annotation" || link.source === "docx_relationship" ? 2 : 0,
    Number(link.confidence || 0),
  ].reduce((sum, value) => sum + value, 0);
}

export function dedupeLinks(links = []) {
  const byUrl = new Map();

  for (const item of links) {
    const link = item?.normalizedUrl ? item : toSourceLink(item);
    if (!link?.normalizedUrl) {
      continue;
    }

    const current = byUrl.get(link.normalizedUrl);
    if (!current || richness(link) > richness(current)) {
      byUrl.set(link.normalizedUrl, {
        ...current,
        ...link,
        confidence: Math.max(Number(current?.confidence || 0), Number(link.confidence || 0)),
        type: link.type || current?.type || "other",
      });
    }
  }

  return [...byUrl.values()];
}

export function mergeLinkEvidence(...linkArrays) {
  return dedupeLinks(linkArrays.flat().filter(Boolean));
}

export function extractLinks(rawText = "") {
  return extractVisibleLinksFromText(rawText);
}
