import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { logger } from "../../utils/logger.js";
import { dedupeLinks, toSourceLink } from "../../utils/links.js";

function itemRect(item = {}) {
  const transform = item.transform || [];
  const x = Number(transform[4] || 0);
  const y = Number(transform[5] || 0);
  const width = Number(item.width || 0);
  const height = Number(item.height || Math.abs(transform[3] || 0) || 10);
  return { x1: x, y1: y, x2: x + width, y2: y + height };
}

function overlaps(a, b, padding = 8) {
  return a.x1 <= b.x2 + padding && a.x2 >= b.x1 - padding && a.y1 <= b.y2 + padding && a.y2 >= b.y1 - padding;
}

function lineTextNearRect(textItems, rect) {
  const nearby = textItems
    .map((item) => ({ text: item.str, rect: itemRect(item) }))
    .filter((item) => item.text && overlaps(item.rect, rect, 12))
    .sort((a, b) => a.rect.y1 === b.rect.y1 ? a.rect.x1 - b.rect.x1 : b.rect.y1 - a.rect.y1)
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join(" ");

  return nearby || "";
}

function commonLabelContext(pageText = "", url = "") {
  const labelPattern = /\b(LinkedIn|GitHub|Portfolio|Website|Live|Demo|Certificate|Credential|LeetCode|HackerRank|CodeChef|Kaggle|Medium|YouTube|Link)\b/gi;
  const matches = [...pageText.matchAll(labelPattern)];

  if (!matches.length) {
    return { label: undefined, context: pageText.slice(0, 300) };
  }

  const hostnameHint = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "").split(".")[0];
    } catch {
      return "";
    }
  })();

  const preferred = matches.find((match) => hostnameHint && match[0].toLowerCase().includes(hostnameHint)) || matches[0];
  const start = Math.max(0, preferred.index - 120);
  const end = Math.min(pageText.length, preferred.index + 180);
  return {
    label: preferred[0],
    context: pageText.slice(start, end).replace(/\s+/g, " ").trim(),
  };
}

export async function extractPdfLinks(fileBuffer, { requestId } = {}) {
  const links = [];
  let pdf;

  try {
    pdf = await getDocument({
      data: new Uint8Array(fileBuffer),
      disableFontFace: true,
      isEvalSupported: false,
      useWorkerFetch: false,
    }).promise;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const [textContent, annotations] = await Promise.all([
        page.getTextContent().catch(() => ({ items: [] })),
        page.getAnnotations().catch(() => []),
      ]);
      const textItems = textContent.items || [];
      const pageText = textItems.map((item) => item.str).filter(Boolean).join(" ");

      for (const annotation of annotations || []) {
        const url = annotation?.url || annotation?.unsafeUrl;
        if (!url) {
          continue;
        }

        const rect = Array.isArray(annotation.rect)
          ? {
              x1: Math.min(annotation.rect[0], annotation.rect[2]),
              y1: Math.min(annotation.rect[1], annotation.rect[3]),
              x2: Math.max(annotation.rect[0], annotation.rect[2]),
              y2: Math.max(annotation.rect[1], annotation.rect[3]),
            }
          : null;
        const preciseContext = rect ? lineTextNearRect(textItems, rect) : "";
        const fallback = preciseContext ? {} : commonLabelContext(pageText, url);
        const label = preciseContext.match(/\b(LinkedIn|GitHub|Portfolio|Website|Live|Demo|Certificate|Credential|LeetCode|HackerRank|CodeChef|Kaggle|Medium|YouTube|Link)\b/i)?.[0] || fallback.label;
        const context = preciseContext || fallback.context;

        links.push(toSourceLink({
          url,
          label,
          context,
          pageNumber,
          source: "pdf_annotation",
          confidence: preciseContext ? 0.92 : 0.78,
        }));
      }
    }
  } catch (error) {
    logger.warn("resume.pdf.links.failed", {
      requestId,
      module: "resumes",
      code: error.code || error.name || "PDF_LINK_EXTRACTION_FAILED",
    });
  } finally {
    await pdf?.destroy?.().catch(() => undefined);
  }

  const deduped = dedupeLinks(links);
  logger.info("resume.pdf.links.extracted", {
    requestId,
    module: "resumes",
    count: deduped.length,
  });

  return deduped;
}
