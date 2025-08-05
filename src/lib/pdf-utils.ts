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
}

// Font mapping for pdf-lib
const getFontForFamily = async (pdfDoc: PDFDocument, fontFamily: string) => {
  switch (fontFamily.toLowerCase()) {
    case 'times':
    case 'times new roman':
      return await pdfDoc.embedFont(StandardFonts.TimesRoman)
    case 'courier':
    case 'courier new':
      return await pdfDoc.embedFont(StandardFonts.Courier)
    case 'arial':
    case 'helvetica':
    default:
      return await pdfDoc.embedFont(StandardFonts.Helvetica)
  }
}

// Updated function to work with TextElement interface
export async function downloadPDFWithText(
  pdfData: ArrayBuffer,
  elements: TextElement[]
): Promise<Blob> {
  try {
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
        const x = element.x
        const y = height - element.y - element.fontSize // Flip Y coordinate

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

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present and handle short hex codes
  const sanitized = hex.replace(/^#/, '')
  
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
    // For now, return sensible defaults
    // In a more advanced implementation, you could analyze the PDF content
    // to extract font information from existing text
    
    console.log(`Analyzing PDF for default font on page ${pageNumber}`)
    
    return {
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000',
    }
  } catch (error) {
    console.warn('Error analyzing PDF font, using defaults:', error)
    return {
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
    }
  }
}

// Additional utility function for font size estimation
export function estimateTextWidth(text: string, fontSize: number, fontFamily: string): number {
  // Rough estimation - in a real app you might want more accurate text measurement
  const avgCharWidth = fontSize * 0.6 // Approximate character width
  return text.length * avgCharWidth
}

// Additional utility function for validation
export function validateTextElement(element: any): element is TextElement {
  return (
    element &&
    typeof element.id === 'string' &&
    typeof element.content === 'string' &&
    typeof element.x === 'number' &&
    typeof element.y === 'number' &&
    typeof element.fontSize === 'number' &&
    typeof element.fontFamily === 'string' &&
    typeof element.color === 'string' &&
    typeof element.bold === 'boolean' &&
    typeof element.italic === 'boolean' &&
    typeof element.underline === 'boolean' &&
    typeof element.pageNumber === 'number' &&
    element.pageNumber > 0
  )
}