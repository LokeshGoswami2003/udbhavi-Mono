import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
}

const ZOOM_STEP = 0.15
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3

export function PdfViewer({
  title = 'PDF preview',
  loadPdf,
  reloadKey,
  busyLabel,
  onDownload,
  className = '',
  showToolbar = true,
  emptyState,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const renderTaskRef = useRef(null)
  const documentRef = useRef(null)
  const objectUrlRef = useRef('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [scale, setScale] = useState(0)
  const [fitWidth, setFitWidth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [containerWidth, setContainerWidth] = useState(0)

  const loadDocument = useCallback(async () => {
    if (!loadPdf) return
    setLoading(true)
    setError('')
    try {
      const result = await loadPdf()
      const blob = result?.blob || result
      if (!blob) {
        setLoading(false)
        return
      }
      const buffer = await blob.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: buffer })
      const pdf = await loadingTask.promise
      if (documentRef.current) {
        try {
          documentRef.current.destroy()
        } catch {
          // ignore
        }
      }
      documentRef.current = pdf
      setPageCount(pdf.numPages)
      setPageNumber((current) => Math.min(current || 1, pdf.numPages))
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      objectUrlRef.current = URL.createObjectURL(blob)
    } catch (loadError) {
      setError(loadError?.message || 'Could not load PDF.')
    } finally {
      setLoading(false)
    }
  }, [loadPdf])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (cancelled) return
      await loadDocument()
    }
    queueMicrotask(run)
    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
      }
      if (documentRef.current) {
        try {
          documentRef.current.destroy()
        } catch {
          // ignore
        }
        documentRef.current = null
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width
      if (width) {
        setContainerWidth(width)
      }
    })
    observer.observe(node)
    setContainerWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function renderPage() {
      const pdf = documentRef.current
      const canvas = canvasRef.current
      if (!pdf || !canvas) return
      const target = Math.max(1, Math.min(pageNumber, pdf.numPages))
      try {
        const page = await pdf.getPage(target)
        const baseViewport = page.getViewport({ scale: 1 })
        const innerWidth = Math.max(120, containerWidth - 32)
        const fitScale = innerWidth / baseViewport.width
        const finalScale = fitWidth ? fitScale : (scale || fitScale)
        const viewport = page.getViewport({ scale: finalScale })
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.ceil(viewport.width * dpr)
        canvas.height = Math.ceil(viewport.height * dpr)
        canvas.style.width = `${Math.ceil(viewport.width)}px`
        canvas.style.height = `${Math.ceil(viewport.height)}px`
        const context = canvas.getContext('2d')
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {
            // ignore
          }
        }
        const task = page.render({ canvasContext: context, viewport })
        renderTaskRef.current = task
        await task.promise
        if (cancelled) return
        if (fitWidth && !scale) {
          setScale(fitScale)
        }
      } catch (renderError) {
        if (renderError?.name === 'RenderingCancelledException') return
        if (!cancelled) {
          setError(renderError?.message || 'Could not render page.')
        }
      }
    }
    renderPage()
    return () => {
      cancelled = true
    }
  }, [pageNumber, scale, fitWidth, containerWidth, pageCount])

  const zoomIn = () => {
    setFitWidth(false)
    setScale((current) => Math.min(MAX_ZOOM, (current || 1) + ZOOM_STEP))
  }
  const zoomOut = () => {
    setFitWidth(false)
    setScale((current) => Math.max(MIN_ZOOM, (current || 1) - ZOOM_STEP))
  }
  const fitToWidth = () => {
    setFitWidth(true)
  }
  const goPrev = () => setPageNumber((current) => Math.max(1, current - 1))
  const goNext = () => setPageNumber((current) => Math.min(pageCount || 1, current + 1))

  const headerLabel = useMemo(() => {
    if (busyLabel) return busyLabel
    if (loading) return 'Loading PDF...'
    if (error) return 'Failed'
    if (!pageCount) return 'No PDF'
    return `Page ${pageNumber} of ${pageCount}`
  }, [busyLabel, loading, error, pageCount, pageNumber])

  return (
    <div className={`grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#1f2937] ${className}`}>
      {showToolbar ? (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[#293241] px-3 text-white">
          <div className="flex min-w-0 items-center gap-2 truncate text-sm font-black">
            <span className="truncate">{title}</span>
            <span className="hidden rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-200 sm:inline-block">
              {headerLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={goPrev} disabled={pageNumber <= 1} ariaLabel="Previous page">
              <ChevronLeft size={15} aria-hidden="true" />
            </ToolbarButton>
            <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-200">
              {pageCount ? `${pageNumber} / ${pageCount}` : '—'}
            </span>
            <ToolbarButton onClick={goNext} disabled={!pageCount || pageNumber >= pageCount} ariaLabel="Next page">
              <ChevronRight size={15} aria-hidden="true" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
            <ToolbarButton onClick={zoomOut} ariaLabel="Zoom out">
              <ZoomOut size={15} aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton onClick={fitToWidth} ariaLabel="Fit to width" active={fitWidth}>
              <Maximize2 size={15} aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton onClick={zoomIn} ariaLabel="Zoom in">
              <ZoomIn size={15} aria-hidden="true" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
            <ToolbarButton onClick={loadDocument} ariaLabel="Reload PDF">
              <RefreshCw size={15} aria-hidden="true" />
            </ToolbarButton>
            {onDownload ? (
              <ToolbarButton onClick={onDownload} ariaLabel="Download PDF">
                <Download size={15} aria-hidden="true" />
              </ToolbarButton>
            ) : null}
          </div>
        </div>
      ) : null}

      <div ref={containerRef} className="relative min-h-0 overflow-auto p-4">
        {error ? (
          <div className="grid h-full place-items-center">
            <div className="max-w-md rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-center text-sm font-bold text-red-100">
              {error}
              <button
                type="button"
                onClick={loadDocument}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-black hover:bg-red-500/30"
              >
                <RefreshCw size={13} aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        ) : !pageCount && !loading ? (
          <div className="grid h-full place-items-center">
            {emptyState || (
              <div className="text-center text-sm font-bold text-slate-200">No PDF loaded.</div>
            )}
          </div>
        ) : (
          <div className="mx-auto flex justify-center">
            <canvas ref={canvasRef} className="rounded-sm bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]" />
          </div>
        )}

        {(loading || busyLabel) && pageCount ? (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-md bg-slate-950/80 px-3 py-2 text-xs font-bold text-white shadow-lg">
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
            {busyLabel || 'Loading...'}
          </div>
        ) : null}

        {loading && !pageCount ? (
          <div className="grid h-full place-items-center">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              Loading PDF...
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ToolbarButton({ children, onClick, disabled, ariaLabel, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`grid size-8 place-items-center rounded-md text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-white/15 text-white' : 'hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
