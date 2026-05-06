import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthActions } from '../../auth/use-auth-actions'
import {
  createManualResume,
  createProject,
  deleteProject,
  deleteResume,
  downloadProjectPdf,
  fetchProjectPreviewPdfBlob,
  fetchWorkspaceContext,
  makeResumePrimary,
  selectProjectTemplate,
  sendProjectMessage,
  updateResume,
  uploadResume,
} from '../../api/api-client'
import { DashboardView } from './DashboardView'
import { OnboardingFlow } from './OnboardingFlow'
import { ProjectDialog } from './ProjectDialog'
import { ProjectWorkspace } from './ProjectWorkspace'
import { WorkspaceShell } from './WorkspaceShell'
import { LoginRequired, WorkspaceError, WorkspaceLoading } from './WorkspaceStatus'

const emptyList = []

export function WorkspacePage() {
  const { isAuthenticated, isLoading } = useAuth0()
  const { getApiToken, login, logoutToHome } = useAuthActions()
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const [activeProjectId, setActiveProjectId] = useState('')
  const [showResumes, setShowResumes] = useState(false)
  const [draftResume, setDraftResume] = useState(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [pendingChatMessage, setPendingChatMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const loadContext = useCallback(() => {
    setState((current) => ({ status: 'loading', data: current.data, error: '' }))
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let isActive = true

    fetchWorkspaceContext(getApiToken)
      .then((data) => {
        if (isActive) {
          setState({ status: 'ready', data, error: '' })
        }
      })
      .catch((error) => {
        if (isActive) {
          setState({ status: 'error', data: null, error: error.message })
        }
      })

    return () => {
      isActive = false
    }
  }, [getApiToken, isAuthenticated, reloadKey])

  const resumes = state.data?.resumes || emptyList
  const projects = state.data?.projects || emptyList
  const primaryResume = useMemo(() => resumes.find((resume) => resume.isPrimary), [resumes])
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || projects[0] || null,
    [activeProjectId, projects],
  )
  const needsOnboarding = !resumes.length || draftResume

  async function runAction(action) {
    setBusy(true)
    setActionError('')

    try {
      await action()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusy(false)
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    runAction(async () => {
      await uploadResume(getApiToken, file)
      setDraftResume(null)
      loadContext()
    })
  }

  function handleManual(resumeData) {
    runAction(async () => {
      const resume = await createManualResume(getApiToken, resumeData)
      setDraftResume(resume)
      loadContext()
    })
  }

  function handleSaveResume(resumeData) {
    if (!draftResume) {
      return
    }

    runAction(async () => {
      await updateResume(getApiToken, draftResume.id, resumeData)
      setDraftResume(null)
      setShowResumes(false)
      loadContext()
    })
  }

  function handleCreateProject(project) {
    runAction(async () => {
      const created = await createProject(getApiToken, {
        ...project,
        primaryResumeId: primaryResume?.id,
      })
      setActiveProjectId(created.id)
      setShowResumes(false)
      setShowProjectDialog(false)
      loadContext()
    })
  }

  function handleDeleteProject(projectId) {
    if (!window.confirm('Delete this project?')) {
      return
    }

    runAction(async () => {
      await deleteProject(getApiToken, projectId)
      if (activeProjectId === projectId) {
        setActiveProjectId('')
      }
      loadContext()
    })
  }

  function updateProjectInState(projectId, updater) {
    setState((current) => {
      if (!current.data?.projects) {
        return current
      }

      return {
        ...current,
        data: {
          ...current.data,
          projects: current.data.projects.map((project) => (project.id === projectId ? updater(project) : project)),
        },
      }
    })
  }

  function handleTemplateSelect(projectId, templateId) {
    updateProjectInState(projectId, (project) => ({
      ...project,
      templateId,
      status: 'processing',
      ai: {
        ...(project.ai || {}),
        feedback: [],
        messages: project.ai?.messages || [],
      },
    }))

    runAction(async () => {
      const project = await selectProjectTemplate(getApiToken, projectId, templateId)
      updateProjectInState(projectId, () => project)
      loadContext()
    })
  }

  function handleProjectMessage(projectId, message) {
    setPendingChatMessage(message)
    runAction(async () => {
      await sendProjectMessage(getApiToken, projectId, message)
      loadContext()
    }).finally(() => setPendingChatMessage(''))
  }

  function handleProjectPdf(projectId) {
    runAction(async () => {
      const { blob, filename } = await downloadProjectPdf(getApiToken, projectId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    })
  }

  const handleProjectPreviewPdf = useCallback(
    (projectId) => fetchProjectPreviewPdfBlob(getApiToken, projectId),
    [getApiToken],
  )

  function handlePrimaryResume(resumeId) {
    runAction(async () => {
      await makeResumePrimary(getApiToken, resumeId)
      loadContext()
    })
  }

  function handleDeleteResume(resumeId) {
    if (!window.confirm('Delete this resume from your workspace?')) {
      return
    }

    runAction(async () => {
      await deleteResume(getApiToken, resumeId)
      setDraftResume(null)
      loadContext()
    })
  }

  if (isLoading || (isAuthenticated && state.status === 'loading' && !state.data)) {
    return <WorkspaceLoading />
  }

  if (!isAuthenticated) {
    return <LoginRequired onLogin={() => login('/app')} />
  }

  if (state.status === 'error') {
    return <WorkspaceError error={state.error} onRetry={loadContext} onLogout={logoutToHome} />
  }

  return (
    <WorkspaceShell
      account={state.data?.user}
      projects={projects}
      activeProjectId={activeProject?.id}
      onProjectSelect={(projectId) => {
        setActiveProjectId(projectId)
        setShowResumes(false)
      }}
      onNewProject={() => setShowProjectDialog(true)}
      onDeleteProject={handleDeleteProject}
      onShowResumes={() => setShowResumes(true)}
      onLogout={logoutToHome}
    >
      {actionError ? (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-200">
          {actionError}
        </p>
      ) : null}

      {needsOnboarding ? (
        <OnboardingFlow
          resume={draftResume}
          busy={busy}
          error={actionError}
          onUpload={handleUpload}
          onManual={handleManual}
          onResumeChange={(resumeData) => setDraftResume((resume) => ({ ...resume, resumeData }))}
          onSave={handleSaveResume}
        />
      ) : showResumes ? (
        <DashboardView
          view="resumes"
          resumes={resumes}
          projects={[]}
          onCreateProject={() => setShowProjectDialog(true)}
          onDeleteProject={handleDeleteProject}
          onPrimaryResume={handlePrimaryResume}
          onDeleteResume={handleDeleteResume}
        />
      ) : (
        <ProjectWorkspace
          project={activeProject}
          busy={busy}
          pendingMessage={pendingChatMessage}
          onSelectTemplate={handleTemplateSelect}
          onSendMessage={handleProjectMessage}
          onDownloadPdf={handleProjectPdf}
          onLoadPreviewPdf={handleProjectPreviewPdf}
        />
      )}

      {showProjectDialog ? (
        <ProjectDialog busy={busy} onClose={() => setShowProjectDialog(false)} onSubmit={handleCreateProject} />
      ) : null}
    </WorkspaceShell>
  )
}
