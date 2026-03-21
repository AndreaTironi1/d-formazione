interface PrintOptions {
  orientation?: 'portrait' | 'landscape'
  title?: string
  headerLines?: string[]
}

export function printElement(element: HTMLElement, options: PrintOptions = {}): void {
  const { orientation = 'portrait', title, headerLines = [] } = options

  const timestamp = new Date().toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  // Build wrapper
  const wrapper = document.createElement('div')
  wrapper.id = '__print_wrapper__'

  if (title) {
    const h = document.createElement('h2')
    h.textContent = title
    h.style.cssText = 'font-size:16px;font-weight:bold;margin:0 0 6px 0;color:#111;'
    wrapper.appendChild(h)
  }

  for (const line of headerLines) {
    const p = document.createElement('p')
    p.textContent = line
    p.style.cssText = 'font-size:11px;color:#555;margin:2px 0;'
    wrapper.appendChild(p)
  }

  if (title || headerLines.length > 0) {
    const sep = document.createElement('hr')
    sep.style.cssText = 'border:none;border-top:1px solid #ddd;margin:8px 0 12px;'
    wrapper.appendChild(sep)
  }

  // Clone content and strip overflow constraints so nothing gets clipped
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.cssText = 'overflow:visible;box-shadow:none;'
  clone.querySelectorAll<HTMLElement>('*').forEach(el => {
    const ov = getComputedStyle(el).overflow
    if (ov === 'hidden' || ov === 'auto' || ov === 'scroll') {
      el.style.overflow = 'visible'
    }
  })
  wrapper.appendChild(clone)

  // Timestamp footer
  const ts = document.createElement('div')
  ts.textContent = `Esportato il ${timestamp}`
  ts.style.cssText = 'font-size:9px;color:#aaa;margin-top:20px;padding-top:8px;border-top:1px solid #eee;'
  wrapper.appendChild(ts)

  // Inject print stylesheet
  const style = document.createElement('style')
  style.id = '__print_style__'
  style.textContent = `
    @media print {
      @page { size: ${orientation}; margin: 12mm; }
      body > *:not(#__print_wrapper__) { display: none !important; }
      #__print_wrapper__ { display: block !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    #__print_wrapper__ { display: none; }
  `
  document.head.appendChild(style)
  document.body.appendChild(wrapper)

  const cleanup = () => {
    if (document.body.contains(wrapper)) document.body.removeChild(wrapper)
    if (document.head.contains(style)) document.head.removeChild(style)
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)

  window.print()
}
