import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    onboarding: {
      status: {
        type: String,
        enum: ["not_started", "resume_pending", "review_pending", "complete"],
        default: "not_started",
      },
      completedAt: Date,
    },
    primaryResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    profile: {
      basics: mongoose.Schema.Types.Mixed,
      links: [
        {
          label: String,
          url: String,
          source: {
            type: String,
            enum: ["resume", "manual"],
            default: "resume",
          },
        },
      ],
      preferredRoles: [String],
      preferredTemplateId: String,
    },
  },
  { timestamps: true },
);

export const UserData = mongoose.models.UserData || mongoose.model("UserData", userDataSchema);
