
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { getPdfWorkerUrl } from '@/utils/pdfWorker'
import TextElement from './TextElement'

// Import react-pdf styles
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker properly
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerPort = new Worker(getPdfWorkerUrl(), {
    type: 'module',
  })
}

interface TextElement {
  id: string
  content: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
  underline: boolean
  pageNumber: number
}

interface PDFViewerProps {
  pdfData: ArrayBuffer
  textElements: TextElement[]
  selectedElementId: string | null
  currentPage: number
  numPages: number
  onNumPagesChange: (numPages: number) => void
  onPageChange: (page: number) => void
  onTextElementUpdate: (id: string, updates: Partial<TextElement>) => void
  onTextElementSelect: (id: string | null) => void
}

export default function PDFViewer({
  pdfData,
  textElements,
  selectedElementId,
  currentPage,
  numPages,
  onNumPagesChange,
  onPageChange,
  onTextElementUpdate,
  onTextElementSelect
}: PDFViewerProps) {
  const [scale, setScale] = useState(1.2)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState({ width: 800, height: 600 })
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Convert ArrayBuffer to Blob URL for react-pdf
  useEffect(() => {
    if (!pdfData) return

    const blob = new Blob([pdfData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    setPdfUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [pdfData])

  const handleDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    onNumPagesChange(pages)
  }, [onNumPagesChange])

  const handlePageLoadSuccess = useCallback((page: any) => {
    const viewport = page.getViewport({ scale: 1.0 })
    setPageDimensions({ width: viewport.width, height: viewport.height })
  }, [])

  // Handle clicks on the PDF container (not on text elements)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the container itself, not on child elements
    if (e.target === e.currentTarget) {
      onTextElementSelect(null)
    }
  }, [onTextElementSelect])

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }, [currentPage, onPageChange])

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) onPageChange(currentPage + 1)
  }, [currentPage, numPages, onPageChange])

  const zoomIn = useCallback(() => setScale(prev => Math.min(prev + 0.2, 3)), [])
  const zoomOut = useCallback(() => setScale(prev => Math.max(prev - 0.2, 0.5)), [])
  const resetZoom = useCallback(() => setScale(1.2), [])

  if (!pdfUrl) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading PDF...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Controls Header */}
      <div className="border-b bg-gray-50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600 px-2">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={zoomOut} 
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn} 
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={resetZoom} 
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative overflow-auto max-h-[800px] bg-gray-100">
        <div 
          ref={pdfContainerRef}
          className="relative inline-block m-8" 
          onClick={handleContainerClick}
        >
          {/* PDF Document Container */}
          <div className="relative pdf-document-container">
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              error={
                <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
                  Failed to load PDF. Please try uploading again.
                </div>
              }
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading document...</span>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={handlePageLoadSuccess}
                className="border border-gray-300 shadow-lg"
                error={
                  <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
                    Failed to load page {currentPage}
                  </div>
                }
                loading={
                  <div className="flex items-center justify-center p-8 bg-white border border-gray-300">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading page...</span>
                  </div>
                }
              />
            </Document>
            
            {/* Text Elements Overlay - Positioned absolutely over the PDF */}
            {textElements.map(element => (
              <div
                key={element.id}
                className="absolute text-element-container"
                style={{
                  left: element.x * scale,
                  top: element.y * scale,
                  zIndex: selectedElementId === element.id ? 1001 : 1000,
                }}
                onMouseDown={(e) => {
                  // Prevent PDF container from handling the click
                  e.stopPropagation()
                }}
              >
                <TextElement
                  element={element}
                  isSelected={selectedElementId === element.id}
                  scale={scale}
                  pageHeight={pageDimensions.height}
                  pageWidth={pageDimensions.width}
                  onUpdate={onTextElementUpdate}
                  onSelect={onTextElementSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
        <span>
          {textElements.length} text element{textElements.length !== 1 ? 's' : ''} on this page
          {selectedElementId && (
            <span className="ml-2 text-blue-600">
              • Element selected
            </span>
          )}
        </span>
        <span>PDF Scale: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  )
}