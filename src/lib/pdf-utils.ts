
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
}

// Font mapping for pdf-lib with better font handling
const getFontForFamily = async (pdfDoc: PDFDocument, fontFamily: string, isBold: boolean = false, isItalic: boolean = false) => {
  const family = fontFamily.toLowerCase()
  
  try {
    // Handle font variations
    if (family.includes('times') || family.includes('roman')) {
      if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
      if (isBold) return await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      if (isItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
      return await pdfDoc.embedFont(StandardFonts.TimesRoman)
    }
    
    if (family.includes('courier')) {
      if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.CourierBoldOblique)
      if (isBold) return await pdfDoc.embedFont(StandardFonts.CourierBold)
      if (isItalic) return await pdfDoc.embedFont(StandardFonts.CourierOblique)
      return await pdfDoc.embedFont(StandardFonts.Courier)
    }
    
    // Default to Helvetica
    if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
    if (isBold) return await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    if (isItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    return await pdfDoc.embedFont(StandardFonts.Helvetica)
    
  } catch (error) {
    console.warn('Font loading failed, falling back to Helvetica:', error)
    return await pdfDoc.embedFont(StandardFonts.Helvetica)
  }
}

// Core function to generate PDF with text elements
async function generatePDFWithText(
<<<<<<< HEAD
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
    
    console.log(`Processing page ${pageNumber} with dimensions:`, { width, height })

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
        const font = await getFontForFamily(pdfDoc, element.fontFamily, element.bold, element.italic)

        // FIXED: Calculate position correctly
        // The element.x and element.y are in PDF coordinate space (origin at top-left)
        // PDF coordinate system has origin at bottom-left, so we need to convert
        const x = Math.max(0, element.x)
        // Convert Y coordinate: PDF origin is bottom-left, viewer origin is top-left
        // We need to flip the Y coordinate and account for text positioning
        const y = Math.max(0, height - element.y - (element.fontSize * 0.75))

        console.log('Drawing text at position:', { 
          x, 
          y, 
          text: element.content,
          originalY: element.y,
          pageHeight: height,
          fontSize: element.fontSize
        })

        // Convert hex color to RGB
        const color = hexToRgb(element.color)
        
        // Create text options
        const textOptions: any = {
          x,
          y,
          size: element.fontSize,
          font,
          color: rgb(color.r / 255, color.g / 255, color.b / 255),
        }

        // Draw the text
        page.drawText(element.content, textOptions)
        
        // Handle underline if needed (pdf-lib doesn't support text decoration directly)
        if (element.underline) {
          const textWidth = estimateTextWidth(element.content, element.fontSize, element.fontFamily)
          const underlineY = y - 2 // Position underline slightly below baseline
          
          page.drawLine({
            start: { x, y: underlineY },
            end: { x: x + textWidth, y: underlineY },
            thickness: 1,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
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
=======
  pdfData: ArrayBuffer,
  elements: TextElement[]
): Promise<PDFDocument> {
  console.log('Starting PDF generation with elements:', elements)
  
  // Convert ArrayBuffer to Uint8Array
  const pdfBytes = new Uint8Array(pdfData)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  
  console.log('PDF loaded successfully, pages:', pdfDoc.getPageCount())

  // Process each text element
  for (const element of elements) {
    try {
      console.log('Processing element:', element)
      
      // Validate element data
      if (!element || typeof element.pageNumber !== 'number' || !element.content) {
        console.warn('Skipping invalid element:', element)
        continue
      }

      // Get the page (pageNumber is 1-based, but getPage is 0-based)
      const pageIndex = element.pageNumber - 1
      if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
        console.warn(`Page ${element.pageNumber} is out of range, skipping element:`, element)
        continue
      }

      const page = pdfDoc.getPage(pageIndex)
      const { width, height } = page.getSize()
      
      console.log(`Page ${element.pageNumber} dimensions:`, { width, height })

      // Get the appropriate font
      let font
      try {
        font = await getFontForFamily(pdfDoc, element.fontFamily)
      } catch (fontError) {
        console.warn('Font loading failed, using default:', fontError)
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      }

      // Calculate position (PDF coordinate system has origin at bottom-left)
      // Use better text metrics for accurate positioning
      const textMetrics = getTextMetrics(element.fontSize, element.fontFamily)
      const x = element.x
      const y = (height - element.y - textMetrics.yAdjustment) - 4.5

      console.log('Drawing text at position:', { x, y, text: element.content })

      // Convert hex color to RGB
      const color = hexToRgb(element.color)
      
      // Create text options
      const textOptions: any = {
        x,
        y,
        size: element.fontSize,
        font,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
      }

      // Draw the text
      page.drawText(element.content, textOptions)
      
      console.log('Successfully drew text:', element.content)

    } catch (elementError) {
      console.error('Error processing element:', element, elementError)
      // Continue with other elements even if one fails
    }
  }

  return pdfDoc
}

// Function for downloading PDF
export async function downloadPDFWithText(
  pdfData: ArrayBuffer,
  elements: TextElement[]
>>>>>>> 2aea910a7c39968daefea0c9458c84f7e561e985
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
// New function for preview - returns ArrayBuffer for PDF viewer
export async function previewPDFWithText(
  pdfData: ArrayBuffer,
  elements: TextElement[]
): Promise<ArrayBuffer| any> {
  try {
    const pdfDoc = await generatePDFWithText(pdfData, elements)
    
    console.log('Generating preview PDF...')
    const pdfBytesResult = await pdfDoc.save()
    
    console.log('Preview PDF generated successfully, size:', pdfBytesResult.length)
    
    // pdfBytesResult is a Uint8Array, we need to convert it to ArrayBuffer
    return pdfBytesResult.buffer.slice(
      pdfBytesResult.byteOffset, 
      pdfBytesResult.byteOffset + pdfBytesResult.byteLength
    )

  } catch (error) {
    console.error('Error in previewPDFWithText:', error)
    throw new Error(`Failed to generate preview PDF: ${error.message}`)
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
    return pdfBytesResult.buffer.slice(
      pdfBytesResult.byteOffset, 
      pdfBytesResult.byteOffset + pdfBytesResult.byteLength
    )

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

<<<<<<< HEAD
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
=======
// New utility function for better text positioning
export function getTextMetrics(fontSize: number, fontFamily: string) {
  // These are approximate values based on typical font metrics
  const baselineOffset = fontSize * 0.2 // Distance from bottom of text to baseline
  const textHeight = fontSize * 0.8 // Actual visible text height
  const totalHeight = fontSize // Total line height
  
  return {
    baselineOffset,
    textHeight,
    totalHeight,
    // Y adjustment to position text correctly
>>>>>>> 2aea910a7c39968daefea0c9458c84f7e561e985
    yAdjustment: textHeight
  }
}

<<<<<<< HEAD
// Enhanced validation function
=======
// Additional utility function for validation
>>>>>>> 2aea910a7c39968daefea0c9458c84f7e561e985
export function validateTextElement(element: any): element is TextElement {
  if (!element) return false
  
  const isValid = (
    typeof element.id === 'string' && element.id.length > 0 &&
    typeof element.content === 'string' &&
    typeof element.x === 'number' && isFinite(element.x) && element.x >= 0 &&
    typeof element.y === 'number' && isFinite(element.y) && element.y >= 0 &&
    typeof element.fontSize === 'number' && isFinite(element.fontSize) && element.fontSize > 0 &&
    typeof element.fontFamily === 'string' && element.fontFamily.length > 0 &&
    typeof element.color === 'string' && element.color.length > 0 &&
    typeof element.bold === 'boolean' &&
    typeof element.italic === 'boolean' &&
    typeof element.underline === 'boolean' &&
    typeof element.pageNumber === 'number' && isFinite(element.pageNumber) && element.pageNumber > 0
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

// Export type for external use
export type { TextElement }