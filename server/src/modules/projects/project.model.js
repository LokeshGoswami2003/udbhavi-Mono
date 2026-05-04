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
      promptVersion: String,
      resumeDraft: String,
      feedback: [String],
      nextAction: String,
      messages: [
        {
          role: { type: String, enum: ["user", "assistant"], required: true },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    activeVersionId: mongoose.Schema.Types.ObjectId,
    deletedAt: Date,
  },
  { timestamps: true },
);

projectSchema.index({ userId: 1, updatedAt: -1 });
projectSchema.index({ userId: 1, resumeId: 1 });

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
