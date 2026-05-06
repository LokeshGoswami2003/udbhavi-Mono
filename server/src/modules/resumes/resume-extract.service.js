import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { logger } from "../../utils/logger.js";
import { extractVisibleLinksFromText, mergeLinkEvidence } from "../../utils/links.js";
import { extractDocxLinks } from "./docx-link-extract.service.js";
import { extractPdfLinks } from "./pdf-link-extract.service.js";
import { emptyResumeData } from "./resume-data.js";

const pdfMimeTypes = new Set(["application/pdf"]);
const docxMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export function getParserName(mimeType) {
  if (pdfMimeTypes.has(mimeType)) {
    return "pdf-parse";
  }

  if (docxMimeTypes.has(mimeType)) {
    return "mammoth";
  }

  return null;
}

export async function extractResume(file, { requestId } = {}) {
  const parser = getParserName(file.mimetype);

  if (!parser) {
    const error = new Error("Upload a PDF or DOCX resume.");
    error.statusCode = 400;
    error.code = "UNSUPPORTED_RESUME_FILE";
    throw error;
  }

  let rawText = "";

  const parserWarnings = [];
  let embeddedLinks = [];

  if (parser === "pdf-parse") {
    const pdf = new PDFParse({ data: file.buffer });
    try {
      rawText = (await pdf.getText()).text || "";
    } catch (error) {
      parserWarnings.push("PDF_TEXT_EXTRACTION_FAILED");
      logger.warn("resume.pdf.text.failed", {
        requestId,
        module: "resumes",
        code: error.code || error.name || "PDF_TEXT_EXTRACTION_FAILED",
      });
    } finally {
      await pdf.destroy();
    }
    embeddedLinks = await extractPdfLinks(file.buffer, { requestId }).catch((error) => {
      parserWarnings.push("PDF_LINK_EXTRACTION_FAILED");
      logger.warn("resume.pdf.links.unhandled", {
        requestId,
        module: "resumes",
        code: error.code || error.name || "PDF_LINK_EXTRACTION_FAILED",
      });
      return [];
    });
  } else {
    try {
      rawText = (await mammoth.extractRawText({ buffer: file.buffer })).value || "";
    } catch (error) {
      parserWarnings.push("DOCX_TEXT_EXTRACTION_FAILED");
      logger.warn("resume.docx.text.failed", {
        requestId,
        module: "resumes",
        code: error.code || error.name || "DOCX_TEXT_EXTRACTION_FAILED",
      });
    }
    embeddedLinks = await extractDocxLinks(file.buffer, { requestId }).catch((error) => {
      parserWarnings.push("DOCX_LINK_EXTRACTION_FAILED");
      logger.warn("resume.docx.links.unhandled", {
        requestId,
        module: "resumes",
        code: error.code || error.name || "DOCX_LINK_EXTRACTION_FAILED",
      });
      return [];
    });
  }

  const visibleLinks = extractVisibleLinksFromText(rawText);
  const sourceLinks = mergeLinkEvidence(embeddedLinks, visibleLinks);

  return {
    parser,
    rawText: rawText.trim(),
    links: sourceLinks.map((link) => link.normalizedUrl),
    sourceLinks,
    extractionQuality: {
      rawTextChars: rawText.trim().length,
      visibleLinkCount: visibleLinks.length,
      embeddedLinkCount: embeddedLinks.length,
      totalLinkCount: sourceLinks.length,
      parserWarnings,
    },
    resumeData: emptyResumeData(),
  };
}
