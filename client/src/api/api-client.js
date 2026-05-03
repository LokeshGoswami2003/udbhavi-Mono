const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? 'http://localhost:4000/api/v1'

export async function fetchCurrentUser(getApiToken) {
  const token = await getApiToken()
  const response = await fetch(`${apiBaseUrl}/me`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error('We could not load your workspace account. Please try again.')
  }

  return payload.data.user
}
