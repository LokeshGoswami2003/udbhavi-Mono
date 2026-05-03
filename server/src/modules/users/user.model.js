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
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
