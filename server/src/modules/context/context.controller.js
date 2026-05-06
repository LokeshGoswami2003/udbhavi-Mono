import { listProjects } from "../projects/project.service.js";
import { listResumes } from "../resumes/resume.service.js";
import { getCurrentUser } from "../users/user.service.js";
import { getOrCreateUserData } from "../user-data/user-data.service.js";

export async function getContext(req, res, next) {
  try {
    const [userData, resumes, projects] = await Promise.all([
      getOrCreateUserData(req.user._id),
      listResumes(req.user._id),
      listProjects(req.user._id),
    ]);

    res.json({
      ok: true,
      data: {
        user: getCurrentUser(req.user),
        userData,
        resumes,
        projects,
        primaryResume: resumes.find((resume) => resume.isPrimary) || null,
        onboarding: userData.onboarding,
      },
    });
  } catch (error) {
    next(error);
  }
}
