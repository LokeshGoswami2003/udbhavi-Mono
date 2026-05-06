import { Auth0Provider } from '@auth0/auth0-react'
import { replaceWith } from '../router/navigation'
import { authConfig, hasAuthConfig } from './auth-config'

function onRedirectCallback(appState) {
  const returnTo = appState?.returnTo ?? '/app'
  replaceWith(returnTo)
}

export function AppAuthProvider({ children }) {
  if (!hasAuthConfig()) {
    return children
  }

  return (
    <Auth0Provider
      domain={authConfig.domain}
      clientId={authConfig.clientId}
      cacheLocation="localstorage"
      authorizationParams={{
        audience: authConfig.audience,
        redirect_uri: authConfig.redirectUri,
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}
