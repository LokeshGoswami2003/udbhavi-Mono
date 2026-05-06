import { syncAuthenticatedUser } from "../modules/users/user.service.js";
import { logger } from "../utils/logger.js";

export async function syncUser(req, _res, next) {
  try {
    const auth0Sub = req.auth?.payload?.sub;

    if (!auth0Sub) {
      const error = new Error("Authenticated user is missing.");
      error.statusCode = 401;
      error.code = "AUTHENTICATION_REQUIRED";
      throw error;
    }

    const user = await syncAuthenticatedUser({
      auth0Sub,
      claims: req.auth.payload,
    });

    req.user = user;

    logger.debug("Authenticated user synced", {
      requestId: req.id,
      module: "users",
      userId: user.id,
    });

    next();
  } catch (error) {
    next(error);
  }
}
