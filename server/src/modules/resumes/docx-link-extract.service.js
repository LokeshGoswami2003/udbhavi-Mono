import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { logger } from "../../utils/logger.js";
import { dedupeLinks, toSourceLink } from "../../utils/links.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
});

function asArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function relationshipsFromXml(xml = "") {
  const parsed = parser.parse(xml);
  const relationships = asArray(parsed?.Relationships?.Relationship);
  const map = new Map();

  for (const relationship of relationships) {
    if (String(relationship.Type || "").includes("/hyperlink") && relationship.Id && relationship.Target) {
      map.set(relationship.Id, relationship.Target);
    }
  }

  return map;
}

function collectText(node) {
  if (node == null) {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join("");
  }

  if (typeof node === "object") {
    return Object.entries(node)
      .filter(([key]) => !["r:id", "w:history", "w:anchor", "rStyle", "rsidR"].includes(key))
      .map(([, value]) => collectText(value))
      .join("");
  }

  return "";
}

function collectHyperlinks(node, links = []) {
  if (!node || typeof node !== "object") {
    return links;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectHyperlinks(item, links);
    }
    return links;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "w:hyperlink") {
      for (const hyperlink of asArray(value)) {
        const relationshipId = hyperlink["r:id"];
        if (relationshipId) {
          links.push({
            relationshipId,
            label: collectText(hyperlink).replace(/\s+/g, " ").trim(),
          });
        }
      }
    } else if (value && typeof value === "object") {
      collectHyperlinks(value, links);
    }
  }

  return links;
}

async function readZipText(zip, path) {
  const file = zip.file(path);
  return file ? file.async("text") : "";
}

function relsPathForPart(partPath) {
  const segments = partPath.split("/");
  const filename = segments.pop();
  return `${segments.join("/")}/_rels/${filename}.rels`;
}

async function extractPartLinks(zip, partPath) {
  const [xml, relsXml] = await Promise.all([
    readZipText(zip, partPath),
    readZipText(zip, relsPathForPart(partPath)),
  ]);

  if (!xml || !relsXml) {
    return [];
  }

  const relationshipMap = relationshipsFromXml(relsXml);
  if (!relationshipMap.size) {
    return [];
  }

  const parsed = parser.parse(xml);
  return collectHyperlinks(parsed)
    .map((hyperlink) => {
      const url = relationshipMap.get(hyperlink.relationshipId);
      return url
        ? toSourceLink({
            url,
            label: hyperlink.label,
            context: hyperlink.label,
            source: "docx_relationship",
            confidence: hyperlink.label ? 0.9 : 0.78,
          })
        : null;
    })
    .filter(Boolean);
}

export async function extractDocxLinks(fileBuffer, { requestId } = {}) {
  try {
    const zip = await JSZip.loadAsync(fileBuffer);
    const partPaths = [
      "word/document.xml",
      ...Object.keys(zip.files).filter((path) => /^word\/header\d*\.xml$/i.test(path) || /^word\/footer\d*\.xml$/i.test(path)),
    ];
    const links = [];

    for (const partPath of partPaths) {
      links.push(...await extractPartLinks(zip, partPath));
    }

    const deduped = dedupeLinks(links);
    logger.info("resume.docx.links.extracted", {
      requestId,
      module: "resumes",
      count: deduped.length,
    });
    return deduped;
  } catch (error) {
    logger.warn("resume.docx.links.failed", {
      requestId,
      module: "resumes",
      code: error.code || error.name || "DOCX_LINK_EXTRACTION_FAILED",
    });
    return [];
  }
}
