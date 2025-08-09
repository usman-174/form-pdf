
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Updated interface to match your TextElement interface
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

// Font mapping for pdf-lib with better font handling
const getFontForFamily = async (pdfDoc: PDFDocument, fontFamily: string, isBold: boolean = false, isItalic: boolean = false, fontWeight?: number, fontStyle?: string) => {
  const family = fontFamily.toLowerCase()
  
  // Determine if bold/italic from fontWeight and fontStyle if provided
  const determinedBold = fontWeight ? fontWeight >= 600 : isBold
  const determinedItalic = fontStyle ? fontStyle === 'italic' || fontStyle === 'oblique' : isItalic
  
  try {
    // Handle font variations
    if (family.includes('times') || family.includes('roman')) {
      if (determinedBold && determinedItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
      if (determinedBold) return await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      if (determinedItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
      return await pdfDoc.embedFont(StandardFonts.TimesRoman)
    }
    
    if (family.includes('courier')) {
      if (determinedBold && determinedItalic) return await pdfDoc.embedFont(StandardFonts.CourierBoldOblique)
      if (determinedBold) return await pdfDoc.embedFont(StandardFonts.CourierBold)
      if (determinedItalic) return await pdfDoc.embedFont(StandardFonts.CourierOblique)
      return await pdfDoc.embedFont(StandardFonts.Courier)
    }
    
    // Default to Helvetica
    if (determinedBold && determinedItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
    if (determinedBold) return await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    if (determinedItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    return await pdfDoc.embedFont(StandardFonts.Helvetica)
    
  } catch (error) {
    console.warn('Font loading failed, falling back to Helvetica:', error)
    return await pdfDoc.embedFont(StandardFonts.Helvetica)
  }
}

// Core function to generate PDF with text elements
async function generatePDFWithText(
  pdfData: ArrayBuffer,
  elements: TextElement[]
): Promise<PDFDocument> {
  console.log('Starting PDF generation with elements:', elements)
  
  // Validate input
  if (!pdfData || !elements) {
    throw new Error('Invalid input: pdfData and elements are required')
  }
  
  // Convert ArrayBuffer to Uint8Array
  const pdfBytes = new Uint8Array(pdfData)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  
  console.log('PDF loaded successfully, pages:', pdfDoc.getPageCount())

  // Group elements by page for efficient processing
  const elementsByPage = elements.reduce((acc, element) => {
    if (!acc[element.pageNumber]) {
      acc[element.pageNumber] = []
    }
    acc[element.pageNumber].push(element)
    return acc
  }, {} as Record<number, TextElement[]>)

  // Process each page
  for (const [pageNumberStr, pageElements] of Object.entries(elementsByPage)) {
    const pageNumber = parseInt(pageNumberStr)
    const pageIndex = pageNumber - 1
    
    // Validate page exists
    if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
      console.warn(`Page ${pageNumber} is out of range, skipping elements`)
      continue
    }

    const page = pdfDoc.getPage(pageIndex)
    const { width, height } = page.getSize()
    
    console.log(`=== PDF GENERATION PAGE DIMENSIONS ===`)
    console.log(`Processing page ${pageNumber}`)
    console.log('Method: page.getSize() - PDF generation')
    console.log('Dimensions:', { width, height })
    console.log('========================================')

    // Process elements on this page
    for (const element of pageElements) {
      try {
        console.log('Processing element:', element)
        
        // Validate element data
        if (!validateTextElement(element)) {
          console.warn('Skipping invalid element:', element)
          continue
        }

        // Get the appropriate font
        const font = await getFontForFamily(pdfDoc, element.fontFamily, element.bold, element.italic, element.fontWeight, element.fontStyle)

        // COORDINATE SYSTEM FIX for fixed 120% zoom:
        // The application now uses a fixed 1.2 (120%) zoom level
        // Applying compensation offsets based on this fixed zoom
        
        // Manual offset values - fine-tuned for 120% zoom:
        const xOffset = -0.1     // Compensate for -1 X offset (move right by 1)
        const yOffset = -4     // Compensate for +4 Y offset (move up by 4)  
        const baselineMultiplier = 0.85  // Adjusted for 120% zoom scaling
        const minMargin = 0    // Minimum distance from PDF edges
        
        // Use coordinates directly (they're already scale-independent)
        const x = Math.max(minMargin, element.x + xOffset)
        
        // CRITICAL Y-COORDINATE FIX:
        // PDF coordinate system: origin at bottom-left, Y increases upward
        // Viewer coordinate system: origin at top-left, Y increases downward  
        // element.y is stored as viewer coordinates (top-left origin)
        // We need to convert to PDF coordinates (bottom-left origin)
        const y = Math.max(minMargin, height - element.y - (element.fontSize * baselineMultiplier) + yOffset)

        console.log('Drawing text at position:', { 
          x, 
          y, 
          text: element.content,
          originalY: element.y,
          pageHeight: height,
          fontSize: element.fontSize,
          baselineMultiplier,
          'Y calculation breakdown': {
            'height': height,
            'element.y': element.y, 
            'fontSize * baselineMultiplier': element.fontSize * baselineMultiplier,
            'yOffset': yOffset,
            'final calculation': `${height} - ${element.y} - ${element.fontSize * baselineMultiplier} + ${yOffset} = ${y}`
          }
        })

        // Convert hex color to RGB
        const color = hexToRgb(element.color)
        
        // Apply text transformations
        let processedContent = element.content
        if (element.textTransform) {
          switch (element.textTransform) {
            case 'uppercase':
              processedContent = processedContent.toUpperCase()
              break
            case 'lowercase':
              processedContent = processedContent.toLowerCase()
              break
            case 'capitalize':
              processedContent = processedContent.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
              break
          }
        }
        
        // Handle opacity
        const opacity = element.opacity !== undefined ? element.opacity : 1
        
        // Create text options with advanced formatting
        const textOptions = {
          x,
          y,
          size: element.fontSize,
          font,
          color: rgb(color.r / 255, color.g / 255, color.b / 255),
          opacity,
        }

        // Handle letter spacing and word spacing by drawing characters/words individually
        if ((element.letterSpacing && element.letterSpacing !== 0) || (element.wordSpacing && element.wordSpacing !== 0)) {
          const letterSpacing = element.letterSpacing || 0
          const wordSpacing = element.wordSpacing || 0
          
          let currentX = x
          const words = processedContent.split(' ')
          
          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex]
            
            // Handle letter spacing within words
            if (letterSpacing !== 0) {
              for (let charIndex = 0; charIndex < word.length; charIndex++) {
                const char = word[charIndex]
                page.drawText(char, {
                  ...textOptions,
                  x: currentX,
                })
                
                // Move to next character position
                const charWidth = estimateCharWidth(char, element.fontSize, element.fontFamily)
                currentX += charWidth + letterSpacing
              }
            } else {
              // Draw whole word
              page.drawText(word, {
                ...textOptions,
                x: currentX,
              })
              
              // Move to end of word
              const wordWidth = estimateTextWidth(word, element.fontSize, element.fontFamily)
              currentX += wordWidth
            }
            
            // Add space between words (if not the last word)
            if (wordIndex < words.length - 1) {
              const spaceWidth = estimateCharWidth(' ', element.fontSize, element.fontFamily)
              currentX += spaceWidth + wordSpacing
            }
          }
        } else {
          // Draw text normally without spacing adjustments
          page.drawText(processedContent, textOptions)
        }
        
        // Handle text decorations
        const textWidth = estimateTextWidth(processedContent, element.fontSize, element.fontFamily)
        
        // Determine which decoration to apply (priority: textDecoration over legacy underline)
        const decoration = element.textDecoration || (element.underline ? 'underline' : 'none')
        
        if (decoration === 'underline') {
          const underlineY = y - 2
          page.drawLine({
            start: { x, y: underlineY },
            end: { x: x + textWidth, y: underlineY },
            thickness: 1,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
            opacity,
          })
        } else if (decoration === 'line-through') {
          const strikethroughY = y + (element.fontSize * 0.3)
          page.drawLine({
            start: { x, y: strikethroughY },
            end: { x: x + textWidth, y: strikethroughY },
            thickness: 1,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
            opacity,
          })
        } else if (decoration === 'overline') {
          const overlineY = y + element.fontSize
          page.drawLine({
            start: { x, y: overlineY },
            end: { x: x + textWidth, y: overlineY },
            thickness: 1,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
            opacity,
          })
        }
        
        console.log('Successfully drew text:', element.content)

      } catch (elementError) {
        console.error('Error processing element:', element, elementError)
        // Continue with other elements even if one fails
      }
    }
  }

  return pdfDoc
}

// Function for downloading PDF
export async function downloadPDFWithText(
  pdfData: ArrayBuffer,
  elements: TextElement[]
): Promise<Blob> {
  try {
    const pdfDoc = await generatePDFWithText(pdfData, elements)
    
    console.log('Saving PDF...')
    const pdfBytesResult = await pdfDoc.save()
    
    console.log('PDF saved successfully, size:', pdfBytesResult.length)
    
    // Return as Blob for download
    return new Blob([pdfBytesResult], { type: 'application/pdf' })

  } catch (error) {
    console.error('Error in downloadPDFWithText:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}
// Function for preview - returns ArrayBuffer for PDF viewer
export async function previewPDFWithText(
  pdfData: ArrayBuffer,
  elements: TextElement[]
): Promise<ArrayBuffer> {
  try {
    const pdfDoc = await generatePDFWithText(pdfData, elements)
    
    console.log('Generating preview PDF...')
    const pdfBytesResult = await pdfDoc.save()
    
    console.log('Preview PDF generated successfully, size:', pdfBytesResult.length)
    
    // pdfBytesResult is a Uint8Array, we need to convert it to ArrayBuffer
    // Create a new ArrayBuffer to avoid SharedArrayBuffer issues
    const arrayBuffer = new ArrayBuffer(pdfBytesResult.length)
    const view = new Uint8Array(arrayBuffer)
    view.set(pdfBytesResult)
    return arrayBuffer

  } catch (error) {
    console.error('Error in previewPDFWithText:', error)
    throw new Error(`Failed to generate preview PDF: ${error.message}`)
  }
}

// Helper function to convert hex color to RGB with better error handling
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present and handle short hex codes
  const sanitized = hex.replace(/^#/, '').trim()
  
  // Handle empty or invalid input
  if (!sanitized) {
    console.warn('Empty color value, using black')
    return { r: 0, g: 0, b: 0 }
  }
  
  let r, g, b
  
  if (sanitized.length === 3) {
    // Handle short hex codes like #fff
    r = parseInt(sanitized.charAt(0) + sanitized.charAt(0), 16)
    g = parseInt(sanitized.charAt(1) + sanitized.charAt(1), 16)
    b = parseInt(sanitized.charAt(2) + sanitized.charAt(2), 16)
  } else if (sanitized.length === 6) {
    // Handle full hex codes like #ffffff
    const bigint = parseInt(sanitized, 16)
    r = (bigint >> 16) & 255
    g = (bigint >> 8) & 255
    b = bigint & 255
  } else {
    // Fallback to black for invalid colors
    console.warn('Invalid color format:', hex)
    return { r: 0, g: 0, b: 0 }
  }

  // Validate RGB values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn('Invalid RGB values for color:', hex)
    return { r: 0, g: 0, b: 0 }
  }

  return { r, g, b }
}

// Enhanced function to analyze PDF for default font properties
export async function analyzePDFForDefaultFont(
  pdfData: ArrayBuffer, 
  pageNumber: number = 1
): Promise<{
  fontSize: number
  fontFamily: string
  color: string
}> {
  try {
    console.log(`Analyzing PDF for default font on page ${pageNumber}`)
    
    // For now, return sensible defaults
    // In a more advanced implementation, you could analyze the PDF content
    // to extract font information from existing text using pdf-lib or PDF.js
    
    return {
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
    }
  } catch (error) {
    console.warn('Error analyzing PDF font, using defaults:', error)
    return {
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
    }
  }
}

// Utility function for font size estimation with better accuracy
export function estimateTextWidth(text: string, fontSize: number, fontFamily: string): number {
  // More accurate text width estimation based on font family
  let avgCharWidth = fontSize * 0.6 // Default ratio
  
  const family = fontFamily.toLowerCase()
  if (family.includes('courier')) {
    avgCharWidth = fontSize * 0.6 // Monospace font
  } else if (family.includes('times')) {
    avgCharWidth = fontSize * 0.5 // Times is narrower
  } else {
    avgCharWidth = fontSize * 0.55 // Helvetica/Arial
  }
  
  return text.length * avgCharWidth
}

// Utility function for single character width estimation
export function estimateCharWidth(char: string, fontSize: number, fontFamily: string): number {
  const family = fontFamily.toLowerCase()
  let charWidthRatio = 0.55 // Default ratio for Helvetica/Arial
  
  if (family.includes('courier')) {
    charWidthRatio = 0.6 // Monospace font - all chars same width
  } else if (family.includes('times')) {
    charWidthRatio = 0.5 // Times is narrower
    
    // Adjust for specific characters in Times
    if (char === 'i' || char === 'l' || char === 't' || char === 'f') {
      charWidthRatio = 0.3 // Narrow characters
    } else if (char === 'm' || char === 'w' || char === 'M' || char === 'W') {
      charWidthRatio = 0.8 // Wide characters
    }
  } else {
    // Helvetica/Arial character width adjustments
    if (char === 'i' || char === 'l' || char === 't' || char === 'f') {
      charWidthRatio = 0.3 // Narrow characters
    } else if (char === 'm' || char === 'w' || char === 'M' || char === 'W') {
      charWidthRatio = 0.7 // Wide characters
    }
  }
  
  return fontSize * charWidthRatio
}

// Improved text metrics calculation
export function getTextMetrics(fontSize: number, fontFamily: string) {
  // These are approximate values based on typical font metrics
  const family = fontFamily.toLowerCase()
  
  let ascenderRatio = 0.8
  let descenderRatio = 0.2
  
  if (family.includes('times')) {
    ascenderRatio = 0.75
    descenderRatio = 0.25
  } else if (family.includes('courier')) {
    ascenderRatio = 0.8
    descenderRatio = 0.2
  }
  
  const textHeight = fontSize * ascenderRatio
  const descenderHeight = fontSize * descenderRatio
  const totalHeight = fontSize
  
  return {
    baselineOffset: descenderHeight,
    textHeight,
    totalHeight,
    ascenderRatio,
    descenderRatio,
    // Y adjustment to position text correctly (distance from top to baseline)
    yAdjustment: textHeight
  }
}

// Enhanced validation function
export function validateTextElement(element: unknown): element is TextElement {
  if (!element || typeof element !== 'object') return false
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = element as any
  const isValid = (
    typeof el.id === 'string' && el.id.length > 0 &&
    typeof el.content === 'string' &&
    typeof el.x === 'number' && isFinite(el.x) && el.x >= 0 &&
    typeof el.y === 'number' && isFinite(el.y) && el.y >= 0 &&
    typeof el.fontSize === 'number' && isFinite(el.fontSize) && el.fontSize > 0 &&
    typeof el.fontFamily === 'string' && el.fontFamily.length > 0 &&
    typeof el.color === 'string' && el.color.length > 0 &&
    typeof el.bold === 'boolean' &&
    typeof el.italic === 'boolean' &&
    typeof el.underline === 'boolean' &&
    typeof el.pageNumber === 'number' && isFinite(el.pageNumber) && el.pageNumber > 0
  )
  
  if (!isValid) {
    console.warn('Element validation failed:', element)
  }
  
  return isValid
}

// Helper function to sanitize text content
export function sanitizeTextContent(content: string): string {
  if (typeof content !== 'string') return ''
  
  return content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
}