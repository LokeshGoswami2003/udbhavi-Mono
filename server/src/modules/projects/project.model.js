import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    status: { type: String, enum: ["draft", "template_pending", "processing", "ready", "failed"], default: "template_pending" },
    target: {
      role: String,
      company: String,
      jobDescription: String,
    },
    templateId: String,
    ai: {
      provider: String,
      providerError: {
        code: String,
        message: String,
      },
      promptVersion: String,
      resumeData: mongoose.Schema.Types.Mixed,
      renderedHtml: String,
      latexSource: String,
      pdf: {
        fileId: mongoose.Schema.Types.ObjectId,
        latexHash: String,
        compiledAt: Date,
        compiler: String,
        pageCount: Number,
      },
      feedback: [String],
      nextAction: String,
      messages: [
        {
          role: { type: String, enum: ["user", "assistant"], required: true },
          content: { type: String, required: true },
          metadata: mongoose.Schema.Types.Mixed,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    activeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeVersion" },
    deletedAt: Date,
  },
  { timestamps: true },
);

projectSchema.index({ userId: 1, updatedAt: -1 });
projectSchema.index({ userId: 1, resumeId: 1 });

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
