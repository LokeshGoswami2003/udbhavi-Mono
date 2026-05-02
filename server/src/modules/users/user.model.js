import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Sub: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    limits: {
      maxProjects: {
        type: Number,
        default: 3,
      },
      dailyAiCalls: {
        type: Number,
        default: 20,
      },
      dailyUploads: {
        type: Number,
        default: 5,
      },
      dailyCompiles: {
        type: Number,
        default: 50,
      },
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
