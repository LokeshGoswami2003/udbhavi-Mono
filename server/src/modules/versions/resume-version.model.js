import mongoose from "mongoose";

const resumeVersionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    versionNumber: { type: Number, required: true },
    label: { type: String, trim: true, maxlength: 160 },
    resumeData: { type: mongoose.Schema.Types.Mixed, required: true },
    latexSource: { type: String, required: true },
    source: {
      type: String,
      enum: ["initial_generation", "chat_edit", "manual_edit", "jd_optimizer", "restore"],
      required: true,
    },
    changeSummary: [String],
  },
  { timestamps: true },
);

resumeVersionSchema.index({ projectId: 1, versionNumber: 1 }, { unique: true });
resumeVersionSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

export const ResumeVersion =
  mongoose.models.ResumeVersion || mongoose.model("ResumeVersion", resumeVersionSchema);
