// frontend/src/utils/exportTrip.ts
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak,
  type ISectionOptions, VerticalAlign,
} from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Trip, Activity, Flight, Accommodation, Transport, Note, TripStats, Extra, PackingItem } from '../types'

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  forest:   '2D4A3E',
  forestMid:'4A7A5A',
  mint:     'A8C5B0',
  mist:     'E8F0EB',
  ivory:    'FAF7F2',
  white:    'FFFFFF',
  grey:     '6B7280',
  greyLight:'D1D5DB',
  ink:      '1F2937',
  red:      'DC2626',
  amber:    'D97706',
  green:    '16A34A',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDayHeader(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(t?: string | null): string {
  return t ? t.slice(0, 5) : ''
}

function statusColor(s?: string | null): string {
  switch (s) {
    case 'booked':    return C.green
    case 'confirmed': return C.green
    case 'cancelled': return C.red
    case 'draft':     return C.grey
    case 'to_book':   return C.amber
    default:          return C.grey
  }
}

// ── DOCX block builders ────────────────────────────────────────────────────────

/** Cover page */
function coverTitle(title: string, subtitle: string, destination?: string | null): Paragraph[] {
  const paras: Paragraph[] = [
    // Top breathing room + title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 160 },
      children: [new TextRun({ text: title, bold: true, size: 72, color: C.forest, font: 'Calibri' })],
    }),
  ]

  // Destination (if any) between title and separator
  if (destination) {
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: destination.toUpperCase(), size: 24, color: C.forestMid, font: 'Calibri', bold: true })],
    }))
  }

  // Mint decorative separator line
  paras.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.mint, space: 4 } },
    children: [new TextRun({ text: '', size: 4 })],
  }))

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: subtitle, size: 24, color: C.grey, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [new TextRun({ text: '✦  WanderPlan  ✦', size: 22, color: C.mint, font: 'Calibri', italics: true })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  )

  return paras
}

/** Section heading — forest bar with mint left accent */
function sectionHeading(emoji: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    border: {
      left: { style: BorderStyle.THICK, size: 32, color: C.mint, space: 6 },
    },
    shading: { type: ShadingType.SOLID, color: C.forest, fill: C.forest },
    children: [
      new TextRun({ text: `  ${emoji}  ${title.toUpperCase()}`, bold: true, size: 26, color: C.white, font: 'Calibri' }),
    ],
  })
}

/** Day heading inside Activities section */
function dayHeading(dateStr: string, location?: string | null): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 340, after: 80 },
      border: {
        left: { style: BorderStyle.THICK, size: 24, color: C.mint, space: 8 },
      },
      shading: { type: ShadingType.SOLID, color: C.mist, fill: C.mist },
      children: [
        new TextRun({ text: `  📅  ${fmtDayHeader(dateStr)}`, bold: true, size: 22, color: C.forest, font: 'Calibri' }),
        ...(location ? [new TextRun({ text: `   —   ${location}`, size: 19, color: C.forestMid, font: 'Calibri', italics: true })] : []),
      ],
    }),
  ]
}

/** Bullet item */
function bullet(text: string, sub?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 400 },
    children: [
      new TextRun({ text: '▸  ', color: C.forestMid, bold: true, size: 20, font: 'Calibri' }),
      new TextRun({ text, size: 20, font: 'Calibri', color: C.ink }),
      ...(sub ? [new TextRun({ text: `   ·   ${sub}`, size: 17, color: C.grey, font: 'Calibri' })] : []),
    ],
  })
}

/** Key-value pair */
function kv(label: string, value: string | null | undefined): Paragraph {
  return new Paragraph({
    spacing: { after: 90 },
    children: [
      new TextRun({ text: `${label}  `, bold: true, size: 20, color: C.forest, font: 'Calibri' }),
      new TextRun({ text: value ?? '—', size: 20, font: 'Calibri', color: C.ink }),
    ],
  })
}

function spacer(size = 140): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [new TextRun('')] })
}

/** Table header row */
function tHead(cells: string[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: cells.map(c => new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      shading: { type: ShadingType.SOLID, color: C.forest, fill: C.forest },
      margins: { top: 100, bottom: 100, left: 150, right: 150 },
      children: [new Paragraph({
        children: [new TextRun({ text: c, bold: true, size: 18, color: C.white, font: 'Calibri' })],
      })],
    })),
  })
}

/** Table data row with zebra striping */
function tRow(cells: (string | TextRun[])[], shade = false): TableRow {
  return new TableRow({
    children: cells.map(c => new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      shading: shade ? { type: ShadingType.SOLID, color: C.ivory, fill: C.ivory } : undefined,
      margins: { top: 70, bottom: 70, left: 150, right: 150 },
      children: [new Paragraph({
        children: typeof c === 'string'
          ? [new TextRun({ text: c, size: 18, font: 'Calibri', color: C.ink })]
          : c,
      })],
    })),
  })
}

function makeTable(headers: string[], rows: (string | TextRun[])[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:              { style: BorderStyle.NONE },
      bottom:           { style: BorderStyle.NONE },
      left:             { style: BorderStyle.NONE },
      right:            { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C.greyLight },
      insideVertical:   { style: BorderStyle.NONE },
    },
    rows: [tHead(headers), ...rows.map((r, i) => tRow(r, i % 2 === 0))],
  })
}

function statusRun(s?: string | null): TextRun {
  const label = s ? s.replace('_', ' ').toUpperCase() : '—'
  return new TextRun({ text: label, size: 16, bold: true, color: statusColor(s), font: 'Calibri' })
}

// ── DOCX Main export ───────────────────────────────────────────────────────────
export async function exportTripToDocx(params: {
  trip: Trip
  flights: Flight[]
  accommodations: Accommodation[]
  transports: Transport[]
  activities: Activity[]
  notes: Note[]
  stats: TripStats | null
  extras: Extra[]
  packingItems: PackingItem[]
}) {
  const { trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems } = params

  type DocChild = Paragraph | Table
  const children: DocChild[] = []

  const add = (...items: DocChild[]) => children.push(...items)

  // ── Cover ───────────────────────────────────────────────────────────────────
  const subtitle = trip.start_date && trip.end_date
    ? `${fmt(trip.start_date)}  →  ${fmt(trip.end_date)}`
    : trip.start_date ? `From ${fmt(trip.start_date)}` : ''
  add(...coverTitle(trip.title, subtitle, trip.destination))

  // ── Overview ────────────────────────────────────────────────────────────────
  add(sectionHeading('🗺️', 'Overview'))
  if (trip.destination) add(kv('Destination', trip.destination))
  add(kv('Start date', fmt(trip.start_date)))
  add(kv('End date', fmt(trip.end_date)))
  if (trip.description) add(kv('Description', trip.description))
  add(spacer())

  // ── Budget ──────────────────────────────────────────────────────────────────
  if (stats) {
    add(sectionHeading('💰', 'Budget Summary'))
    add(makeTable(
      ['Category', 'Amount'],
      [
        ['✈️  Flights',         `€ ${stats.flights.toFixed(2)}`],
        ['🏨  Accommodations',  `€ ${stats.accommodation.toFixed(2)}`],
        ['🚌  Transports',      `€ ${stats.transport.toFixed(2)}`],
        ['🗓️  Activities',      `€ ${stats.activities.toFixed(2)}`],
        ['💸  Extras',          `€ ${stats.extras.toFixed(2)}`],
        ['TOTAL', `€ ${stats.total.toFixed(2)}`],
      ]
    ))
    add(spacer())
  }

  // ── Flights ─────────────────────────────────────────────────────────────────
  if (flights.length > 0) {
    add(sectionHeading('✈️', 'Flights'))
    add(makeTable(
      ['Route', 'Date', 'Time', 'Airline', 'Flight #', 'Cost', 'Status', 'Ref'],
      flights
        .sort((a, b) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))
        .map(f => [
          `${f.origin} → ${f.destination}`,
          fmt(f.departure_time),
          f.departure_time
            ? `${fmtTime(f.departure_time.slice(11))}${f.arrival_time ? ' → ' + fmtTime(f.arrival_time.slice(11)) : ''}`
            : '—',
          f.airline ?? '—',
          f.flight_number ?? '—',
          f.cost != null ? `€ ${f.cost.toFixed(2)}` : '—',
          [statusRun(f.status)],
          f.booking_reference ?? '—',
        ])
    ))
    add(spacer())
  }

  // ── Accommodations ──────────────────────────────────────────────────────────
  if (accommodations.length > 0) {
    add(sectionHeading('🏨', 'Accommodations'))
    add(makeTable(
      ['Name', 'Location', 'Check-in', 'Check-out', 'Cost/night', 'Total', 'Status', 'Ref'],
      accommodations
        .sort((a, b) => (a.check_in ?? '').localeCompare(b.check_in ?? ''))
        .map(a => [
          a.name,
          a.location ?? a.address ?? '—',
          fmt(a.check_in),
          fmt(a.check_out),
          a.cost_per_night != null ? `€ ${a.cost_per_night.toFixed(2)}` : '—',
          a.total_cost != null ? `€ ${a.total_cost.toFixed(2)}` : '—',
          [statusRun(a.status)],
          a.booking_reference ?? '—',
        ])
    ))
    add(spacer())
  }

  // ── Transports ──────────────────────────────────────────────────────────────
  if (transports.length > 0) {
    add(sectionHeading('🚌', 'Transports'))
    add(makeTable(
      ['Type', 'Route', 'Date & Time', 'Operator', 'Cost', 'Status', 'Ref'],
      transports
        .sort((a, b) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))
        .map(t => [
          t.transport_type.charAt(0).toUpperCase() + t.transport_type.slice(1),
          `${t.origin} → ${t.destination}`,
          t.departure_time
            ? `${fmt(t.departure_time)}  ${fmtTime(t.departure_time.slice(11))}`
            : '—',
          t.operator ?? '—',
          t.cost != null ? `€ ${t.cost.toFixed(2)}` : '—',
          [statusRun(t.status)],
          t.booking_reference ?? '—',
        ])
    ))
    add(spacer())
  }

  // ── Activities by day ───────────────────────────────────────────────────────
  if (activities.length > 0) {
    add(sectionHeading('📅', 'Day by Day'))

    const byDate = activities.reduce<Record<string, Activity[]>>((acc, a) => {
      const key = a.activity_date ?? '__unscheduled__'
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {})
    Object.values(byDate).forEach(list =>
      list.sort((a, b) => (!a.start_time ? 1 : !b.start_time ? -1 : a.start_time.localeCompare(b.start_time)))
    )

    for (const [date, acts] of Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))) {
      const loc = acts.find(a => a.location)?.location
      if (date === '__unscheduled__') {
        add(new Paragraph({
          spacing: { before: 300, after: 80 },
          border: {
            left: { style: BorderStyle.THICK, size: 24, color: C.grey, space: 8 },
          },
          children: [new TextRun({ text: '  📌  UNSCHEDULED', bold: true, size: 20, color: C.grey, font: 'Calibri' })],
        }))
      } else {
        add(...dayHeading(date, loc))
      }

      for (const a of acts) {
        const time = a.start_time
          ? `${fmtTime(a.start_time)}${a.end_time ? '–' + fmtTime(a.end_time) : ''}`
          : undefined
        const meta = [time, a.cost != null ? `€ ${a.cost.toFixed(2)}` : null]
          .filter(Boolean).join('  ·  ')
        add(bullet(a.title ?? 'Untitled', meta || undefined))
        if (a.notes) {
          add(new Paragraph({
            spacing: { after: 50 },
            indent: { left: 760 },
            children: [new TextRun({ text: a.notes, size: 17, color: C.grey, italics: true, font: 'Calibri' })],
          }))
        }
      }
      add(spacer(100))
    }
  }

  // ── Extras ──────────────────────────────────────────────────────────────────
  if (extras.length > 0) {
    add(sectionHeading('💸', 'Extras'))
    add(makeTable(
      ['Category', 'Description', 'Estimated', 'Actual', 'Currency'],
      extras.map(e => [
        e.category ? e.category.charAt(0).toUpperCase() + e.category.slice(1) : '—',
        e.description ?? '—',
        e.amount != null ? e.amount.toFixed(2) : '—',
        e.actual_amount != null ? e.actual_amount.toFixed(2) : '—',
        e.currency ?? '€',
      ])
    ))
    add(spacer())
  }

  // ── Packing List ─────────────────────────────────────────────────────────────
  if (packingItems.length > 0) {
    add(sectionHeading('🎒', 'Packing List'))

    const byCategory = packingItems.reduce<Record<string, PackingItem[]>>((acc, p) => {
      const key = p.category ?? 'other'
      if (!acc[key]) acc[key] = []
      acc[key].push(p)
      return acc
    }, {})

    for (const [cat, items] of Object.entries(byCategory)) {
      add(new Paragraph({
        spacing: { before: 220, after: 80 },
        children: [new TextRun({
          text: cat.charAt(0).toUpperCase() + cat.slice(1),
          bold: true, size: 22, color: C.forest, font: 'Calibri',
        })],
      }))
      for (const item of items) {
        add(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: item.checked ? '☑  ' : '☐  ', size: 20, color: item.checked ? C.forestMid : C.grey, font: 'Calibri' }),
            new TextRun({ text: item.name, size: 20, strike: item.checked, font: 'Calibri', color: item.checked ? C.grey : C.ink }),
            ...(item.notes ? [new TextRun({ text: `  —  ${item.notes}`, size: 17, color: C.grey, italics: true, font: 'Calibri' })] : []),
          ],
        }))
      }
    }
    add(spacer())
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (notes.length > 0) {
    add(sectionHeading('📝', 'Notes'))
    for (const note of notes) {
      add(
        new Paragraph({
          spacing: { before: 180, after: 30 },
          children: [new TextRun({
            text: new Date(note.created_at).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
            size: 16, color: C.grey, font: 'Calibri', italics: true,
          })],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: note.text, size: 20, font: 'Calibri', color: C.ink })],
        }),
      )
    }
  }

  // ── Build & save ──────────────────────────────────────────────────────────────
  const sectionDef: ISectionOptions = {
    properties: {
      page: {
        margin: { top: 800, bottom: 800, left: 1000, right: 1000 },
      },
    },
    children,
  }

  const doc = new Document({
    creator: 'WanderPlan',
    title: trip.title,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: C.ink },
        },
      },
    },
    sections: [sectionDef],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${trip.title.replace(/[^a-z0-9]/gi, '_')}.docx`)
}

// ── PDF Export ─────────────────────────────────────────────────────────────────

const PDF_C = {
  forest:    [45, 74, 62] as [number, number, number],
  forestMid: [74, 122, 90] as [number, number, number],
  mint:      [168, 197, 176] as [number, number, number],
  mintLight: [210, 228, 214] as [number, number, number],
  mist:      [232, 240, 235] as [number, number, number],
  ivory:     [250, 247, 242] as [number, number, number],
  grey:      [107, 114, 128] as [number, number, number],
  greyLight: [209, 213, 219] as [number, number, number],
  ink:       [31, 41, 55] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  red:       [220, 38, 38] as [number, number, number],
  amber:     [217, 119, 6] as [number, number, number],
  green:     [22, 163, 74] as [number, number, number],
}

/** Strip characters outside Latin-1 (jsPDF built-in fonts only support Latin-1) */
function safe(s: string | null | undefined): string {
  if (!s) return '-'
  return s
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[^\x00-\xFF]/g, '')
    .trim() || '-'
}

export function exportTripToPdf(params: {
  trip: Trip
  flights: Flight[]
  accommodations: Accommodation[]
  transports: Transport[]
  activities: Activity[]
  notes: Note[]
  stats: TripStats | null
  extras: Extra[]
  packingItems: PackingItem[]
}) {
  const { trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems } = params
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()    // 595.28
  const H = doc.internal.pageSize.getHeight()   // 841.89
  const MARGIN = 48
  const FOOTER_H = 38
  let y = MARGIN

  const checkPage = (needed = 40) => {
    if (y + needed > H - MARGIN - FOOTER_H) {
      doc.addPage()
      y = MARGIN
    }
  }

  // ── Section header: mint left accent + forest fill ──────────────────────────
  const sectionHeader = (title: string) => {
    checkPage(34)
    // Mint left accent strip
    doc.setFillColor(...PDF_C.mint)
    doc.rect(MARGIN, y, 5, 26, 'F')
    // Forest fill body
    doc.setFillColor(...PDF_C.forest)
    doc.rect(MARGIN + 5, y, W - MARGIN * 2 - 5, 26, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...PDF_C.white)
    doc.text(title.toUpperCase(), MARGIN + 16, y + 17)
    y += 34
  }

  const kvLine = (label: string, value: string | null | undefined) => {
    checkPage(18)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_C.forest)
    doc.text(`${label}:`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_C.ink)
    doc.text(safe(value), MARGIN + doc.getTextWidth(`${label}:`) + 6, y)
    y += 16
  }

  // ── Cover ───────────────────────────────────────────────────────────────────
  const COVER_H = 248

  // Forest background (top portion)
  doc.setFillColor(...PDF_C.forest)
  doc.rect(0, 0, W, COVER_H, 'F')

  // Small "WanderPlan" branding top-right inside forest area
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_C.mintLight)
  doc.text('WanderPlan', W - MARGIN, 24, { align: 'right' })

  // Title — handle long titles with wrapping
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...PDF_C.white)
  const titleLines = doc.splitTextToSize(safe(trip.title), W - MARGIN * 3)
  const titleBlockH = titleLines.length * 36
  const titleY = Math.max(68, (COVER_H * 0.45) - titleBlockH / 2)
  doc.text(titleLines, W / 2, titleY, { align: 'center' })

  // Thin decorative line below title
  const lineAfterTitle = titleY + titleLines.length * 36 - 20
  doc.setDrawColor(...PDF_C.mint)
  doc.setLineWidth(1)
  const decorLineW = Math.min(220, W * 0.4)
  doc.line(W / 2 - decorLineW / 2, lineAfterTitle, W / 2 + decorLineW / 2, lineAfterTitle)

  // Destination
  let metaY = lineAfterTitle + 22
  if (trip.destination) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...PDF_C.mint)
    doc.text(safe(trip.destination).toUpperCase(), W / 2, metaY, { align: 'center' })
    metaY += 20
  }

  // Date range
  const subtitle = trip.start_date && trip.end_date
    ? `${fmt(trip.start_date)}  ->  ${fmt(trip.end_date)}`
    : trip.start_date ? `From ${fmt(trip.start_date)}` : ''
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...PDF_C.mintLight)
    doc.text(subtitle, W / 2, metaY, { align: 'center' })
  }

  // Mint accent bar at bottom of forest area
  doc.setFillColor(...PDF_C.mint)
  doc.rect(0, COVER_H - 6, W, 6, 'F')

  // Light area below — WanderPlan label
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...PDF_C.forestMid)
  doc.text('Your journey, beautifully documented.', W / 2, COVER_H + 30, { align: 'center' })

  y = COVER_H + 58

  // ── Overview ────────────────────────────────────────────────────────────────
  sectionHeader('Overview')
  if (trip.destination) kvLine('Destination', trip.destination)
  kvLine('Start date', fmt(trip.start_date))
  kvLine('End date', fmt(trip.end_date))
  if (trip.description) kvLine('Description', trip.description)
  y += 12

  // ── Budget ──────────────────────────────────────────────────────────────────
  if (stats) {
    sectionHeader('Budget Summary')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Category', 'Amount']],
      body: [
        ['Flights',         `EUR ${stats.flights.toFixed(2)}`],
        ['Accommodations',  `EUR ${stats.accommodation.toFixed(2)}`],
        ['Transports',      `EUR ${stats.transport.toFixed(2)}`],
        ['Activities',      `EUR ${stats.activities.toFixed(2)}`],
        ['Extras',          `EUR ${stats.extras.toFixed(2)}`],
        ['TOTAL',           `EUR ${stats.total.toFixed(2)}`],
      ],
      headStyles: {
        fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 9,
        cellPadding: { top: 7, bottom: 7, left: 10, right: 10 },
      },
      bodyStyles: { fontSize: 9, cellPadding: { top: 6, bottom: 6, left: 10, right: 10 }, textColor: PDF_C.ink },
      alternateRowStyles: { fillColor: PDF_C.ivory },
      styles: { lineColor: PDF_C.greyLight, lineWidth: 0.25 },
      didParseCell: (data) => {
        if (data.row.index === 5) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = PDF_C.mist
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
  }

  // ── Flights ─────────────────────────────────────────────────────────────────
  if (flights.length > 0) {
    sectionHeader('Flights')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Route', 'Date', 'Airline', 'Flight #', 'Cost', 'Status']],
      body: flights
        .sort((a, b) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))
        .map(f => [
          `${safe(f.origin)} -> ${safe(f.destination)}`,
          fmt(f.departure_time),
          safe(f.airline),
          safe(f.flight_number),
          f.cost != null ? `EUR ${f.cost.toFixed(2)}` : '-',
          f.status ? f.status.replace('_', ' ').toUpperCase() : '-',
        ]),
      headStyles: {
        fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8.5,
        cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      },
      bodyStyles: { fontSize: 8, cellPadding: { top: 5, bottom: 5, left: 8, right: 8 }, textColor: PDF_C.ink },
      alternateRowStyles: { fillColor: PDF_C.ivory },
      styles: { lineColor: PDF_C.greyLight, lineWidth: 0.25 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = (data.cell.raw as string) ?? ''
          if (val === 'BOOKED' || val === 'CONFIRMED') data.cell.styles.textColor = PDF_C.green
          else if (val === 'CANCELLED') data.cell.styles.textColor = PDF_C.red
          else if (val === 'TO BOOK') data.cell.styles.textColor = PDF_C.amber
          else data.cell.styles.textColor = PDF_C.grey
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
  }

  // ── Accommodations ──────────────────────────────────────────────────────────
  if (accommodations.length > 0) {
    sectionHeader('Accommodations')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Name', 'Location', 'Check-in', 'Check-out', 'Total', 'Status']],
      body: accommodations
        .sort((a, b) => (a.check_in ?? '').localeCompare(b.check_in ?? ''))
        .map(a => [
          safe(a.name),
          safe(a.location ?? a.address),
          fmt(a.check_in),
          fmt(a.check_out),
          a.total_cost != null ? `EUR ${a.total_cost.toFixed(2)}` : '-',
          a.status ? a.status.replace('_', ' ').toUpperCase() : '-',
        ]),
      headStyles: {
        fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8.5,
        cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      },
      bodyStyles: { fontSize: 8, cellPadding: { top: 5, bottom: 5, left: 8, right: 8 }, textColor: PDF_C.ink },
      alternateRowStyles: { fillColor: PDF_C.ivory },
      styles: { lineColor: PDF_C.greyLight, lineWidth: 0.25 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = (data.cell.raw as string) ?? ''
          if (val === 'BOOKED' || val === 'CONFIRMED') data.cell.styles.textColor = PDF_C.green
          else if (val === 'CANCELLED') data.cell.styles.textColor = PDF_C.red
          else if (val === 'TO BOOK') data.cell.styles.textColor = PDF_C.amber
          else data.cell.styles.textColor = PDF_C.grey
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
  }

  // ── Transports ──────────────────────────────────────────────────────────────
  if (transports.length > 0) {
    sectionHeader('Transports')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Type', 'Route', 'Date', 'Operator', 'Cost', 'Status']],
      body: transports
        .sort((a, b) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))
        .map(t => [
          t.transport_type.charAt(0).toUpperCase() + t.transport_type.slice(1),
          `${safe(t.origin)} -> ${safe(t.destination)}`,
          t.departure_time ? fmt(t.departure_time) : '-',
          safe(t.operator),
          t.cost != null ? `EUR ${t.cost.toFixed(2)}` : '-',
          t.status ? t.status.replace('_', ' ').toUpperCase() : '-',
        ]),
      headStyles: {
        fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8.5,
        cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      },
      bodyStyles: { fontSize: 8, cellPadding: { top: 5, bottom: 5, left: 8, right: 8 }, textColor: PDF_C.ink },
      alternateRowStyles: { fillColor: PDF_C.ivory },
      styles: { lineColor: PDF_C.greyLight, lineWidth: 0.25 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = (data.cell.raw as string) ?? ''
          if (val === 'BOOKED' || val === 'CONFIRMED') data.cell.styles.textColor = PDF_C.green
          else if (val === 'CANCELLED') data.cell.styles.textColor = PDF_C.red
          else if (val === 'TO BOOK') data.cell.styles.textColor = PDF_C.amber
          else data.cell.styles.textColor = PDF_C.grey
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
  }

  // ── Activities by day ───────────────────────────────────────────────────────
  if (activities.length > 0) {
    sectionHeader('Day by Day')

    const byDate = activities.reduce<Record<string, Activity[]>>((acc, a) => {
      const key = a.activity_date ?? '__unscheduled__'
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {})
    Object.values(byDate).forEach(list =>
      list.sort((a, b) => (!a.start_time ? 1 : !b.start_time ? -1 : a.start_time.localeCompare(b.start_time)))
    )

    for (const [date, acts] of Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))) {
      checkPage(40)

      // Day header: mint left accent strip + mist fill
      const dayLabel = date === '__unscheduled__' ? 'UNSCHEDULED' : fmtDayHeader(date)
      const loc = acts.find(a => a.location)?.location
      doc.setFillColor(...PDF_C.mint)
      doc.rect(MARGIN, y, 4, 22, 'F')
      doc.setFillColor(...PDF_C.mist)
      doc.rect(MARGIN + 4, y, W - MARGIN * 2 - 4, 22, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...PDF_C.forest)
      doc.text(dayLabel, MARGIN + 12, y + 15)
      if (loc) {
        const labelW = doc.getTextWidth(dayLabel)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(...PDF_C.forestMid)
        doc.text(`  —  ${safe(loc)}`, MARGIN + 12 + labelW, y + 15)
      }
      y += 30

      for (const a of acts) {
        checkPage(16)
        const time = a.start_time
          ? `${fmtTime(a.start_time)}${a.end_time ? '-' + fmtTime(a.end_time) : ''}`
          : ''
        const cost = a.cost != null ? `EUR ${a.cost.toFixed(2)}` : ''
        const meta = [time, cost].filter(Boolean).join('  |  ')
        const title = safe(a.title) || 'Untitled'

        // Mint triangle bullet
        doc.setFillColor(...PDF_C.forestMid)
        doc.triangle(
          MARGIN + 10, y - 5.5,
          MARGIN + 10, y + 1.5,
          MARGIN + 14.5, y - 2,
          'F'
        )
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...PDF_C.ink)
        doc.text(title, MARGIN + 20, y)
        if (meta) {
          doc.setTextColor(...PDF_C.grey)
          doc.setFontSize(7.5)
          doc.text(meta, MARGIN + 20 + doc.getTextWidth(title) + 5, y)
        }
        y += 14
        if (a.notes) {
          checkPage(13)
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(7.5)
          doc.setTextColor(...PDF_C.grey)
          const noteLines = doc.splitTextToSize(safe(a.notes), W - MARGIN * 2 - 28)
          doc.text(noteLines, MARGIN + 28, y)
          y += noteLines.length * 11 + 2
        }
      }
      y += 8
    }
  }

  // ── Extras ──────────────────────────────────────────────────────────────────
  if (extras.length > 0) {
    sectionHeader('Extras')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Category', 'Description', 'Estimated', 'Actual', 'Currency']],
      body: extras.map(e => [
        e.category ? e.category.charAt(0).toUpperCase() + e.category.slice(1) : '-',
        safe(e.description),
        e.amount != null ? e.amount.toFixed(2) : '-',
        e.actual_amount != null ? e.actual_amount.toFixed(2) : '-',
        safe(e.currency) || 'EUR',
      ]),
      headStyles: {
        fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8.5,
        cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      },
      bodyStyles: { fontSize: 8, cellPadding: { top: 5, bottom: 5, left: 8, right: 8 }, textColor: PDF_C.ink },
      alternateRowStyles: { fillColor: PDF_C.ivory },
      styles: { lineColor: PDF_C.greyLight, lineWidth: 0.25 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
  }

  // ── Packing List ─────────────────────────────────────────────────────────────
  if (packingItems.length > 0) {
    sectionHeader('Packing List')
    const byCategory = packingItems.reduce<Record<string, PackingItem[]>>((acc, p) => {
      const key = p.category ?? 'other'
      if (!acc[key]) acc[key] = []
      acc[key].push(p)
      return acc
    }, {})

    for (const [cat, items] of Object.entries(byCategory)) {
      checkPage(26)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...PDF_C.forest)
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), MARGIN, y)
      y += 15
      for (const item of items) {
        checkPage(14)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        // Checkbox drawn as a small square
        doc.setDrawColor(...(item.checked ? PDF_C.forestMid : PDF_C.grey))
        doc.setLineWidth(0.75)
        doc.rect(MARGIN + 6, y - 7, 7, 7)
        if (item.checked) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(...PDF_C.forestMid)
          doc.text('x', MARGIN + 8.2, y - 1.5)
        }
        doc.setFont('helvetica', item.checked ? 'italic' : 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...(item.checked ? PDF_C.grey : PDF_C.ink))
        const itemName = safe(item.name)
        doc.text(itemName, MARGIN + 18, y)
        if (item.notes) {
          doc.setTextColor(...PDF_C.grey)
          doc.setFontSize(7.5)
          doc.text(`  ${safe(item.notes)}`, MARGIN + 18 + doc.getTextWidth(itemName) + 2, y)
        }
        y += 14
      }
      y += 5
    }
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (notes.length > 0) {
    sectionHeader('Notes')
    for (const note of notes) {
      checkPage(30)
      // Note date
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(...PDF_C.grey)
      doc.text(new Date(note.created_at).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }), MARGIN, y)
      y += 13
      // Note text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...PDF_C.ink)
      const lines = doc.splitTextToSize(safe(note.text), W - MARGIN * 2)
      doc.text(lines, MARGIN, y)
      y += lines.length * 13 + 8
      // Thin separator
      doc.setDrawColor(...PDF_C.greyLight)
      doc.setLineWidth(0.4)
      doc.line(MARGIN, y - 4, W - MARGIN, y - 4)
    }
  }

  // ── Page footers (skip cover = page 1) ───────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    // Thin mint line above footer
    doc.setFillColor(...PDF_C.mint)
    doc.rect(MARGIN, H - FOOTER_H, W - MARGIN * 2, 1, 'F')
    // Footer text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...PDF_C.grey)
    doc.text(safe(trip.title), MARGIN, H - FOOTER_H + 14)
    doc.text(`${p - 1} / ${totalPages - 1}`, W - MARGIN, H - FOOTER_H + 14, { align: 'right' })
  }

  doc.save(`${trip.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
}
