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
    scrollX: 0,
    scrollY: 0,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12

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

  const availableWidth = pageWidth - margin * 2
  const availableHeight = pageHeight - yPos - margin - 8

  let finalWidth = availableWidth
  let finalHeight = (canvas.height / canvas.width) * finalWidth
  if (finalHeight > availableHeight) {
    finalHeight = availableHeight
    finalWidth = (canvas.width / canvas.height) * finalHeight
  }

  pdf.addImage(imgData, 'PNG', margin, yPos, finalWidth, finalHeight)

  const timestamp = new Date().toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  pdf.setFontSize(7)
  pdf.setTextColor(160, 160, 160)
  pdf.text(`Esportato il ${timestamp}`, margin, pageHeight - 5)

  pdf.save(filename)
}
