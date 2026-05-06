const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? 'http://localhost:4000/api/v1'

export class ApiError extends Error {
  constructor(message, { code, status, requestId } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.requestId = requestId
  }
}

function buildErrorMessage(payload, requestId, fallback) {
  const baseMessage = payload?.error?.message || fallback
  if (import.meta.env.DEV && requestId) {
    const code = payload?.error?.code
    return `${baseMessage}${code ? ` [${code}]` : ''} (req ${requestId})`
  }
  return baseMessage
}

async function request(path, getApiToken, options = {}) {
  const token = await getApiToken()
  const headers = {
    authorization: `Bearer ${token}`,
    ...(options.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
    ...options.headers,
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
    },
  })

  const requestId = response.headers.get('x-request-id') || ''
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      buildErrorMessage(payload, requestId, 'The workspace could not complete that action. Please try again.'),
      { code: payload?.error?.code, status: response.status, requestId },
    )
  }

  return payload.data
}

async function requestBlob(path, getApiToken, options = {}) {
  const token = await getApiToken()
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const requestId = response.headers.get('x-request-id') || ''

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(
      buildErrorMessage(payload, requestId, 'The file could not be prepared. Please try again.'),
      { code: payload?.error?.code, status: response.status, requestId },
    )
  }

  const blob = await response.blob()
  const filename =
    response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'resume.pdf'

  return {
    blob,
    filename,
    headers: {
      requestId,
      latexHash: response.headers.get('x-pdf-latex-hash') || '',
      pageCount: Number(response.headers.get('x-pdf-page-count') || '0') || 0,
      compiler: response.headers.get('x-latex-compiler') || '',
      cached: response.headers.get('x-pdf-cached') === 'true',
      contentType: response.headers.get('content-type') || '',
    },
  }
}

export async function fetchCurrentUser(getApiToken) {
  return (await request('/me', getApiToken)).user
}

export async function fetchWorkspaceContext(getApiToken) {
  return request('/me/context', getApiToken)
}

export async function uploadResume(getApiToken, file) {
  const formData = new FormData()
  formData.append('file', file)
  return (await request('/resumes/upload', getApiToken, { method: 'POST', body: formData })).resume
}

export async function createManualResume(getApiToken, resumeData) {
  return (
    await request('/resumes/manual', getApiToken, {
      method: 'POST',
      body: JSON.stringify({ label: resumeData.basics?.fullName || 'Manual resume', resumeData }),
    })
  ).resume
}

export async function updateResume(getApiToken, resumeId, resumeData) {
  return (
    await request(`/resumes/${resumeId}`, getApiToken, {
      method: 'PATCH',
      body: JSON.stringify({ resumeData }),
    })
  ).resume
}

export async function fetchResume(getApiToken, resumeId) {
  return (await request(`/resumes/${resumeId}`, getApiToken)).resume
}

export async function fetchResumeSourceFileBlob(getApiToken, resumeId) {
  return requestBlob(`/resumes/${resumeId}/source-file`, getApiToken)
}

export async function makeResumePrimary(getApiToken, resumeId) {
  return (await request(`/resumes/${resumeId}/primary`, getApiToken, { method: 'POST' })).resume
}

export async function deleteResume(getApiToken, resumeId) {
  return request(`/resumes/${resumeId}`, getApiToken, { method: 'DELETE' })
}

export async function createProject(getApiToken, project) {
  return (
    await request('/projects', getApiToken, {
      method: 'POST',
      body: JSON.stringify(project),
    })
  ).project
}

export async function selectProjectTemplate(getApiToken, projectId, templateId) {
  return (
    await request(`/projects/${projectId}/template`, getApiToken, {
      method: 'POST',
      body: JSON.stringify({ templateId }),
    })
  ).project
}

export async function sendProjectMessage(getApiToken, projectId, message) {
  return (
    await request(`/projects/${projectId}/messages`, getApiToken, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  ).project
}

export async function downloadProjectPdf(getApiToken, projectId) {
  return requestBlob(`/projects/${projectId}/download.pdf`, getApiToken)
}

export async function fetchProjectPreviewPdf(getApiToken, projectId) {
  return requestBlob(`/projects/${projectId}/preview.pdf`, getApiToken)
}

export async function fetchProjectPreviewPdfBlob(getApiToken, projectId) {
  return (await fetchProjectPreviewPdf(getApiToken, projectId)).blob
}

export async function fetchProjectVersions(getApiToken, projectId) {
  return (await request(`/projects/${projectId}/versions`, getApiToken)).versions
}

export async function fetchProjectVersion(getApiToken, projectId, versionId) {
  return (await request(`/projects/${projectId}/versions/${versionId}`, getApiToken)).version
}

export async function restoreProjectVersion(getApiToken, projectId, versionId) {
  return (await request(`/projects/${projectId}/versions/${versionId}/restore`, getApiToken, { method: 'POST' })).project
}

export async function deleteProject(getApiToken, projectId) {
  return request(`/projects/${projectId}`, getApiToken, { method: 'DELETE' })
}
