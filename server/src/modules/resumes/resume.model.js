import mongoose from "mongoose";
import { emptyResumeData } from "./resume-data.js";

const linkSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    label: String,
    source: { type: String, enum: ["text", "metadata"], default: "text" },
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceType: { type: String, enum: ["upload", "manual"], required: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    isPrimary: { type: Boolean, default: false, index: true },
    file: {
      storage: String,
      fileId: mongoose.Schema.Types.ObjectId,
      originalName: String,
      mimeType: String,
      size: Number,
      sha256: String,
    },
    extraction: {
      status: { type: String, enum: ["pending", "processing", "ready", "failed"], default: "pending" },
      parser: { type: String, enum: ["pdf-parse", "mammoth", "manual"], default: "manual" },
      rawText: String,
      links: [linkSchema],
      parsedAt: Date,
      errorCode: String,
    },
    resumeData: { type: mongoose.Schema.Types.Mixed, default: emptyResumeData },
    deletedAt: Date,
  },
  { timestamps: true },
);

resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ userId: 1, "file.sha256": 1 });

export const Resume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);
