
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
  isPredefined?: boolean
  // Advanced formatting properties
  letterSpacing?: number
  wordSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through'
  fontWeight?: number
  fontStyle?: 'normal' | 'italic' | 'oblique'
  textShadow?: string
  backgroundColor?: string
  borderRadius?: number
  padding?: number
  opacity?: number
}

interface TextElementProps {
  element: TextElement
  isSelected: boolean
  scale: number
  pageHeight: number
  pageWidth: number
  onUpdate: (id: string, updates: Partial<TextElement>) => void
  onSelect: (id: string | null) => void
  isPreviewMode?: boolean
}

export default function TextElement({
  element,
  isSelected,
  scale,
  pageHeight,
  pageWidth,
  onUpdate,
  onSelect,
  isPreviewMode = false
}: TextElementProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editValue, setEditValue] = useState<string>(element.content)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Update edit value when element content changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(element.content)
    }
  }, [element.content, isEditing])

  // Focus element when it becomes selected
  useEffect(() => {
    if (isSelected && !isEditing && !isPreviewMode) {
      elementRef.current?.focus()
    }
  }, [isSelected, isEditing, isPreviewMode])

  // Improved drag implementation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing || isPreviewMode) return
    
    console.log('Mouse down', { isEditing, isPreviewMode })
    
    // Don't prevent default immediately - let double-click work first
    e.stopPropagation()
    
    // Store initial mouse position and element position
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPosition({ x: element.x, y: element.y })
    onSelect(element.id)
    
    // Start tracking mouse movement for drag detection
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - e.clientX)
      const deltaY = Math.abs(moveEvent.clientY - e.clientY)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // Only start dragging if mouse moved more than 5 pixels
      if (distance > 5 && !isDragging) {
        setIsDragging(true)
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
        console.log('Started dragging after mouse movement')
      }
    }
    
    const handleMouseUp = () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // Clear drag timeout if it exists
      if (dragTimeout) {
        clearTimeout(dragTimeout)
        setDragTimeout(null)
      }
    }
    
    // Add temporary listeners for drag detection
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
  }, [isEditing, isPreviewMode, element.id, element.x, element.y, onSelect, isDragging, dragTimeout])

  // Handle mouse move with improved positioning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isEditing || isPreviewMode) return
      
      // Calculate how much the mouse has moved in screen coordinates
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      // Convert screen delta to PDF delta (accounting for scale)
      const pdfDeltaX = deltaX / scale
      const pdfDeltaY = deltaY / scale
      
      // Calculate new position in PDF coordinates
      const newX = initialPosition.x + pdfDeltaX
      const newY = initialPosition.y + pdfDeltaY
      
      // Constrain to PDF page bounds with some padding
      const padding = 5
      const constrainedX = Math.max(padding, Math.min(newX, pageWidth - padding))
      const constrainedY = Math.max(padding, Math.min(newY, pageHeight - padding))
      
      console.log('Drag update:', {
        mouseDelta: { x: deltaX, y: deltaY },
        pdfDelta: { x: pdfDeltaX, y: pdfDeltaY },
        newPosition: { x: newX, y: newY },
        constrained: { x: constrainedX, y: constrainedY },
        scale
      })
      
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
        console.log('Drag ended')
      }
      // Clear any pending drag timeout
      if (dragTimeout) {
        clearTimeout(dragTimeout)
        setDragTimeout(null)
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
  }, [isDragging, isEditing, isPreviewMode, dragStart, initialPosition, scale, element.id, onUpdate, pageHeight, pageWidth, dragTimeout])

  // Handle click to select
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || isPreviewMode) return
    e.preventDefault()
    e.stopPropagation() // Prevent global click handler from deselecting
    onSelect(element.id)
    // Focus the element so it can receive keyboard events
    setTimeout(() => {
      elementRef.current?.focus()
    }, 0)
  }, [element.id, onSelect, isDragging, isPreviewMode])

  // Handle double click to edit (only for non-predefined elements)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    console.log('Double click triggered', { isPreviewMode, isPredefined: element.isPredefined })
    
    if (isPreviewMode || element.isPredefined) return
    
    // Cancel any pending drag operation
    if (dragTimeout) {
      clearTimeout(dragTimeout)
      setDragTimeout(null)
    }
    setIsDragging(false)
    
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Setting editing to true')
    setIsEditing(true)
    setEditValue(element.content)
    
    // Focus input after state update
    setTimeout(() => {
      console.log('Focusing input', inputRef.current)
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 10) // Slightly longer delay
  }, [element.content, element.isPredefined, isPreviewMode, dragTimeout])

  // Handle edit save
  const handleEditSave = useCallback(() => {
    console.log('Saving edit:', editValue)
    if (editValue.trim() && !element.isPredefined) {
      onUpdate(element.id, { content: editValue.trim() })
    }
    setIsEditing(false)
  }, [element.id, element.isPredefined, editValue, onUpdate])

  // Handle click away to save edits
  useEffect(() => {
    const handleClickAway = (e: MouseEvent) => {
      // Only handle if this element is currently editing
      if (!isEditing) return
      
      const target = e.target as HTMLElement
      
      // Don't save if clicking within this element or its input
      if (elementRef.current?.contains(target) || inputRef.current?.contains(target)) {
        return
      }
      
      console.log('Click away detected, saving edit')
      handleEditSave()
    }
    
    if (isEditing) {
      // Use capture phase to ensure we get the event before others
      document.addEventListener('mousedown', handleClickAway, true)
      return () => document.removeEventListener('mousedown', handleClickAway, true)
    }
  }, [isEditing, handleEditSave])

  // Handle key press in edit mode
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    console.log('Key pressed in input:', e.key)
    
    // Only stop propagation for specific keys, allow normal text input
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleEditSave() // Save on both Enter and Escape
    }
    // Don't stop propagation for other keys to allow normal input behavior
  }, [handleEditSave])

  // Handle arrow key adjustments for fine positioning (only when NOT editing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CRITICAL: Only handle arrow keys when this element is selected AND not in edit mode AND not in preview mode
      if (!isSelected || isEditing || isPreviewMode) return

      // Don't interfere if any input, textarea, or contenteditable element is focused
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT' || 
          activeElement?.tagName === 'TEXTAREA' || 
          (activeElement as HTMLElement)?.isContentEditable) {
        return
      }

      // Make sure this element is actually the focused element
      if (activeElement !== elementRef.current) return

      const adjustment = 0.5 // 0.5 pixel adjustment
      let newX = element.x
      let newY = element.y

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          e.stopPropagation()
          newX = Math.max(0, element.x - adjustment)
          break
        case 'ArrowRight':
          e.preventDefault()
          e.stopPropagation()
          newX = Math.min(pageWidth - 20, element.x + adjustment)
          break
        case 'ArrowUp':
          e.preventDefault()
          e.stopPropagation()
          newY = Math.max(0, element.y - adjustment)
          break
        case 'ArrowDown':
          e.preventDefault()
          e.stopPropagation()
          newY = Math.min(pageHeight - 20, element.y + adjustment)
          break
        default:
          return
      }

      // Only update if position actually changed
      if (newX !== element.x || newY !== element.y) {
        onUpdate(element.id, { x: newX, y: newY })
        console.log(`Fine-tuned position: ${e.key} - new position:`, { x: newX, y: newY })
      }
    }

    // Only add event listener when element is selected, NOT editing, and NOT in preview mode
    if (isSelected && !isEditing && !isPreviewMode) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isEditing, isPreviewMode, element.id, element.x, element.y, pageWidth, pageHeight, onUpdate])

  // Calculate font styles
  const getFontStyle = useCallback(() => {
    const fontWeight = element.fontWeight || (element.bold ? 'bold' : 'normal')
    const fontStyle = element.fontStyle || (element.italic ? 'italic' : 'normal')
    const textDecoration = element.textDecoration || (element.underline ? 'underline' : 'none')

    return {
      fontFamily: element.fontFamily,
      fontSize: element.fontSize * scale,
      color: element.color,
      fontWeight,
      fontStyle,
      textDecoration,
      letterSpacing: element.letterSpacing ? `${element.letterSpacing * scale}px` : 'normal',
      wordSpacing: element.wordSpacing ? `${element.wordSpacing * scale}px` : 'normal',
      lineHeight: element.lineHeight || 1.2,
      textAlign: element.textAlign || 'left',
      textTransform: element.textTransform || 'none',
      textShadow: element.textShadow || 'none',
      backgroundColor: element.backgroundColor || 'transparent',
      borderRadius: element.borderRadius ? `${element.borderRadius * scale}px` : '3px',
      padding: element.padding ? `${element.padding * scale}px` : '2px 4px',
      opacity: element.opacity !== undefined ? element.opacity : 1,
      margin: 0,
      minWidth: '30px',
      minHeight: '20px',
      whiteSpace: 'nowrap' as const,
      userSelect: isEditing ? 'text' as const : 'none' as const,
    }
  }, [element, scale, isEditing])

  const getElementStyle = () => {
    const baseStyle = {
      ...getFontStyle(),
      position: 'relative' as const,
      display: 'inline-block',
      zIndex: isSelected ? 1001 : 1000,
      outline: 'none', // Remove default focus outline
    }

    if (isPreviewMode) {
      // Preview mode: clean, no interaction
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'default',
        boxShadow: 'none',
      }
    }

    if (isEditing) {
      // Edit mode: minimal styling to avoid interfering with input
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'text',
        padding: '0',
        margin: '0',
        borderRadius: '6px',
        // Add subtle background glow for edit mode
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.08)',
      }
    }

    // Simple interactive styling for non-editing mode
    const interactiveStyle = {
      cursor: isDragging ? 'grabbing' : 'grab',
      borderRadius: '6px',
      padding: '4px 8px',
      margin: '-4px -8px', // Offset padding for precise positioning
      transition: isDragging ? 'none' : 'all 0.15s ease',
      boxShadow: isSelected 
        ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(59, 130, 246, 0.3)'
        : '0 2px 4px rgba(0, 0, 0, 0.1)',
    }

    // Predefined elements styling (green theme)
    if (element.isPredefined) {
      return {
        ...baseStyle,
        ...interactiveStyle,
        backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.06)',
        border: isSelected ? '2px solid rgb(34, 197, 94)' : '1px solid rgba(34, 197, 94, 0.4)',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isSelected 
          ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(34, 197, 94, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }

    // Regular elements styling (blue theme)
    return {
      ...baseStyle,
      ...interactiveStyle,
      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.06)',
      border: isSelected ? '2px solid rgb(59, 130, 246)' : '1px solid rgba(59, 130, 246, 0.4)',
    }
  }

  return (
    <div
      ref={elementRef}
      onClick={isEditing ? undefined : handleClick}
      onDoubleClick={isEditing ? undefined : handleDoubleClick}
      onMouseDown={isEditing ? undefined : handleMouseDown}
      style={getElementStyle()}
      className="text-element"
      tabIndex={isSelected && !isPreviewMode && !isEditing ? 0 : -1}
      title={
        element.isPredefined 
          ? "Predefined text (drag to move)" 
          : (isPreviewMode ? "" : "Double-click to edit, drag to move")
      }
    >
      {isEditing && !element.isPredefined ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            console.log('Input change:', e.target.value)
            setEditValue(e.target.value)
          }}
          onKeyDown={handleKeyPress}
          className="bg-transparent outline-none border-none p-0 m-0"
          style={{
            fontFamily: element.fontFamily,
            fontSize: element.fontSize * scale,
            color: element.color,
            fontWeight: element.bold ? 'bold' : 'normal',
            fontStyle: element.italic ? 'italic' : 'normal',
            textDecoration: element.underline ? 'underline' : 'none',
            width: `${Math.max(editValue.length * 0.8, 4)}em`,
            minWidth: '50px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            padding: '4px 6px',
            pointerEvents: 'auto',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          autoFocus
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span>
          {element.content || 'Empty Text'}
        </span>
      )}
    </div>
  )
}