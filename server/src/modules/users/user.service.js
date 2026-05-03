import { env } from "../../config/env.js";
import { User } from "./user.model.js";

function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

function cleanString(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function getClaim(claims, key) {
  return claims[key] || claims[`${env.auth0ClaimsNamespace}/${key}`] || claims[`https://udbhavi.local/${key}`];
}

function getNameFromClaims(claims) {
  const fullName = [getClaim(claims, "given_name"), getClaim(claims, "family_name")]
    .filter(Boolean)
    .join(" ");

  return cleanString(fullName) || cleanString(getClaim(claims, "name")) || cleanString(getClaim(claims, "nickname"));
}

function buildProfileUpdate(claims = {}) {
  const set = {};
  const unset = {};
  const email = cleanString(getClaim(claims, "email"));
  const name = getNameFromClaims(claims);

  if (email) {
    set.email = email;
  }

  if (name && (!email || name.toLowerCase() !== email.toLowerCase())) {
    set.name = name;
  }

  if (email && (!name || name.toLowerCase() === email.toLowerCase())) {
    unset.name = "";
  }

  return { set, unset };
}

export async function syncAuthenticatedUser({ auth0Sub, claims }) {
  const profileUpdate = buildProfileUpdate(claims);
  const update = {};

  if (Object.keys(profileUpdate.set).length > 0) {
    update.$set = profileUpdate.set;
  }

  if (Object.keys(profileUpdate.unset).length > 0) {
    update.$unset = profileUpdate.unset;
  }

  const user = await User.findOneAndUpdate(
    { auth0Sub },
    {
      ...update,
      $setOnInsert: {
        auth0Sub,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return user;
}

export function getCurrentUser(user) {
  return toUserResponse(user);
}
