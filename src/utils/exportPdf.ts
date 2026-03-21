import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportOptions {
  filename: string
  orientation?: 'portrait' | 'landscape'
  title?: string
  headerLines?: string[]
}

export async function exportToPdf(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { filename, orientation = 'portrait', title, headerLines = [] } = options

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png')
  const margin = 12

  // Base page width from orientation
  const baseWidth = orientation === 'landscape' ? 297 : 210
  const minHeight = orientation === 'landscape' ? 210 : 297

  // Calculate vertical space needed for header
  let headerHeight = margin
  if (title) headerHeight += 8
  if (headerLines.length > 0) headerHeight += headerLines.length * 5 + 3
  const footerHeight = margin + 8

  // Scale image to fit page width, then compute needed page height
  const availableWidth = baseWidth - margin * 2
  const imgScaledHeight = (canvas.height / canvas.width) * availableWidth
  const totalNeededHeight = headerHeight + imgScaledHeight + footerHeight

  // Create PDF with dynamic height so content is never clipped
  const docHeight = Math.max(minHeight, totalNeededHeight)
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [baseWidth, docHeight],
  })

  let yPos = margin

  if (title) {
    pdf.setFontSize(14)
    pdf.setTextColor(20, 20, 20)
    pdf.text(title, margin, yPos)
    yPos += 8
  }

  if (headerLines.length > 0) {
    pdf.setFontSize(9)
    pdf.setTextColor(90, 90, 90)
    for (const line of headerLines) {
      pdf.text(line, margin, yPos)
      yPos += 5
    }
    yPos += 3
  }

  pdf.addImage(imgData, 'PNG', margin, yPos, availableWidth, imgScaledHeight)

  const timestamp = new Date().toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  pdf.setFontSize(7)
  pdf.setTextColor(160, 160, 160)
  pdf.text(`Esportato il ${timestamp}`, margin, docHeight - 5)

  pdf.save(filename)
}
