'use client'

import { useCallback } from 'react'
import { TextElement } from '@/app/page'

interface ControlsProps {
  selectedElement: TextElement | null
  onAddText: () => void
  onUpdateElement: (id: string, updates: Partial<TextElement>) => void
  onDeleteElement: (id: string) => void
  onDownload: () => void
  onPreview: () => void
  isLoading: boolean
  isPreviewMode: boolean
}

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
]

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48]

const PRESET_COLORS = [
  '#000000', '#333333', '#666666', '#999999',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080'
]

export default function Controls({
  selectedElement,
  onAddText,
  onUpdateElement,
  onDeleteElement,
  onDownload,
  onPreview,
  isLoading,
  isPreviewMode
}: ControlsProps) {

  // Handle font family change
  const handleFontFamilyChange = useCallback((value: string) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { fontFamily: value })
    }
  }, [selectedElement, onUpdateElement])

  // Handle font size change
  const handleFontSizeChange = useCallback((value: number) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { fontSize: value })
    }
  }, [selectedElement, onUpdateElement])

  // Handle color change
  const handleColorChange = useCallback((value: string) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { color: value })
    }
  }, [selectedElement, onUpdateElement])

  // Handle style toggles
  const handleBoldToggle = useCallback(() => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { bold: !selectedElement.bold })
    }
  }, [selectedElement, onUpdateElement])

  const handleItalicToggle = useCallback(() => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { italic: !selectedElement.italic })
    }
  }, [selectedElement, onUpdateElement])

  const handleUnderlineToggle = useCallback(() => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { underline: !selectedElement.underline })
    }
  }, [selectedElement, onUpdateElement])

  // Handle delete
  const handleDelete = useCallback(() => {
    if (selectedElement && confirm('Delete this text element?')) {
      onDeleteElement(selectedElement.id)
    }
  }, [selectedElement, onDeleteElement])

  return (
    <div className="space-y-6">
      {/* Add Text Button - Only show in edit mode */}
      {!isPreviewMode && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <button
            onClick={onAddText}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            + Add Text
          </button>
        </div>
      )}

      {/* Text Formatting Controls - Only show in edit mode */}
      {!isPreviewMode && selectedElement ? (
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">
            Text Formatting
          </h3>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Family
            </label>
            <select
              value={selectedElement.fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONT_FAMILIES.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Size
            </label>
            <select
              value={selectedElement.fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONT_SIZES.map(size => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Font Style Toggles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Style
            </label>
            <div className="flex space-x-2">
              <button
                onClick={handleBoldToggle}
                className={`px-3 py-2 rounded border text-sm font-bold ${
                  selectedElement.bold
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                B
              </button>
              <button
                onClick={handleItalicToggle}
                className={`px-3 py-2 rounded border text-sm italic ${
                  selectedElement.italic
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                I
              </button>
              <button
                onClick={handleUnderlineToggle}
                className={`px-3 py-2 rounded border text-sm underline ${
                  selectedElement.underline
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                U
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            
            {/* Preset Colors */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    selectedElement.color === color
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedElement.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-2 border-t">
            <button
              onClick={handleDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete Text
            </button>
          </div>
        </div>
      ) : !isPreviewMode ? (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center text-gray-500 py-8">
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="text-sm">
              Select a text element to edit its formatting
            </p>
          </div>
        </div>
      ) : null}

      {/* Preview/Download Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
        {/* Preview Button */}
       

        {/* Download Button */}
        <button
          onClick={onDownload}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

   
      

      {/* Instructions */}
      {!isPreviewMode && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Add Text" to create new text</li>
            <li>• Drag text elements to position them</li>
            <li>• Double-click text to edit content</li>
            <li>• Click text to select and format it</li>
            <li>• Use "Preview PDF" to see final result</li>
            <li>• Use "Download PDF" to save changes</li>
          </ul>
        </div>
      )}
    </div>
  )
}