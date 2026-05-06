import { ChevronLeft, ChevronRight, Download, Loader2, RefreshCw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const zoomSteps = [0.65, 0.8, 1, 1.2, 1.45, 1.75, 2.1]

export function PdfViewer({ title, loadPdf, reloadKey, busyLabel = 'Loading PDF...', onDownload, className = '' }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const renderTaskRef = useRef(null)
  const pdfRef = useRef(null)
  const loadPdfRef = useRef(loadPdf)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [fitScale, setFitScale] = useState(1)
  const [zoomIndex, setZoomIndex] = useState(2)
  const [headers, setHeaders] = useState({})

  const zoom = zoomSteps[zoomIndex] || 1
  const scale = fitScale * zoom
  const hasPdf = Boolean(pdfDoc)
  const isLoading = status === 'loading'

  useEffect(() => {
    loadPdfRef.current = loadPdf
  }, [loadPdf])

  const cleanupPdf = useCallback(async () => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }
    if (pdfRef.current) {
      await pdfRef.current.destroy().catch(() => undefined)
      pdfRef.current = null
    }
  }, [])

  const refresh = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const result = await loadPdfRef.current()
      const blob = result?.blob instanceof Blob ? result.blob : result
      if (!(blob instanceof Blob) || !blob.size) {
        throw new Error('The PDF preview is empty.')
      }

      const bytes = await blob.arrayBuffer()
      await cleanupPdf()
      const loadingTask = pdfjsLib.getDocument({ data: bytes })
      const nextPdf = await loadingTask.promise
      pdfRef.current = nextPdf
      setPdfDoc(nextPdf)
      setPageCount(nextPdf.numPages || Number(result?.headers?.pageCount) || 1)
      setPageNumber(1)
      setHeaders(result?.headers || {})
      setStatus('ready')
    } catch (loadError) {
      setStatus('error')
      setError(loadError.message || 'Could not load the PDF preview.')
    }
  }, [cleanupPdf])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        refresh()
      }
    })

    return () => {
      cancelled = true
    }
  }, [refresh, reloadKey])

  useEffect(() => {
    return () => {
      cleanupPdf()
    }
  }, [cleanupPdf])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !pdfDoc) return undefined

    const observer = new ResizeObserver(async ([entry]) => {
      const page = await pdfDoc.getPage(pageNumber).catch(() => null)
      if (!page) return
      const viewport = page.getViewport({ scale: 1 })
      const nextWidth = Math.max(260, entry.contentRect.width - 48)
      setFitScale(Math.max(0.2, Math.min(2, nextWidth / viewport.width)))
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [pdfDoc, pageNumber])

  useEffect(() => {
    let isActive = true

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      const page = await pdfDoc.getPage(pageNumber)
      if (!isActive) return

      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      const pixelRatio = window.devicePixelRatio || 1

      canvas.width = Math.floor(viewport.width * pixelRatio)
      canvas.height = Math.floor(viewport.height * pixelRatio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, viewport.width, viewport.height)

      const task = page.render({ canvasContext: context, viewport })
      renderTaskRef.current = task
      await task.promise.catch((renderError) => {
        if (renderError?.name !== 'RenderingCancelledException') {
          throw renderError
        }
      })
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null
      }
    }

    renderPage().catch((renderError) => {
      if (isActive) {
        setStatus('error')
        setError(renderError.message || 'Could not render this PDF page.')
      }
    })

    return () => {
      isActive = false
    }
  }, [pdfDoc, pageNumber, scale])

  return (
    <section className={`grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[#111827] ${className}`}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[#293241] px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{title}</p>
          {headers.latexHash ? <p className="text-[10px] font-bold uppercase text-slate-400">{headers.latexHash.slice(0, 10)}...</p> : null}
        </div>

        <div className="flex items-center gap-1.5 text-white">
          <ToolbarButton label="Previous page" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={!hasPdf || pageNumber <= 1}>
            <ChevronLeft size={16} />
          </ToolbarButton>
          <span className="min-w-16 text-center text-xs font-black text-slate-200">{pageNumber} / {pageCount || 1}</span>
          <ToolbarButton label="Next page" onClick={() => setPageNumber((page) => Math.min(pageCount || 1, page + 1))} disabled={!hasPdf || pageNumber >= pageCount}>
            <ChevronRight size={16} />
          </ToolbarButton>
          <div className="mx-1 h-6 w-px bg-white/10" />
          <ToolbarButton label="Zoom out" onClick={() => setZoomIndex((index) => Math.max(0, index - 1))} disabled={!hasPdf || zoomIndex === 0}>
            <ZoomOut size={16} />
          </ToolbarButton>
          <span className="min-w-12 text-center text-xs font-black text-slate-200">{Math.round(zoom * 100)}%</span>
          <ToolbarButton label="Zoom in" onClick={() => setZoomIndex((index) => Math.min(zoomSteps.length - 1, index + 1))} disabled={!hasPdf || zoomIndex === zoomSteps.length - 1}>
            <ZoomIn size={16} />
          </ToolbarButton>
          <ToolbarButton label="Fit width" onClick={() => setZoomIndex(2)} disabled={!hasPdf}>
            <RotateCw size={16} />
          </ToolbarButton>
          <ToolbarButton label="Reload preview" onClick={refresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          </ToolbarButton>
          {onDownload ? (
            <ToolbarButton label="Download PDF" onClick={onDownload} disabled={isLoading}>
              <Download size={16} />
            </ToolbarButton>
          ) : null}
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-0 overflow-auto bg-[#1f2937] p-4">
        {hasPdf ? (
          <div className="grid min-h-full place-items-start justify-center py-4">
            <canvas ref={canvasRef} className="bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]" />
          </div>
        ) : null}

        {isLoading && hasPdf ? (
          <div className="absolute right-5 top-5 flex items-center gap-2 rounded-md bg-slate-950/85 px-3 py-2 text-xs font-black text-white shadow-lg">
            <Loader2 className="animate-spin" size={14} />
            {busyLabel}
          </div>
        ) : null}

        {!hasPdf ? (
          <div className="grid h-full min-h-[420px] place-items-center rounded-md bg-slate-950 p-8 text-center text-sm font-bold text-slate-200">
            {status === 'error' ? (
              <div className="max-w-md">
                <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</p>
                <button type="button" onClick={refresh} className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-black text-slate-950">
                  Retry
                </button>
              </div>
            ) : (
              <div>
                <Loader2 className="mx-auto mb-3 animate-spin text-blue-300" size={22} />
                <p>{busyLabel}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ToolbarButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-md text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
