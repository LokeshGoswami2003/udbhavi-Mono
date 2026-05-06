import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthActions } from '../../auth/use-auth-actions'
import {
  createManualResume,
  createProject,
  deleteProject,
  deleteResume,
  downloadProjectPdf,
  fetchResume,
  fetchResumeSourceFileBlob,
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
import { ResumeContextEditor } from './ResumeContextEditor'
import { WorkspaceShell } from './WorkspaceShell'
import { LoginRequired, WorkspaceError, WorkspaceLoading } from './WorkspaceStatus'

const emptyList = []
const initialBusyState = {
  creatingProject: false,
  selectingTemplate: false,
  sendingMessage: false,
  loadingPreview: false,
  downloadingPdf: false,
  savingResume: false,
}

export function WorkspacePage() {
  const { isAuthenticated, isLoading } = useAuth0()
  const { getApiToken, login, logoutToHome } = useAuthActions()
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const [activeProjectId, setActiveProjectId] = useState('')
  const [showResumes, setShowResumes] = useState(false)
  const [draftResume, setDraftResume] = useState(null)
  const [reviewResume, setReviewResume] = useState(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [busy, setBusy] = useState(initialBusyState)
  const [actionError, setActionError] = useState('')
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

  async function runAction(actionName, action) {
    setBusy((current) => ({ ...current, [actionName]: true }))
    setActionError('')

    try {
      await action()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusy((current) => ({ ...current, [actionName]: false }))
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    runAction('savingResume', async () => {
      await uploadResume(getApiToken, file)
      setDraftResume(null)
      loadContext()
    })
  }

  function handleManual(resumeData) {
    runAction('savingResume', async () => {
      const resume = await createManualResume(getApiToken, resumeData)
      setDraftResume(resume)
      loadContext()
    })
  }

  function handleSaveResume(resumeData) {
    const targetResume = reviewResume || draftResume
    if (!targetResume) {
      return
    }

    runAction('savingResume', async () => {
      const updated = await updateResume(getApiToken, targetResume.id, resumeData)
      if (reviewResume) {
        setReviewResume(updated)
      }
      setDraftResume(null)
      if (!reviewResume) {
        setShowResumes(false)
      }
      loadContext()
    })
  }

  function handleOpenResume(resumeId) {
    runAction('savingResume', async () => {
      const resume = await fetchResume(getApiToken, resumeId)
      setReviewResume(resume)
      setShowResumes(false)
    })
  }

  function handleCreateProject(project) {
    runAction('creatingProject', async () => {
      const created = await createProject(getApiToken, {
        ...project,
        primaryResumeId: primaryResume?.id,
      })
      setActiveProjectId(created.id)
      setShowResumes(false)
      setShowProjectDialog(false)
      setState((current) => ({
        ...current,
        data: current.data ? { ...current.data, projects: [created, ...(current.data.projects || [])] } : current.data,
      }))
    })
  }

  function handleDeleteProject(projectId) {
    if (!window.confirm('Delete this project?')) {
      return
    }

    runAction('creatingProject', async () => {
      await deleteProject(getApiToken, projectId)
      if (activeProjectId === projectId) {
        setActiveProjectId('')
      }
      setState((current) => ({
        ...current,
        data: current.data
          ? { ...current.data, projects: (current.data.projects || []).filter((project) => project.id !== projectId) }
          : current.data,
      }))
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

    runAction('selectingTemplate', async () => {
      const project = await selectProjectTemplate(getApiToken, projectId, templateId)
      updateProjectInState(projectId, () => project)
    })
  }

  function handleProjectMessage(projectId, message) {
    if (busy.sendingMessage) {
      return
    }

    const optimisticMessage = {
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      metadata: { optimistic: true },
    }

    updateProjectInState(projectId, (project) => ({
      ...project,
      ai: {
        ...(project.ai || {}),
        messages: [...(project.ai?.messages || []), optimisticMessage],
      },
    }))

    runAction('sendingMessage', async () => {
      const updatedProject = await sendProjectMessage(getApiToken, projectId, message)
      updateProjectInState(projectId, () => updatedProject)
    })
  }

  function handleProjectPdf(projectId) {
    runAction('downloadingPdf', async () => {
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
    async (projectId) => {
      setBusy((current) => ({ ...current, loadingPreview: true }))

      try {
        return await fetchProjectPreviewPdfBlob(getApiToken, projectId)
      } finally {
        setBusy((current) => ({ ...current, loadingPreview: false }))
      }
    },
    [getApiToken],
  )

  const handleResumeSourceFile = useCallback(
    async (resumeId) => fetchResumeSourceFileBlob(getApiToken, resumeId),
    [getApiToken],
  )

  function handlePrimaryResume(resumeId) {
    runAction('savingResume', async () => {
      await makeResumePrimary(getApiToken, resumeId)
      loadContext()
    })
  }

  function handleDeleteResume(resumeId) {
    if (!window.confirm('Delete this resume from your workspace?')) {
      return
    }

    runAction('savingResume', async () => {
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
        setReviewResume(null)
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

      {reviewResume ? (
        <ResumeContextEditor
          resume={reviewResume}
          busy={busy.savingResume}
          onBack={() => {
            setReviewResume(null)
            setShowResumes(true)
          }}
          onChange={(resumeData) => setReviewResume((resume) => ({ ...resume, resumeData }))}
          onSave={handleSaveResume}
          onMakePrimary={handlePrimaryResume}
          onDelete={handleDeleteResume}
          onLoadSourceFile={handleResumeSourceFile}
        />
      ) : needsOnboarding ? (
        <OnboardingFlow
          resume={draftResume}
          busy={busy.savingResume}
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
          onOpenResume={handleOpenResume}
        />
      ) : (
        <ProjectWorkspace
          project={activeProject}
          busy={busy}
          onSelectTemplate={handleTemplateSelect}
          onSendMessage={handleProjectMessage}
          onDownloadPdf={handleProjectPdf}
          onLoadPreviewPdf={handleProjectPreviewPdf}
        />
      )}

      {showProjectDialog ? (
        <ProjectDialog busy={busy.creatingProject} onClose={() => setShowProjectDialog(false)} onSubmit={handleCreateProject} />
      ) : null}
    </WorkspaceShell>
  )
}
