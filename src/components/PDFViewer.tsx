
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
  isPredefined?: boolean
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
  onAddTextAtPosition?: (x: number, y: number) => void
  isPreviewMode?: boolean
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
  onTextElementSelect,
  onAddTextAtPosition,
  isPreviewMode = false
}: PDFViewerProps) {
  const [scale] = useState(1.2) // Fixed at 120% zoom
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState({ width: 800, height: 600 })
  const [pageRect, setPageRect] = useState<DOMRect | null>(null)
  const [pdfTextItems, setPdfTextItems] = useState<Array<{x: number, y: number, width: number, height: number}>>([])
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

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

  // Extract text content from PDF page for snapping alignment
  const extractTextContent = useCallback(async (page: any) => {
    try {
      const textContent = await page.getTextContent()
      const textItems: Array<{x: number, y: number, width: number, height: number}> = []
      
      // Get page dimensions for coordinate conversion
      const viewport = page.getViewport({ scale: 1.0 })
      const pageHeight = viewport.height
      
      for (const item of textContent.items) {
        if (item.str && item.str.trim()) {
          // Transform coordinates from PDF space to our coordinate system
          const transform = item.transform
          const x = transform[4] // x position
          const y = transform[5] // y position
          const width = item.width || 0
          const height = item.height || (item.fontsize || 12)
          
          // Convert from PDF coordinates (bottom-left origin) to our coordinates (top-left origin)
          const convertedY = pageHeight - y
          
          textItems.push({
            x: x,
            y: convertedY,
            width: width,
            height: height
          })
        }
      }
      
      setPdfTextItems(textItems)
      console.log(`Extracted ${textItems.length} text items from PDF page ${currentPage}:`)
      console.log('Sample text items:', textItems.slice(0, 10))
      
    } catch (error) {
      console.warn('Could not extract text content for snapping:', error)
      setPdfTextItems([])
    }
  }, [currentPage])

  const handlePageLoadSuccess = useCallback((page: any) => {
    const viewport = page.getViewport({ scale: 1.0 })
    setPageDimensions({ width: viewport.width, height: viewport.height })
    
    console.log('=== PDF VIEWER PAGE DIMENSIONS ===')
    console.log('Method: page.getViewport({ scale: 1.0 }) - PDF viewer')
    console.log('Dimensions:', { width: viewport.width, height: viewport.height })
    console.log('Current scale:', scale)
    console.log('Effective display size:', { width: viewport.width * scale, height: viewport.height * scale })
    console.log('==================================')
    
    // Extract text content for snapping
    extractTextContent(page)
    
    // Update page rect for coordinate calculations
    setTimeout(() => {
      updatePageRect()
    }, 100)
  }, [scale, extractTextContent])

  // Update page rect detection
  const updatePageRect = useCallback(() => {
    if (pageRef.current) {
      // Get the actual PDF page element, not just the container
      const pageElement = pageRef.current.querySelector('.react-pdf__Page')
      if (pageElement) {
        const rect = pageElement.getBoundingClientRect()
        setPageRect(rect)
        console.log('Updated page rect:', rect)
        console.log('Page dimensions:', pageDimensions)
        console.log('Scale:', scale)
      }
    }
  }, [pageDimensions, scale])

  // Update page rect when scale changes
  useEffect(() => {
    const timeoutId = setTimeout(updatePageRect, 100)
    
    // Listen for resize events
    window.addEventListener('resize', updatePageRect)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePageRect)
    }
  }, [scale, currentPage, updatePageRect])

  // Clear PDF text items when page changes
  useEffect(() => {
    setPdfTextItems([])
  }, [currentPage])

  // FIXED: Improved coordinate conversion function with line alignment
  const screenToPdfCoordinates = useCallback((screenX: number, screenY: number) => {
    if (!pageRef.current) return { x: 0, y: 0 }

    // Get the actual PDF page element (the canvas/svg element)
    const pageElement = pageRef.current.querySelector('.react-pdf__Page')
    if (!pageElement) return { x: 0, y: 0 }

    const pageRect = pageElement.getBoundingClientRect()
    
    // Calculate relative position within the PDF page (in screen pixels)
    const relativeX = screenX - pageRect.left
    const relativeY = screenY - pageRect.top
    
    // Convert to PDF coordinates by dividing by scale
    // This gives us coordinates in the PDF's native coordinate system
    const pdfX = relativeX / scale
    const pdfY = relativeY / scale
    
    console.log('=== COORDINATE CONVERSION ===')
    console.log('Screen coordinates:', { x: screenX, y: screenY })
    console.log('Page rect:', { left: pageRect.left, top: pageRect.top, width: pageRect.width, height: pageRect.height })
    console.log('Relative coordinates:', { x: relativeX, y: relativeY })
    console.log('Current scale:', scale)
    console.log('PDF dimensions (from viewport):', pageDimensions)
    console.log('Calculated PDF coordinates (before scale division):', { x: relativeX, y: relativeY })
    console.log('Final PDF coordinates (after scale division):', { x: pdfX, y: pdfY })
    
    // Line alignment feature: Check if there are nearby text elements OR PDF text to align with
    const snapThreshold = 20 // pixels in PDF coordinates - increased for testing
    let alignedY = pdfY
    let alignedX = pdfX
    
    // Get text elements on current page
    const pageElements = textElements.filter(el => el.pageNumber === currentPage)
    
    // Combine manual text elements and PDF text items for snapping
    const allSnapTargets = [
      // Manual text elements
      ...pageElements.map(el => ({
        textY: el.y + 4, // Add padding offset (4px from TextElement styling)
        textX: el.x + 8, // Add padding offset (8px from TextElement styling)
        type: 'manual'
      })),
      // PDF text items
      ...pdfTextItems.map(item => ({
        textY: item.y,
        textX: item.x,
        type: 'pdf'
      }))
    ]
    
    console.log('PDF text items for snapping:', pdfTextItems.length)
    console.log('Manual text elements for snapping:', pageElements.length)
    console.log('Total snap targets:', allSnapTargets.length)
    console.log('Sample snap targets:', allSnapTargets.slice(0, 5))
    
    if (allSnapTargets.length > 0) {
      // Find the closest Y position (horizontal line alignment)
      let closestYDistance = Infinity
      let closestY = pdfY
      let closestYType = 'none'
      
      // Find the closest X position (vertical line alignment)  
      let closestXDistance = Infinity
      let closestX = pdfX
      let closestXType = 'none'
      
      for (const target of allSnapTargets) {
        // Check Y alignment (horizontal lines)
        const yDistance = Math.abs(target.textY - pdfY)
        if (yDistance < closestYDistance && yDistance <= snapThreshold) {
          closestYDistance = yDistance
          closestY = target.textY
          closestYType = target.type
        }
        
        // Check X alignment (vertical lines)
        const xDistance = Math.abs(target.textX - pdfX)
        if (xDistance < closestXDistance && xDistance <= snapThreshold) {
          closestXDistance = xDistance
          closestX = target.textX
          closestXType = target.type
        }
      }
      
      // Apply snapping if close enough
      if (closestYDistance <= snapThreshold) {
        // For manual elements, subtract padding to get container position
        // For PDF text, use the position directly
        alignedY = closestYType === 'manual' ? closestY - 4 : closestY
        console.log(`🎯 Y-SNAPPED to ${closestYType} text line at Y=${closestY} (container Y=${alignedY}, was ${pdfY}, distance=${closestYDistance})`)
      }
      
      if (closestXDistance <= snapThreshold) {
        // For manual elements, subtract padding to get container position
        // For PDF text, use the position directly
        alignedX = closestXType === 'manual' ? closestX - 8 : closestX
        console.log(`🎯 X-SNAPPED to ${closestXType} text line at X=${closestX} (container X=${alignedX}, was ${pdfX}, distance=${closestXDistance})`)
      }
    }
    
    console.log('Final PDF coordinates (after alignment):', { x: alignedX, y: alignedY })
    console.log('=============================')
    
    // Constrain to PDF bounds
    const constrainedX = Math.max(0, Math.min(alignedX, pageDimensions.width))
    const constrainedY = Math.max(0, Math.min(alignedY, pageDimensions.height))
    
    console.log('Constrained coordinates:', { x: constrainedX, y: constrainedY })
    
    return { x: constrainedX, y: constrainedY }
  }, [scale, pageDimensions, textElements, currentPage, pdfTextItems])

  // Handle mouse move for alignment preview - removed visual guides
  const handlePdfMouseMove = useCallback((e: React.MouseEvent) => {
    // Guides removed - alignment only happens during drag operations
  }, [])

  // Clear guides when mouse leaves PDF area - no longer needed
  const handlePdfMouseLeave = useCallback(() => {
    // No guides to clear
  }, [])

  // Handle double click on PDF to add text
  const handlePdfDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || !onAddTextAtPosition) return

    e.preventDefault()
    e.stopPropagation()

    // Use clientX/clientY for screen coordinates
    const { x, y } = screenToPdfCoordinates(e.clientX, e.clientY)
    console.log('Double click - Screen coords:', { screenX: e.clientX, screenY: e.clientY })
    console.log('Double click - PDF coords:', { x, y })
    
    onAddTextAtPosition(x, y)
  }, [screenToPdfCoordinates, onAddTextAtPosition, isPreviewMode])

  // Handle clicks on the PDF container (not on text elements)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the container itself, not on child elements
    if (e.target === e.currentTarget && !isPreviewMode) {
      onTextElementSelect(null)
    }
  }, [onTextElementSelect, isPreviewMode])

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }, [currentPage, onPageChange])

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) onPageChange(currentPage + 1)
  }, [currentPage, numPages, onPageChange])

  // Debug function for testing coordinates
  const debugCoordinates = useCallback(() => {
    if (!pageRef.current) return
    
    const container = pageRef.current
    const pageElement = container.querySelector('.react-pdf__Page')
    
    console.log('=== COORDINATE DEBUG ===')
    console.log('Container rect:', container.getBoundingClientRect())
    console.log('Page element rect:', pageElement?.getBoundingClientRect())
    console.log('Scale:', scale)
    console.log('Page dimensions:', pageDimensions)
    console.log('Current page rect state:', pageRect)
    console.log('Text elements on current page:', textElements.filter(el => el.pageNumber === currentPage))
    console.log('PDF text items extracted:', pdfTextItems)
    console.log('========================')
  }, [scale, pageDimensions, pageRect, textElements, currentPage, pdfTextItems])

  // Make debug function available globally for testing
  useEffect(() => {
    (window as any).debugPDFViewer = debugCoordinates
  }, [debugCoordinates])

  // Filter text elements for current page
  const currentPageElements = textElements.filter(el => el.pageNumber === currentPage)

  if (!pdfUrl) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-700">Loading PDF...</span>
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
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-700 px-2">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
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
            <div 
              ref={pageRef}
              onDoubleClick={handlePdfDoubleClick}
              onMouseMove={handlePdfMouseMove}
              onMouseLeave={handlePdfMouseLeave}
              className={`relative ${!isPreviewMode ? 'cursor-crosshair' : ''}`}
              title={!isPreviewMode ? "Double-click to add text • Text will snap to align with PDF content" : ""}
            >
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
                    <span className="ml-2 text-gray-700">Loading document...</span>
                  </div>
                }
              >
                <div className="relative inline-block">
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
                        <span className="ml-2 text-gray-700">Loading page...</span>
                      </div>
                    }
                  />
                  
                  {/* Text Elements Overlay - Positioned relative to the Page component */}
                  {currentPageElements.map(element => (
                    <div
                      key={element.id}
                      className="absolute text-element-container pointer-events-auto"
                      style={{
                        left: element.x * scale,
                        top: element.y * scale,
                        zIndex: selectedElementId === element.id ? 1001 : 1000,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <TextElement
                        element={element}
                        isSelected={selectedElementId === element.id && !isPreviewMode}
                        scale={scale}
                        pageHeight={pageDimensions.height}
                        pageWidth={pageDimensions.width}
                        onUpdate={onTextElementUpdate}
                        onSelect={onTextElementSelect}
                        isPreviewMode={isPreviewMode}
                      />
                    </div>
                  ))}
                </div>
              </Document>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
        <span>
          {currentPageElements.length} text element{currentPageElements.length !== 1 ? 's' : ''} on this page
          {selectedElementId && !isPreviewMode && (
            <span className="ml-2 text-blue-600">
              • Element selected
            </span>
          )}
          {!isPreviewMode && (
            <span className="ml-2 text-green-600">
              • Double-click PDF to add text • Drag text to snap align with PDF content
            </span>
          )}
        </span>
        <span>PDF Scale: {Math.round(scale * 100)}% | Page: {pageDimensions.width}x{pageDimensions.height}px</span>
      </div>
    </div>
  )
}