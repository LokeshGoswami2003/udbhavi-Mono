import { useAuth0 } from '@auth0/auth0-react'
import { useCallback } from 'react'
import { authConfig } from './auth-config'

export function useAuthActions() {
  const { getAccessTokenSilently, loginWithRedirect, logout } = useAuth0()

  const login = useCallback((returnTo = '/app') => {
    return loginWithRedirect({
      appState: { returnTo },
      authorizationParams: {
        audience: authConfig.audience,
        redirect_uri: authConfig.redirectUri,
        scope: 'openid profile email',
      },
    })
  }, [loginWithRedirect])

  const signup = useCallback((returnTo = '/app') => {
    return loginWithRedirect({
      appState: { returnTo },
      authorizationParams: {
        audience: authConfig.audience,
        redirect_uri: authConfig.redirectUri,
        scope: 'openid profile email',
        screen_hint: 'signup',
      },
    })
  }, [loginWithRedirect])

  const logoutToHome = useCallback(() => {
    return logout({
      logoutParams: {
        returnTo: authConfig.logoutReturnTo,
      },
    })
  }, [logout])

  const getApiToken = useCallback(() => {
    return getAccessTokenSilently({
      authorizationParams: {
        audience: authConfig.audience,
        scope: 'openid profile email',
      },
    })
  }, [getAccessTokenSilently])

  return {
    getApiToken,
    login,
    logoutToHome,
    signup,
  }
}
