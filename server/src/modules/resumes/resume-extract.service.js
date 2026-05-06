import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { extractLinks } from "../../utils/links.js";
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

export async function extractResume(file) {
  const parser = getParserName(file.mimetype);

  if (!parser) {
    const error = new Error("Upload a PDF or DOCX resume.");
    error.statusCode = 400;
    error.code = "UNSUPPORTED_RESUME_FILE";
    throw error;
  }

  let rawText = "";

  if (parser === "pdf-parse") {
    const pdf = new PDFParse({ data: file.buffer });
    try {
      rawText = (await pdf.getText()).text || "";
    } finally {
      await pdf.destroy();
    }
  } else {
    rawText = (await mammoth.extractRawText({ buffer: file.buffer })).value || "";
  }

  return {
    parser,
    rawText: rawText.trim(),
    links: extractLinks(rawText),
    resumeData: emptyResumeData(),
  };
}
