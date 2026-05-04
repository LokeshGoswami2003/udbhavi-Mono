import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";

export function getResumeBucket() {
  return new GridFSBucket(mongoose.connection.db, { bucketName: "resumeFiles" });
}

export async function saveResumeFile(file) {
  const bucket = getResumeBucket();

  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { module: "resumes" },
    });

    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id));
    stream.end(file.buffer);
  });
}

export async function deleteResumeFile(fileId) {
  if (!fileId) {
    return;
  }

  await getResumeBucket().delete(fileId);
}

export async function readResumeFile(fileId) {
  if (!fileId) {
    return null;
  }

  const chunks = [];
  const stream = getResumeBucket().openDownloadStream(fileId);

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
