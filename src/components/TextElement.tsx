
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

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

interface TextElementProps {
  element: TextElement
  isSelected: boolean
  scale: number
  pageHeight: number
  pageWidth: number
  onUpdate: (id: string, updates: Partial<TextElement>) => void
  onSelect: (id: string | null) => void
}

export default function TextElement({
  element,
  isSelected,
  scale,
  pageHeight,
  pageWidth,
  onUpdate,
  onSelect
}: TextElementProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editValue, setEditValue] = useState<string>(element.content)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Update edit value when element content changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(element.content)
    }
  }, [element.content, isEditing])

  // Improved drag implementation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Store initial mouse position and element position
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPosition({ x: element.x, y: element.y })
    setIsDragging(true)
    onSelect(element.id)
    
    // Add visual feedback
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [isEditing, element.id, element.x, element.y, onSelect])

  // Handle mouse move with improved positioning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isEditing) return
      
      // Calculate how much the mouse has moved
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      // Calculate new position in PDF coordinates (unscaled)
      const newX = initialPosition.x + (deltaX / scale)
      const newY = initialPosition.y + (deltaY / scale)
      
      // Constrain to PDF page bounds
      const padding = 5
      const constrainedX = Math.max(padding, Math.min(newX, pageWidth - padding))
      const constrainedY = Math.max(padding, Math.min(newY, pageHeight - padding))
      
      // Update position
      onUpdate(element.id, {
        x: Math.round(constrainedX),
        y: Math.round(constrainedY)
      })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, isEditing, dragStart, initialPosition, scale, element.id, onUpdate, pageHeight, pageWidth])

  // Handle click to select
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(element.id)
  }, [element.id, onSelect, isDragging])

  // Handle double click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    e.preventDefault()
    e.stopPropagation()
    setIsEditing(true)
    setEditValue(element.content)
    // Focus input after state update
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }, [element.content, isDragging])

  // Handle edit save
  const handleEditSave = useCallback(() => {
    if (editValue.trim()) {
      onUpdate(element.id, { content: editValue.trim() })
    }
    setIsEditing(false)
  }, [element.id, editValue, onUpdate])

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setEditValue(element.content)
    setIsEditing(false)
  }, [element.content])

  // Handle key press in edit mode
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleEditCancel()
    }
  }, [handleEditSave, handleEditCancel])

  // Calculate font styles
  const getFontStyle = useCallback(() => {
    let fontWeight = 'normal'
    let fontStyle = 'normal'
    let textDecoration = 'none'

    if (element.bold) fontWeight = 'bold'
    if (element.italic) fontStyle = 'italic'
    if (element.underline) textDecoration = 'underline'

    return {
      fontFamily: element.fontFamily,
      fontSize: element.fontSize * scale,
      color: element.color,
      fontWeight,
      fontStyle,
      textDecoration,
      lineHeight: 1.2,
      margin: 0,
      padding: '2px 2px',
      borderRadius: '3px',
      minWidth: '30px',
      minHeight: '20px',
      whiteSpace: 'nowrap' as const,
      userSelect: isEditing ? 'text' as const : 'none' as const,
    }
  }, [element, scale, isEditing])

  const elementStyle = {
    ...getFontStyle(),
    cursor: isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'),
    border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.3)',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.9)',
    zIndex: isSelected ? 1001 : 1000,
    position: 'relative' as const,
    display: 'inline-block',
    boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
  }

  return (
    <div
      ref={elementRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      style={elementStyle}
      className="text-element"
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleKeyPress}
          className="bg-transparent outline-none border-none p-0 m-0"
          style={{
            fontFamily: element.fontFamily,
            fontSize: element.fontSize * scale,
            color: element.color,
            fontWeight: element.bold ? 'bold' : 'normal',
            fontStyle: element.italic ? 'italic' : 'normal',
            textDecoration: element.underline ? 'underline' : 'none',
            width: `${Math.max(editValue.length * 0.7, 3)}em`,
            minWidth: '30px'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span style={{ pointerEvents: 'none' }}>{element.content}</span>
      )}

      {/* Selection indicators */}
      {isSelected && !isEditing && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white pointer-events-none"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white pointer-events-none"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white pointer-events-none"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white pointer-events-none"></div>
        </>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-50">
          Press Enter to save, Esc to cancel
        </div>
      )}
    </div>
  )
}