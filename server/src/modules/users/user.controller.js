import { getCurrentUser } from "./user.service.js";

export function getMe(req, res) {
  res.json({
    ok: true,
    data: {
      user: getCurrentUser(req.user),
    },
  });
}
