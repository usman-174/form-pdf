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
    
    // Create a custom drag image
    const dragImage = document.createElement('div')
    dragImage.textContent = text
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: #3b82f6;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 200px;
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
      <div className="text-xs text-gray-500 mb-3">
        Drag these to the PDF or click to add at default position
      </div>
      
      <div className="space-y-2">
        {PREDEFINED_TEXTS.map((text, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, text)}
            onDragEnd={handleDragEnd}
            onClick={() => handleClick(text)}
            className={`
              flex items-center p-3 border rounded-lg cursor-move transition-all duration-200
              ${draggedText === text 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }
              group
            `}
            title="Drag to PDF or click to add"
          >
            <div className="flex-shrink-0 mr-3">
              <svg 
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 11l5-5m0 0l5 5m-5-5v12" 
                />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {text.length > 30 ? `${text.substring(0, 30)}...` : text}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {index === 0 && "Name"}
                {index === 1 && "ID Number"}
                {index === 2 && "Address"}
              </div>
            </div>

            <div className="flex-shrink-0 ml-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full mb-1"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full mb-1"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg 
            className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div className="text-xs text-blue-700">
            <div className="font-medium mb-1">How to use:</div>
            <div>• Drag text directly onto PDF</div>
            <div>• Click text to add at default position</div>
            <div>• Predefined text cannot be edited</div>
          </div>
        </div>
      </div>
    </div>
  )
}