const appOrigin = window.location.origin

function readEnv(name) {
  return import.meta.env[name]?.trim() ?? ''
}

export const authConfig = {
  domain: readEnv('VITE_AUTH0_DOMAIN'),
  clientId: readEnv('VITE_AUTH0_CLIENT_ID'),
  audience: readEnv('VITE_AUTH0_AUDIENCE'),
  redirectUri: `${appOrigin}/app`,
  logoutReturnTo: appOrigin,
}

export function hasAuthConfig() {
  return Boolean(authConfig.domain && authConfig.clientId && authConfig.audience)
}
