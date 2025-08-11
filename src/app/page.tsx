'use client'

import { useState, useCallback, useEffect } from 'react'
import Controls from '@/components/Controls'
import PredefinedTextPanel from '@/components/PredefinedTextPanel'
import { downloadPDFWithText, previewPDFWithText, analyzePDFForDefaultFont } from '@/lib/pdf-utils'
import { toast } from '@/components/Toast'
import dynamic from 'next/dynamic'

// Dynamic import with enhanced loading state
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="flex flex-col justify-center items-center h-96 text-gray-700">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-r-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-4 text-lg font-medium">Loading PDF Viewer...</p>
        <p className="mt-1 text-sm text-gray-500">Preparing advanced text editing tools</p>
      </div>
    </div>
  ),
})

// Unified TextElement interface
export interface TextElement {
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
  // Advanced formatting properties
  letterSpacing?: number // Letter spacing in pixels
  wordSpacing?: number // Word spacing in pixels
  lineHeight?: number // Line height multiplier (1.0 = normal, 1.5 = 1.5x spacing)
  textAlign?: 'left' | 'center' | 'right' | 'justify' // Text alignment
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' // Text case transformation
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through' // Text decoration
  fontWeight?: number // Font weight (100-900)
  fontStyle?: 'normal' | 'italic' | 'oblique' // Font style
  textShadow?: string // Text shadow CSS value
  backgroundColor?: string // Background color for text
  borderRadius?: number // Border radius for background
  padding?: number // Internal padding
  opacity?: number // Text opacity (0-1)
}

// Drop zone component for handling predefined text drops
function PDFDropZone({ 
  children, 
  onDropPredefinedText 
}: { 
  children: React.ReactNode
  onDropPredefinedText: (text: string, x: number, y: number) => void 
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    
    // Check if this is predefined text being dragged
    if (e.dataTransfer.types.includes('application/predefined-text')) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set to false if we're leaving the drop zone completely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const text = e.dataTransfer.getData('application/predefined-text')
    if (text) {
      onDropPredefinedText(text, e.clientX, e.clientY)
    }
  }, [onDropPredefinedText])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {children}
      {isDragOver && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none z-50 opacity-90">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Drop to add text</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [previewPdfData, setPreviewPdfData] = useState<ArrayBuffer | null>(null)
  const [numPages, setNumPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 })
  
  // Text elements state
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)

  // Handle PDF file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file. Only PDF files are supported.')
      return
    }

    // Validate file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      toast.error('File size too large. Please select a PDF file smaller than 50MB.')
      return
    }

    setIsLoading(true)
    toast.info('Loading PDF file...')
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      setPdfFile(file)
      setPdfData(arrayBuffer)
      setPreviewPdfData(null) // Clear preview when new file is loaded
      setTextElements([]) // Clear existing text elements
      setSelectedElementId(null)
      setCurrentPage(1)
      setIsPreviewMode(false) // Exit preview mode when new file is loaded
      
      toast.success(`PDF loaded successfully! "${file.name}"`)
    } catch (error) {
      console.error('Error loading PDF:', error)
      toast.error('Failed to load PDF file. The file may be corrupted or password-protected.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add new text element at specific coordinates
  const addTextElementAtPosition = useCallback(async (x: number, y: number, content: string = 'New Text', isPredefined: boolean = false) => {
    if (!pdfData || isPreviewMode) return

    try {
      // Try to analyze PDF for default font properties
      let defaultFont
      try {
        defaultFont = await analyzePDFForDefaultFont(pdfData, currentPage)
      } catch (error) {
        console.warn('Could not analyze PDF font, using defaults:', error)
        defaultFont = {
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#000000'
        }
      }
      
      const newElement: TextElement = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        x: Math.max(0, x),
        y: Math.max(0, y),
        fontSize: defaultFont.fontSize,
        fontFamily: defaultFont.fontFamily,
        color: defaultFont.color,
        bold: false,
        italic: false,
        underline: false,
        pageNumber: currentPage,
        isPredefined,
        // Advanced formatting defaults
        letterSpacing: 0,
        wordSpacing: 0,
        lineHeight: 1.2,
        textAlign: 'left',
        textTransform: 'none',
        textDecoration: 'none',
        fontWeight: 400,
        fontStyle: 'normal',
        textShadow: 'none',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        opacity: 1,
      }
      
      setTextElements(prev => [...prev, newElement])
      setSelectedElementId(newElement.id)
      
      console.log('Added text element at position:', { x, y, content, isPredefined })
      
      // Show success toast
      toast.success(isPredefined ? 'Predefined text added!' : 'Text element added successfully!')
    } catch (error) {
      console.error('Error adding text element:', error)
      toast.error('Failed to analyze PDF font, using default formatting.')
      
      // Fallback to default values
      const newElement: TextElement = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        x: Math.max(0, x),
        y: Math.max(0, y),
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#000000',
        bold: false,
        italic: false,
        underline: false,
        pageNumber: currentPage,
        isPredefined,
        // Advanced formatting defaults
        letterSpacing: 0,
        wordSpacing: 0,
        lineHeight: 1.2,
        textAlign: 'left',
        textTransform: 'none',
        textDecoration: 'none',
        fontWeight: 400,
        fontStyle: 'normal',
        textShadow: 'none',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        opacity: 1,
      }
      
      setTextElements(prev => [...prev, newElement])
      setSelectedElementId(newElement.id)
    }
  }, [pdfData, currentPage, isPreviewMode])

  // Add regular text element (for button click) - positioned at center of PDF
  const addTextElement = useCallback(async () => {
    // Calculate center coordinates based on actual PDF dimensions
    const scale = 1.2 // Match PDFViewer scale
    const centerX = pageDimensions.width / 2
    const centerY = pageDimensions.height / 2
    const adjustedX = centerX + (8 / scale) // Account for horizontal margin offset
    const adjustedY = centerY + (4 / scale) // Account for vertical margin offset
    
    await addTextElementAtPosition(adjustedX, adjustedY, 'New Text', false)
  }, [addTextElementAtPosition, pageDimensions])

  // Add predefined text element - positioned at center of PDF
  const addPredefinedText = useCallback(async (text: string) => {
    // Calculate center coordinates based on actual PDF dimensions (same as addTextElement)
    const scale = 1.2 // Match PDFViewer scale
    const centerX = pageDimensions.width / 2
    const centerY = pageDimensions.height / 2
    const adjustedX = centerX + (8 / scale) // Account for horizontal margin offset
    const adjustedY = centerY + (4 / scale) // Account for vertical margin offset
    
    await addTextElementAtPosition(adjustedX, adjustedY, text, true)
  }, [addTextElementAtPosition, pageDimensions])

  // Handle predefined text drop with proper coordinate conversion
  const handleDropPredefinedText = useCallback(async (text: string, screenX: number, screenY: number) => {
    if (!pdfData || isPreviewMode) return
    
    console.log('Dropped predefined text:', text, 'at screen coordinates:', screenX, screenY)
    
    // Use the same coordinate conversion as the PDFViewer's double-click handler
    // This ensures consistent positioning regardless of page height/dimensions
    try {
      // Find the PDF page element to do coordinate conversion
      const pdfPageElement = document.querySelector('.react-pdf__Page')
      if (pdfPageElement) {
        const pageRect = pdfPageElement.getBoundingClientRect()
        const scale = 1.2 // Match the scale used in PDFViewer
        
        // Calculate relative position within the PDF page
        const relativeX = screenX - pageRect.left
        const relativeY = screenY - pageRect.top
        
        // Convert to PDF coordinates by dividing by scale
        let pdfX = relativeX / scale
        let pdfY = relativeY / scale
        
        // Apply the same adjustment as the double-click handler for consistent positioning
        // Adjust coordinates to account for TextElement padding/margin offsets
        pdfX = pdfX + (8 / scale) // Add back horizontal margin offset
        pdfY = pdfY + (4 / scale) // Add back vertical margin offset
        
        // Ensure coordinates are within bounds
        pdfX = Math.max(0, pdfX)
        pdfY = Math.max(0, pdfY)
        
        console.log('Converted coordinates:', { 
          pageRect, 
          scale, 
          relativeX, 
          relativeY, 
          finalPdfX: pdfX, 
          finalPdfY: pdfY 
        })
        
        // Add text at the calculated position
        await addTextElementAtPosition(pdfX, pdfY, text, true)
      } else {
        // Fallback to default position if we can't find the PDF element
        console.warn('Could not find PDF page element, using default position')
        await addTextElementAtPosition(100, 100, text, true)
      }
    } catch (error) {
      console.error('Error processing drop:', error)
      // Fallback to default position
      await addTextElementAtPosition(100, 100, text, true)
    }
  }, [pdfData, isPreviewMode, addTextElementAtPosition])

  // Update text element with logging and toast feedback
  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    if (isPreviewMode) return // Don't allow updates in preview mode
    
    console.log('Updating element:', id, 'with updates:', updates)
    setTextElements(prev => {
      const updated = prev.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
      console.log('Updated elements:', updated)
      return updated
    })
    
    // Show subtle feedback for content updates
    if (updates.content) {
      toast.success('Text content updated!', 2000) // Shorter duration for frequent updates
    }
  }, [isPreviewMode])

  // Delete text element
  const deleteTextElement = useCallback((id: string) => {
    if (isPreviewMode) return // Don't allow deletion in preview mode
    
    setTextElements(prev => prev.filter(element => element.id !== id))
    if (selectedElementId === id) {
      setSelectedElementId(null)
    }
    
    // Show success toast
    toast.success('Text element deleted successfully!')
  }, [selectedElementId, isPreviewMode])

  // Handle text element selection
  const selectTextElement = useCallback((id: string | null) => {
    if (isPreviewMode) return // Don't allow selection in preview mode
    setSelectedElementId(id)
  }, [isPreviewMode])

  // Handle page dimensions change from PDFViewer
  const handlePageDimensionsChange = useCallback((dimensions: { width: number; height: number }) => {
    setPageDimensions(dimensions)
  }, [])

  // Get selected text element
  const selectedElement = selectedElementId 
    ? textElements.find(el => el.id === selectedElementId) || null
    : null

  // Handle preview toggle
  const handlePreview = useCallback(async () => {
    if (!pdfData || !pdfFile) {
      alert('No PDF loaded')
      return
    }

    if (isPreviewMode) {
      // Exit preview mode
      console.log('Exiting preview mode')
      setIsPreviewMode(false)
      setPreviewPdfData(null)
      setSelectedElementId(null)
      return
    }

    // Enter preview mode
    console.log('Entering preview mode')
    setIsLoading(true)
    
    // Add a small delay to ensure UI updates
    setTimeout(async () => {
      try {
        // Validate text elements before processing
        const validElements = textElements.filter(element => {
          const isValid = element && 
            typeof element.id === 'string' && 
            typeof element.content === 'string' && 
            typeof element.x === 'number' && 
            typeof element.y === 'number' && 
            typeof element.pageNumber === 'number'
          
          if (!isValid) {
            console.error('Invalid element found for preview:', element)
          }
          return isValid
        })

        console.log('Generating preview with valid elements:', validElements)

        // Generate preview PDF
        const previewArrayBuffer = await previewPDFWithText(pdfData, validElements)
        console.log('Preview generated, setting states...')
        
        // Set states in the correct order
        setPreviewPdfData(previewArrayBuffer)
        setIsPreviewMode(true)
        setSelectedElementId(null) // Clear selection in preview mode
        
        console.log('Preview states set successfully')
      } catch (error) {
        console.error('Error generating preview:', error)
        alert(`Error generating preview: ${error.message || error}`)
        // Reset states on error
        setIsPreviewMode(false)
        setPreviewPdfData(null)
      } finally {
        console.log('Setting loading to false')
        setIsLoading(false)
      }
    }, 100)
  }, [pdfData, pdfFile, textElements, isPreviewMode])

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === 'INPUT' || 
                      activeElement?.tagName === 'TEXTAREA' || 
                      (activeElement as HTMLElement)?.isContentEditable

      if (isTyping) return

      // Ctrl/Cmd + P for preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && pdfData) {
        e.preventDefault()
        handlePreview()
        return
      }

      // T for add text
      if (e.key.toLowerCase() === 't' && pdfData && !isPreviewMode) {
        e.preventDefault()
        addTextElement()
        return
      }

      // 1, 2, 3 for predefined texts
      if ((e.key === '1' || e.key === '2' || e.key === '3') && pdfData && !isPreviewMode) {
        e.preventDefault()
        const predefinedTexts = [
          "Benedict Nkosi",
          "692948244", 
          "187 Kitchener avenue, kensington, Johannesburg, 2001"
        ]
        const textIndex = parseInt(e.key) - 1
        if (textIndex >= 0 && textIndex < predefinedTexts.length) {
          addPredefinedText(predefinedTexts[textIndex])
        }
        return
      }

      // Delete key for selected element
      if (e.key === 'Delete' && selectedElementId && !isPreviewMode) {
        e.preventDefault()
        if (confirm('Delete this text element?')) {
          deleteTextElement(selectedElementId)
        }
        return
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        e.preventDefault()
        selectTextElement(null)
        return
      }

      // Ctrl/Cmd + Z for undo (future enhancement)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        // TODO: Implement undo functionality
        console.log('Undo shortcut pressed - feature coming soon!')
        return
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [pdfData, handlePreview, selectedElementId, isPreviewMode, addTextElement, deleteTextElement, selectTextElement, addPredefinedText])

  // Global click handler for deselecting elements when clicking away
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Don't deselect if clicking on a text element or if in preview mode
      if (isPreviewMode) return

      const target = e.target as HTMLElement
      
      // Check if clicked element is a text element or its child
      const clickedTextElement = target.closest('.text-element')
      
      // Check if clicked on predefined text panel or its children
      const clickedPredefinedPanel = target.closest('[data-predefined-panel]') || 
                                     target.closest('.predefined-text-item')

      // Check if clicked on controls panel or its children  
      const clickedControls = target.closest('[data-controls-panel]') || 
                             target.closest('button') || 
                             target.closest('input') || 
                             target.closest('select')

      // Only deselect if not clicking on text elements, panels, or controls
      if (!clickedTextElement && !clickedPredefinedPanel && !clickedControls) {
        selectTextElement(null)
        console.log('Deselected element due to click away')
      }
    }

    // Add click listener to document
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [isPreviewMode, selectTextElement])

  // Handle PDF download with better error handling
  const handleDownload = useCallback(async () => {
    if (!pdfData || !pdfFile) {
      alert('No PDF loaded')
      return
    }

    console.log('Starting download with elements:', textElements)
    
    // Validate text elements before processing
    const validElements = textElements.filter(element => {
      const isValid = element && 
        typeof element.id === 'string' && 
        typeof element.content === 'string' && 
        typeof element.x === 'number' && 
        typeof element.y === 'number' && 
        typeof element.pageNumber === 'number'
      
      if (!isValid) {
        console.error('Invalid element found:', element)
      }
      return isValid
    })

    console.log('Valid elements for processing:', validElements)

    setIsLoading(true)
    try {
      const modifiedPdfBlob = await downloadPDFWithText(pdfData, validElements)
      
      // Create download link
      const url = URL.createObjectURL(modifiedPdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `modified-${pdfFile.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(`Error generating PDF download: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }, [pdfData, pdfFile, textElements])

  // Get text elements for current page (only show in edit mode)
  const currentPageTextElements = isPreviewMode 
    ? [] // Don't show text elements overlay in preview mode
    : textElements.filter(element => element.pageNumber === currentPage)

  // Get the PDF data to display (preview or original)
  const displayPdfData = isPreviewMode ? previewPdfData : pdfData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                PDF Form Filler & Editor 
              </h1>
              <p className='text-sm text-red-600'>proof of concept</p>
              {isPreviewMode && (
                <div className="flex items-center text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium">Preview Mode - Final PDF View</span>
                </div>
              )}
            </div>
            
            {/* Quick actions */}
            {pdfData && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {textElements.length} text element{textElements.length !== 1 ? 's' : ''}
                  {textElements.filter(el => el.isPredefined).length > 0 && (
                    <span className="ml-2 text-green-600">
                      ({textElements.filter(el => el.isPredefined).length} predefined)
                    </span>
                  )}
                </span>
                {!isPreviewMode && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Double-click PDF to add text
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* File Upload - Only show when not in preview mode */}
          {!isPreviewMode && (
            <div className="mt-4">
              <label 
                htmlFor="pdf-upload" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload PDF File
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center text-blue-600 mt-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {isPreviewMode ? 'Generating preview...' : 'Processing...'}
            </div>
          )}
        </div>

        {/* Main Editor Area */}
        {displayPdfData && (
          <div className="flex gap-6">
            {/* Controls Panel */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Predefined Text Panel */}
              <PredefinedTextPanel
                onAddPredefinedText={addPredefinedText}
                isPreviewMode={isPreviewMode}
              />
              
              {/* Controls */}
              <Controls
                selectedElement={selectedElement}
                onAddText={addTextElement}
                onUpdateElement={updateTextElement}
                onDeleteElement={deleteTextElement}
                onDownload={handleDownload}
                onPreview={handlePreview}
                isLoading={isLoading}
                isPreviewMode={isPreviewMode}
              />
            </div>

            {/* PDF Viewer with Drop Zone */}
            <div className="flex-1 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    {isPreviewMode ? 'Loading preview...' : 'Processing...'}
                  </div>
                </div>
              )}
              <PDFDropZone onDropPredefinedText={handleDropPredefinedText}>
                <PDFViewer
                  key={isPreviewMode ? 'preview' : 'original'}
                  pdfData={displayPdfData}
                  textElements={currentPageTextElements}
                  selectedElementId={selectedElementId}
                  currentPage={currentPage}
                  numPages={numPages}
                  onNumPagesChange={setNumPages}
                  onPageChange={setCurrentPage}
                  onTextElementUpdate={updateTextElement}
                  onTextElementSelect={selectTextElement}
                  onAddTextAtPosition={addTextElementAtPosition}
                  onPageDimensionsChange={handlePageDimensionsChange}
                  isPreviewMode={isPreviewMode}
                />
              </PDFDropZone>
            </div>
          </div>
        )}

        {/* No PDF loaded state */}
        {!displayPdfData && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No PDF Loaded
            </h3>
            <p className="text-gray-500 mb-4">
              Upload a PDF file to start adding and editing text
            </p>
            <div className="text-sm text-gray-400 space-y-1">
              <div>• Double-click on PDF to add text at specific positions</div>
              <div>• Drag predefined text directly onto PDF</div>
              <div>• Use the controls panel to customize text properties</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}