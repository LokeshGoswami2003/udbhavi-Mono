import { GridFSBucket, ObjectId } from "mongodb";
import mongoose from "mongoose";

export function getRenderedPdfBucket() {
  return new GridFSBucket(mongoose.connection.db, { bucketName: "renderedPdfs" });
}

function normalizeFileId(fileId) {
  return typeof fileId === "string" ? new ObjectId(fileId) : fileId;
}

export async function saveRenderedPdf({ filename, pdf, metadata = {} }) {
  const bucket = getRenderedPdfBucket();

  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      contentType: "application/pdf",
      metadata: { module: "render", ...metadata },
    });

    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id));
    stream.end(pdf);
  });
}

export async function readRenderedPdf(fileId) {
  if (!fileId) {
    return null;
  }

  const chunks = [];
  const stream = getRenderedPdfBucket().openDownloadStream(normalizeFileId(fileId));

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
