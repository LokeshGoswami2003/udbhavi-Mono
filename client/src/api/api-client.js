const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? 'http://localhost:4000/api/v1'

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

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message || 'The workspace could not complete that action. Please try again.')
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

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error?.message || 'The file could not be prepared. Please try again.')
  }

  return {
    blob: await response.blob(),
    filename: response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'resume.pdf',
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

export async function fetchProjectPreviewPdfBlob(getApiToken, projectId) {
  return (await requestBlob(`/projects/${projectId}/preview.pdf`, getApiToken)).blob
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
