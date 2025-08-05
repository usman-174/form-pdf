
'use client'

import { useState, useCallback, useEffect } from 'react'
import Controls from '@/components/Controls'
import { downloadPDFWithText, analyzePDFForDefaultFont } from '@/lib/pdf-utils'
import dynamic from 'next/dynamic'

// Dynamic import with proper loading state
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="flex justify-center items-center h-64 text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading PDF Viewer...
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
}

export default function Page() {
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [numPages, setNumPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  // Text elements state
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Handle PDF file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file')
      return
    }

    setIsLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      setPdfFile(file)
      setPdfData(arrayBuffer)
      setTextElements([]) // Clear existing text elements
      setSelectedElementId(null)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error loading PDF:', error)
      alert('Error loading PDF file')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add new text element with smart defaults
  const addTextElement = useCallback(async () => {
    if (!pdfData) return

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
        content: 'New Text',
        x: 100,
        y: 100,
        fontSize: defaultFont.fontSize,
        fontFamily: defaultFont.fontFamily,
        color: defaultFont.color,
        bold: false,
        italic: false,
        underline: false,
        pageNumber: currentPage
      }
      
      setTextElements(prev => [...prev, newElement])
      setSelectedElementId(newElement.id)
    } catch (error) {
      console.error('Error adding text element:', error)
      // Fallback to default values
      const newElement: TextElement = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: 'New Text',
        x: 100,
        y: 100,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#000000',
        bold: false,
        italic: false,
        underline: false,
        pageNumber: currentPage
      }
      
      setTextElements(prev => [...prev, newElement])
      setSelectedElementId(newElement.id)
    }
  }, [pdfData, currentPage])

  // Update text element with logging
  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    console.log('Updating element:', id, 'with updates:', updates)
    setTextElements(prev => {
      const updated = prev.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
      console.log('Updated elements:', updated)
      return updated
    })
  }, [])

  // Delete text element
  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id))
    if (selectedElementId === id) {
      setSelectedElementId(null)
    }
  }, [selectedElementId])

  // Handle text element selection
  const selectTextElement = useCallback((id: string | null) => {
    setSelectedElementId(id)
  }, [])

  // Get selected text element
  const selectedElement = selectedElementId 
    ? textElements.find(el => el.id === selectedElementId) || null
    : null

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

  // Get text elements for current page
  const currentPageTextElements = textElements.filter(
    element => element.pageNumber === currentPage
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            PDF Form Filler & Editor
          </h1>
          
          {/* File Upload */}
          <div className="mb-4">
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing...
            </div>
          )}
        </div>

        {/* Main Editor Area */}
        {pdfData && (
          <div className="flex gap-6">
            {/* Controls Panel */}
            <div className="w-80 flex-shrink-0">
              <Controls
                selectedElement={selectedElement}
                onAddText={addTextElement}
                onUpdateElement={updateTextElement}
                onDeleteElement={deleteTextElement}
                onDownload={handleDownload}
                isLoading={isLoading}
              />
            </div>

            {/* PDF Viewer */}
            <div className="flex-1">
              <PDFViewer
                pdfData={pdfData}
                textElements={currentPageTextElements}
                selectedElementId={selectedElementId}
                currentPage={currentPage}
                numPages={numPages}
                onNumPagesChange={setNumPages}
                onPageChange={setCurrentPage}
                onTextElementUpdate={updateTextElement}
                onTextElementSelect={selectTextElement}
              />
            </div>
          </div>
        )}

        {/* No PDF loaded state */}
        {!pdfData && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No PDF Loaded
            </h3>
            <p className="text-gray-500">
              Upload a PDF file to start adding and editing text
            </p>
          </div>
        )}
      </div>
    </div>
  )
}