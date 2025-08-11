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

  // Handle advanced formatting
  const handleLetterSpacingChange = useCallback((value: number) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { letterSpacing: value })
    }
  }, [selectedElement, onUpdateElement])

  const handleWordSpacingChange = useCallback((value: number) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { wordSpacing: value })
    }
  }, [selectedElement, onUpdateElement])

  const handleLineHeightChange = useCallback((value: number) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { lineHeight: value })
    }
  }, [selectedElement, onUpdateElement])

  const handleTextAlignChange = useCallback((value: 'left' | 'center' | 'right' | 'justify') => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { textAlign: value })
    }
  }, [selectedElement, onUpdateElement])

  const handleTextTransformChange = useCallback((value: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { textTransform: value })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontWeightChange = useCallback((value: number) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { fontWeight: value })
    }
  }, [selectedElement, onUpdateElement])

  return (
    <div className="space-y-6" data-controls-panel>
      {/* Add Text Button - Only show in edit mode */}
      {!isPreviewMode && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <button
            onClick={onAddText}
            disabled={isLoading}
            title="Add new text element to the center of the PDF (Keyboard shortcut: T)"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center group hover:shadow-lg transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Text
            <span className="ml-2 text-xs bg-blue-500 px-1.5 py-0.5 rounded opacity-75">T</span>
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className={`px-3 py-2 rounded border text-sm font-bold transition-colors ${
                  selectedElement.bold
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                }`}
              >
                B
              </button>
              <button
                onClick={handleItalicToggle}
                className={`px-3 py-2 rounded border text-sm italic transition-colors ${
                  selectedElement.italic
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                }`}
              >
                I
              </button>
              <button
                onClick={handleUnderlineToggle}
                className={`px-3 py-2 rounded border text-sm underline transition-colors ${
                  selectedElement.underline
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
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
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Advanced Typography */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700">Advanced Typography</h4>
            
            {/* Letter Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Letter Spacing
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="-2"
                  max="10"
                  step="0.1"
                  value={selectedElement.letterSpacing || 0}
                  onChange={(e) => handleLetterSpacingChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-12 text-right">
                  {(selectedElement.letterSpacing || 0).toFixed(1)}px
                </span>
              </div>
            </div>

            {/* Word Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word Spacing
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="-5"
                  max="20"
                  step="0.1"
                  value={selectedElement.wordSpacing || 0}
                  onChange={(e) => handleWordSpacingChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-12 text-right">
                  {(selectedElement.wordSpacing || 0).toFixed(1)}px
                </span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line Height
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={selectedElement.lineHeight || 1.2}
                  onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-12 text-right">
                  {(selectedElement.lineHeight || 1.2).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Alignment
              </label>
              <div className="flex space-x-1">
                {[
                  { value: 'left', icon: 'L', title: 'Left' },
                  { value: 'center', icon: 'C', title: 'Center' },
                  { value: 'right', icon: 'R', title: 'Right' },
                  { value: 'justify', icon: 'J', title: 'Justify' }
                ].map((align) => (
                  <button
                    key={align.value}
                    onClick={() => handleTextAlignChange(align.value as 'left' | 'center' | 'right' | 'justify')}
                    className={`px-3 py-2 rounded border text-sm transition-colors ${
                      (selectedElement.textAlign || 'left') === align.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                    title={align.title}
                  >
                    {align.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Transform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Transform
              </label>
              <select
                value={selectedElement.textTransform || 'none'}
                onChange={(e) => handleTextTransformChange(e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>

            {/* Font Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Weight
              </label>
              <select
                value={selectedElement.fontWeight || (selectedElement.bold ? 700 : 400)}
                onChange={(e) => handleFontWeightChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={100}>100 - Thin</option>
                <option value={200}>200 - Extra Light</option>
                <option value={300}>300 - Light</option>
                <option value={400}>400 - Normal</option>
                <option value={500}>500 - Medium</option>
                <option value={600}>600 - Semi Bold</option>
                <option value={700}>700 - Bold</option>
                <option value={800}>800 - Extra Bold</option>
                <option value={900}>900 - Black</option>
              </select>
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
        <button
          onClick={onPreview}
          disabled={isLoading}
          title={isPreviewMode ? "Exit Preview Mode" : "Preview PDF (Ctrl/Cmd + P)"}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
            isPreviewMode 
              ? 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isPreviewMode ? 'Exiting Preview...' : 'Generating Preview...'}
            </>
          ) : (
            <>
              {isPreviewMode ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Exit Preview
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview PDF
                </>
              )}
            </>
          )}
        </button>

        {/* Download Button - Disabled during development */}
        <button
          onClick={() => {
            alert('Download feature is temporarily disabled during development phase. Please use Preview to view your changes.')
          }}
          disabled={true}
          className="w-full bg-gray-400 text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF (Dev Mode)
        </button>
      </div>

      {/* Preview Mode Info */}
      {isPreviewMode && (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div className="text-xs text-purple-700">
              <div className="font-medium mb-1">Preview Mode Active</div>
              <div>• Viewing final PDF with all text applied</div>
              <div>• No editing allowed in this mode</div>
              <div>• Click &quot;Exit Preview&quot; to return to editing</div>
              <div>• Download feature disabled during development</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      {!isPreviewMode && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Guide
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">Adding Text:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Click &quot;Add Text&quot; or press <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs">T</kbd></li>
                <li>• Double-click anywhere on PDF</li>
                <li>• Drag text from predefined panel</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">Editing Text:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Double-click text to edit content</li>
                <li>• Click text to select & format</li>
                <li>• Drag text to reposition</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">Keyboard Shortcuts:</h5>
              <ul className="space-y-1 text-xs">
                <li>• <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs">Ctrl/Cmd + P</kbd> Preview</li>
                <li>• <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs">Delete</kbd> Remove selected</li>
                <li>• <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs">Esc</kbd> Deselect</li>
                <li>• <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs">1</kbd><kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs ml-0.5">2</kbd><kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs ml-0.5">3</kbd> Add predefined texts</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">Fine Positioning:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Use arrow keys when text is selected</li>
                <li>• Preview shows final result</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}