'use client'

import { useState, useRef, useCallback } from 'react'

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

interface PredefinedTextPanelProps {
  onAddPredefinedText: (text: string) => void
  isPreviewMode?: boolean
}

const PREDEFINED_TEXTS = [
  "Benedict Nkosi",
  "692948244", 
  "187 Kitchener avenue, kensington, Johannesburg, 2001"
]

export default function PredefinedTextPanel({
  onAddPredefinedText,
  isPreviewMode = false
}: PredefinedTextPanelProps) {
  const [draggedText, setDraggedText] = useState<string | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, text: string) => {
    if (isPreviewMode) return
    
    setDraggedText(text)
    e.dataTransfer.setData('text/plain', text)
    e.dataTransfer.setData('application/predefined-text', text)
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create a simple drag image
    const dragImage = document.createElement('div')
    dragImage.textContent = text.length > 25 ? text.substring(0, 25) + '...' : text
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74));
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 10, 10)
    
    // Clean up drag image after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }, [isPreviewMode])

  const handleDragEnd = useCallback(() => {
    setDraggedText(null)
  }, [])

  const handleClick = useCallback((text: string) => {
    if (isPreviewMode) return
    onAddPredefinedText(text)
  }, [onAddPredefinedText, isPreviewMode])

  if (isPreviewMode) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Predefined Text
      </h3>
      <div className="text-xs text-gray-600 mb-3">
        Drag these to the PDF or click to add at default position
      </div>
      
      <div className="space-y-3">
        {PREDEFINED_TEXTS.map((text, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, text)}
            onDragEnd={handleDragEnd}
            onClick={() => handleClick(text)}
            className={`
              flex items-center p-3 border-2 rounded-lg cursor-move transition-all duration-200
              ${draggedText === text 
                ? 'border-green-500 bg-green-50 shadow-md' 
                : 'border-green-200 bg-green-50/50 hover:border-green-400 hover:bg-green-50'
              }
            `}
            title="Drag to PDF or click to add"
          >
            <div className="flex-shrink-0 mr-3">
              <svg 
                className={`w-4 h-4 transition-colors duration-200 ${
                  draggedText === text ? 'text-green-600' : 'text-green-500'
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" 
                />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {text.length > 30 ? `${text.substring(0, 30)}...` : text}
              </div>
            </div>

            <div className="flex-shrink-0 ml-2">
              <div className="flex flex-col space-y-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}