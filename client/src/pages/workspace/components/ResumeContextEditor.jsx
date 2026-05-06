import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Star, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { fetchResume, fetchResumeSourceFileBlob } from '../../../api/api-client'
import { normalizeResumeData } from '../resume-form'
import { PdfViewer } from './PdfViewer'

export function ResumeContextEditor({
  resume: initialResume,
  busy,
  getApiToken,
  onClose,
  onSave,
  onMakePrimary,
  onDelete,
}) {
  const [resume, setResume] = useState(initialResume)
  const [draft, setDraft] = useState(() => normalizeResumeData(initialResume?.resumeData))
  const [loadingResume, setLoadingResume] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!initialResume?.id) return undefined
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoadingResume(true)
      setLoadError('')
      fetchResume(getApiToken, initialResume.id)
        .then((full) => {
          if (!active) return
          setResume(full)
          setDraft(normalizeResumeData(full.resumeData))
        })
        .catch((error) => {
          if (active) {
            setLoadError(error?.message || 'Failed to load resume detail.')
          }
        })
        .finally(() => {
          if (active) setLoadingResume(false)
        })
    })
    return () => {
      active = false
    }
  }, [getApiToken, initialResume?.id])

  const isPdf = resume?.file?.mimeType === 'application/pdf'
  const fileId = resume?.file?.fileId
  const resumeId = resume?.id
  const loadSource = useCallback(async () => {
    if (!fileId || !isPdf) return null
    return fetchResumeSourceFileBlob(getApiToken, resumeId)
  }, [getApiToken, fileId, resumeId, isPdf])

  function handleSave() {
    onSave(resume.id, draft)
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Button as="button" type="button" variant="ghost" className="px-2" onClick={onClose}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Button>
          <div>
            <p className="text-xs font-black uppercase text-blue-600 dark:text-blue-300">Resume context</p>
            <h1 className="truncate text-lg font-black">{resume?.label || 'Resume'}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resume?.isPrimary ? (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              Primary
            </span>
          ) : (
            <Button as="button" type="button" variant="secondary" className="min-h-9 px-3 py-2 text-xs" onClick={() => onMakePrimary(resume.id)}>
              <Star size={13} aria-hidden="true" />
              Make primary
            </Button>
          )}
          <Button as="button" type="button" variant="ghost" className="min-h-9 px-3 py-2 text-xs" onClick={() => onDelete(resume.id)}>
            <Trash2 size={13} aria-hidden="true" />
            Delete
          </Button>
          <Button as="button" type="button" variant="accent" onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
            Save changes
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-hidden border-b border-slate-200 dark:border-white/10 lg:border-b-0 lg:border-r">
          {isPdf ? (
            <PdfViewer
              title={resume?.file?.originalName || 'Original resume'}
              loadPdf={loadSource}
              reloadKey={`${resume?.id || ''}:${resume?.updatedAt || ''}`}
            />
          ) : resume?.file?.originalName ? (
            <DocxFallback resume={resume} />
          ) : (
            <div className="grid h-full place-items-center bg-slate-100 p-6 text-center text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300">
              <p>This resume was entered manually. There is no original file to preview.</p>
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto bg-white p-5 dark:bg-slate-950">
          {loadingResume ? (
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Loader2 className="animate-spin" size={15} aria-hidden="true" />
              Loading resume...
            </div>
          ) : null}
          {loadError ? <p className="mb-3 rounded-md bg-red-50 p-2 text-sm font-bold text-red-700">{loadError}</p> : null}
          <ExtractionSummary resume={resume} />
          <ResumeEditor data={draft} onChange={setDraft} />
        </div>
      </div>
    </section>
  )
}

function DocxFallback({ resume }) {
  return (
    <div className="grid h-full place-items-center bg-slate-100 p-6 text-center text-sm font-bold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
      <div>
        <p>{resume.file.originalName}</p>
        <p className="mt-2 text-xs font-bold text-slate-500">DOCX preview is not rendered inline. The extracted data on the right reflects the parsed contents.</p>
      </div>
    </div>
  )
}

function ExtractionSummary({ resume }) {
  const quality = resume?.extraction?.extractionQuality
  if (!quality) return null
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:grid-cols-4">
      <Stat label="Raw text" value={`${quality.rawTextChars || 0} chars`} />
      <Stat label="Visible links" value={String(quality.visibleLinkCount || 0)} />
      <Stat label="Embedded links" value={String(quality.embeddedLinkCount || 0)} />
      <Stat label="Total" value={String(quality.totalLinkCount || 0)} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  )
}

function ResumeEditor({ data, onChange }) {
  function update(path, value) {
    onChange({ ...data, ...path === '__root__' ? value : { [path]: value } })
  }

  function updateBasics(field, value) {
    onChange({
      ...data,
      basics: { ...data.basics, [field]: value },
    })
  }

  return (
    <div className="grid gap-5">
      <Section title="Basics">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['fullName', 'Full name'],
            ['headline', 'Headline'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['location', 'Location'],
            ['linkedin', 'LinkedIn'],
            ['github', 'GitHub'],
            ['portfolio', 'Portfolio'],
            ['website', 'Website'],
          ].map(([field, label]) => (
            <Field key={field} label={label}>
              <input
                value={data.basics[field] || ''}
                onChange={(event) => updateBasics(field, event.target.value)}
                className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
              />
            </Field>
          ))}
        </div>
        <Field label="Summary">
          <textarea
            value={data.basics.summary || ''}
            onChange={(event) => updateBasics('summary', event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
          />
        </Field>
      </Section>

      <Section title="Skills">
        {data.skills.map((skill, index) => (
          <SkillRow
            key={index}
            skill={skill}
            onChange={(next) => {
              const skills = [...data.skills]
              skills[index] = next
              update('skills', skills)
            }}
            onRemove={() => {
              const skills = data.skills.filter((_, i) => i !== index)
              update('skills', skills)
            }}
          />
        ))}
        <button
          type="button"
          className="text-xs font-black text-blue-600 hover:underline"
          onClick={() => update('skills', [...data.skills, { category: '', items: [] }])}
        >
          + Add skill group
        </button>
      </Section>

      <Section title="Experience">
        {data.experience.map((entry, index) => (
          <ExperienceRow
            key={index}
            entry={entry}
            onChange={(next) => {
              const list = [...data.experience]
              list[index] = next
              update('experience', list)
            }}
            onRemove={() => update('experience', data.experience.filter((_, i) => i !== index))}
          />
        ))}
        <button
          type="button"
          className="text-xs font-black text-blue-600 hover:underline"
          onClick={() =>
            update('experience', [...data.experience, { company: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: [], technologies: [] }])
          }
        >
          + Add experience
        </button>
      </Section>

      <Section title="Projects">
        {data.projects.map((project, index) => (
          <ProjectRow
            key={index}
            project={project}
            onChange={(next) => {
              const list = [...data.projects]
              list[index] = next
              update('projects', list)
            }}
            onRemove={() => update('projects', data.projects.filter((_, i) => i !== index))}
          />
        ))}
        <button
          type="button"
          className="text-xs font-black text-blue-600 hover:underline"
          onClick={() => update('projects', [...data.projects, { name: '', description: '', url: '', links: [], bullets: [], technologies: [] }])}
        >
          + Add project
        </button>
      </Section>

      <Section title="Education">
        {data.education.map((entry, index) => (
          <EducationRow
            key={index}
            entry={entry}
            onChange={(next) => {
              const list = [...data.education]
              list[index] = next
              update('education', list)
            }}
            onRemove={() => update('education', data.education.filter((_, i) => i !== index))}
          />
        ))}
        <button
          type="button"
          className="text-xs font-black text-blue-600 hover:underline"
          onClick={() => update('education', [...data.education, { institution: '', degree: '', field: '', location: '', startDate: '', endDate: '', gpa: '', bullets: [] }])}
        >
          + Add education
        </button>
      </Section>

      <Section title="Achievements & Certifications">
        {data.certifications.map((entry, index) => (
          <CertRow
            key={index}
            entry={entry}
            onChange={(next) => {
              const list = [...data.certifications]
              list[index] = next
              update('certifications', list)
            }}
            onRemove={() => update('certifications', data.certifications.filter((_, i) => i !== index))}
          />
        ))}
        <button
          type="button"
          className="text-xs font-black text-blue-600 hover:underline"
          onClick={() => update('certifications', [...data.certifications, { name: '', issuer: '', date: '', url: '' }])}
        >
          + Add achievement
        </button>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{title}</h3>
      <div className="mt-2 grid gap-3">{children}</div>
    </section>
  )
}

function Field({ label, children, hint }) {
  return (
    <label className="block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
      {children}
      {hint ? <p className="mt-1 text-[11px] font-bold text-slate-400">{hint}</p> : null}
    </label>
  )
}

function inputClass() {
  return 'mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950'
}

function textareaClass() {
  return 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950'
}

function SkillRow({ skill, onChange, onRemove }) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
      <Field label="Category">
        <input className={inputClass()} value={skill.category} onChange={(event) => onChange({ ...skill, category: event.target.value })} />
      </Field>
      <Field label="Items (comma separated)">
        <input
          className={inputClass()}
          value={(skill.items || []).join(', ')}
          onChange={(event) => onChange({ ...skill, items: event.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      </Field>
      <RemoveButton onClick={onRemove} />
    </div>
  )
}

function ExperienceRow({ entry, onChange, onRemove }) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Role">
          <input className={inputClass()} value={entry.role} onChange={(event) => onChange({ ...entry, role: event.target.value })} />
        </Field>
        <Field label="Company">
          <input className={inputClass()} value={entry.company} onChange={(event) => onChange({ ...entry, company: event.target.value })} />
        </Field>
        <Field label="Location">
          <input className={inputClass()} value={entry.location} onChange={(event) => onChange({ ...entry, location: event.target.value })} />
        </Field>
        <Field label="Dates (start – end)">
          <div className="mt-1 flex gap-2">
            <input className={inputClass().replace('mt-1', '')} placeholder="Jan 2026" value={entry.startDate || ''} onChange={(event) => onChange({ ...entry, startDate: event.target.value })} />
            <input className={inputClass().replace('mt-1', '')} placeholder="Present" value={entry.endDate || ''} onChange={(event) => onChange({ ...entry, endDate: event.target.value })} />
          </div>
        </Field>
      </div>
      <Field label="Bullets (one per line)">
        <textarea
          className={textareaClass()}
          rows={3}
          value={(entry.bullets || []).join('\n')}
          onChange={(event) => onChange({ ...entry, bullets: event.target.value.split('\n').map((b) => b.trim()).filter(Boolean) })}
        />
      </Field>
      <div className="flex justify-end">
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  )
}

function ProjectRow({ project, onChange, onRemove }) {
  function updateLink(index, next) {
    const links = [...(project.links || [])]
    links[index] = next
    onChange({ ...project, links })
  }

  function removeLink(index) {
    const links = (project.links || []).filter((_, i) => i !== index)
    onChange({ ...project, links })
  }

  function addLink() {
    onChange({ ...project, links: [...(project.links || []), { label: '', url: '', type: 'other' }] })
  }

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputClass()} value={project.name} onChange={(event) => onChange({ ...project, name: event.target.value })} />
        </Field>
        <Field label="Tech (comma separated)">
          <input
            className={inputClass()}
            value={(project.technologies || []).join(', ')}
            onChange={(event) => onChange({ ...project, technologies: event.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea className={textareaClass()} rows={2} value={project.description || ''} onChange={(event) => onChange({ ...project, description: event.target.value })} />
      </Field>
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Links</p>
        <div className="mt-2 grid gap-2">
          {(project.links || []).map((link, index) => (
            <div key={index} className="grid gap-2 rounded-md border border-slate-200 p-2 dark:border-white/10 sm:grid-cols-[140px_minmax(0,1fr)_120px_auto]">
              <input className={inputClass().replace('mt-1', '')} placeholder="Label (GitHub)" value={link.label || ''} onChange={(event) => updateLink(index, { ...link, label: event.target.value })} />
              <input className={inputClass().replace('mt-1', '')} placeholder="https://..." value={link.url || ''} onChange={(event) => updateLink(index, { ...link, url: event.target.value })} />
              <select className={inputClass().replace('mt-1', '')} value={link.type || 'other'} onChange={(event) => updateLink(index, { ...link, type: event.target.value })}>
                <option value="repo">repo</option>
                <option value="video">video</option>
                <option value="live">live</option>
                <option value="snapshot">snapshot</option>
                <option value="certificate">certificate</option>
                <option value="portfolio">portfolio</option>
                <option value="other">other</option>
              </select>
              <div className="flex items-center gap-1">
                {link.url ? (
                  <a className="rounded-md p-2 text-slate-400 hover:text-blue-600" href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Open link">
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}
                <RemoveButton onClick={() => removeLink(index)} small />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-xs font-black text-blue-600 hover:underline" onClick={addLink}>
          + Add link
        </button>
      </div>
      <Field label="Bullets (one per line)">
        <textarea
          className={textareaClass()}
          rows={3}
          value={(project.bullets || []).join('\n')}
          onChange={(event) => onChange({ ...project, bullets: event.target.value.split('\n').map((b) => b.trim()).filter(Boolean) })}
        />
      </Field>
      <div className="flex justify-end">
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  )
}

function EducationRow({ entry, onChange, onRemove }) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Institution">
          <input className={inputClass()} value={entry.institution} onChange={(event) => onChange({ ...entry, institution: event.target.value })} />
        </Field>
        <Field label="Degree">
          <input className={inputClass()} value={entry.degree} onChange={(event) => onChange({ ...entry, degree: event.target.value })} />
        </Field>
        <Field label="Location">
          <input className={inputClass()} value={entry.location} onChange={(event) => onChange({ ...entry, location: event.target.value })} />
        </Field>
        <Field label="End">
          <input className={inputClass()} value={entry.endDate} onChange={(event) => onChange({ ...entry, endDate: event.target.value })} />
        </Field>
      </div>
      <div className="flex justify-end">
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  )
}

function CertRow({ entry, onChange, onRemove }) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
      <Field label="Title">
        <input className={inputClass()} value={entry.name || entry.title || ''} onChange={(event) => onChange({ ...entry, name: event.target.value })} />
      </Field>
      <Field label="Issuer">
        <input className={inputClass()} value={entry.issuer || ''} onChange={(event) => onChange({ ...entry, issuer: event.target.value })} />
      </Field>
      <Field label="Date">
        <input className={inputClass()} value={entry.date || ''} onChange={(event) => onChange({ ...entry, date: event.target.value })} />
      </Field>
      <RemoveButton onClick={onRemove} />
    </div>
  )
}

function RemoveButton({ onClick, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 ${small ? 'p-2' : 'min-h-9 px-2.5 py-2 text-xs font-black'}`}
      aria-label="Remove"
    >
      <Trash2 size={small ? 13 : 13} aria-hidden="true" />
      {small ? null : 'Remove'}
    </button>
  )
}
