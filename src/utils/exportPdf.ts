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

  const margin = 12
  const baseWidth = orientation === 'landscape' ? 297 : 210
  const minHeight = orientation === 'landscape' ? 210 : 297

  // Target pixel width for the capture (96 dpi equivalent of baseWidth minus margins)
  const targetPxWidth = (baseWidth - margin * 2) * (96 / 25.4)

  // Clone element off-screen so we can measure its true height at the target width
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.cssText = [
    'position:fixed',
    'top:-99999px',
    'left:0',
    `width:${targetPxWidth}px`,
    'height:auto',
    'overflow:visible',
    'box-shadow:none',
    'border-radius:0',
  ].join(';')
  document.body.appendChild(clone)

  // Force layout and measure actual height
  const captureWidth = clone.scrollWidth
  const captureHeight = clone.scrollHeight

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
    width: captureWidth,
    height: captureHeight,
    windowWidth: captureWidth,
    windowHeight: captureHeight,
  })

  document.body.removeChild(clone)

  const imgData = canvas.toDataURL('image/png')

  // Calculate vertical space for header/footer
  let headerHeight = margin
  if (title) headerHeight += 8
  if (headerLines.length > 0) headerHeight += headerLines.length * 5 + 3
  const footerHeight = margin + 8

  const availableWidth = baseWidth - margin * 2
  const imgScaledHeight = (canvas.height / canvas.width) * availableWidth
  const totalNeededHeight = headerHeight + imgScaledHeight + footerHeight

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
