import { UserData } from "./user-data.model.js";

export async function getOrCreateUserData(userId) {
  return UserData.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
}

export async function setPrimaryResumeContext({ userId, resume }) {
  return UserData.findOneAndUpdate(
    { userId },
    {
      $set: {
        primaryResumeId: resume.id,
        "onboarding.status": "review_pending",
        "profile.basics": resume.resumeData?.basics || {},
        "profile.links": (resume.extraction?.links || []).map((link) => ({
          url: link.url,
          label: link.label,
          source: "resume",
        })),
      },
      $setOnInsert: { userId },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
}

export async function completeOnboarding({ userId, resume }) {
  return UserData.findOneAndUpdate(
    { userId },
    {
      $set: {
        primaryResumeId: resume.id,
        "onboarding.status": "complete",
        "onboarding.completedAt": new Date(),
        "profile.basics": resume.resumeData?.basics || {},
        "profile.links": (resume.extraction?.links || []).map((link) => ({
          url: link.url,
          label: link.label,
          source: "resume",
        })),
      },
    },
    { returnDocument: "after" },
  );
}

export async function clearResumeContext(userId) {
  return UserData.findOneAndUpdate(
    { userId },
    {
      $set: {
        "onboarding.status": "not_started",
        "profile.basics": {},
        "profile.links": [],
      },
      $unset: {
        primaryResumeId: "",
        "onboarding.completedAt": "",
      },
    },
    { returnDocument: "after" },
  );
}
