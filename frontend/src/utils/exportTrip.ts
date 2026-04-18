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

// ── Block builders ─────────────────────────────────────────────────────────────

/** Big page title */
function coverTitle(title: string, subtitle: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 160 },
      children: [new TextRun({ text: title, bold: true, size: 64, color: C.forest, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: subtitle, size: 26, color: C.grey, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [new TextRun({ text: '✦  WanderPlan  ✦', size: 20, color: C.mint, font: 'Calibri' })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/** Section heading — green bar */
function sectionHeading(emoji: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    shading: { type: ShadingType.SOLID, color: C.forest, fill: C.forest },
    children: [
      new TextRun({ text: `  ${emoji}  ${title.toUpperCase()}`, bold: true, size: 26, color: C.white, font: 'Calibri' }),
    ],
  })
}

/** Day heading inside Activities section */
function dayHeading(dateStr: string, location?: string | null): Paragraph[] {
  const parts: Paragraph[] = [
    new Paragraph({
      spacing: { before: 300, after: 40 },
      shading: { type: ShadingType.SOLID, color: C.mist, fill: C.mist },
      children: [
        new TextRun({ text: `  📅  ${fmtDayHeader(dateStr)}`, bold: true, size: 22, color: C.forest, font: 'Calibri' }),
        ...(location ? [new TextRun({ text: `   —   ${location}`, size: 20, color: C.forestMid, font: 'Calibri' })] : []),
      ],
    }),
  ]
  return parts
}

/** Bullet item */
function bullet(text: string, sub?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: '● ', color: C.mint, bold: true, size: 20, font: 'Calibri' }),
      new TextRun({ text, size: 20, font: 'Calibri' }),
      ...(sub ? [new TextRun({ text: `  ${sub}`, size: 18, color: C.grey, font: 'Calibri' })] : []),
    ],
  })
}

/** Key-value pair */
function kv(label: string, value: string | null | undefined): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}:  `, bold: true, size: 20, color: C.forest, font: 'Calibri' }),
      new TextRun({ text: value ?? '—', size: 20, font: 'Calibri' }),
    ],
  })
}

function spacer(size = 120): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [new TextRun('')] })
}

/** Table header row */
function tHead(cells: string[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: cells.map(c => new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      shading: { type: ShadingType.SOLID, color: C.forest, fill: C.forest },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
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
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        children: typeof c === 'string'
          ? [new TextRun({ text: c, size: 18, font: 'Calibri' })]
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

// ── Main export ────────────────────────────────────────────────────────────────
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
  add(...coverTitle(trip.title, subtitle))

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
          spacing: { before: 280, after: 60 },
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
            spacing: { after: 40 },
            indent: { left: 700 },
            children: [new TextRun({ text: a.notes, size: 17, color: C.grey, italics: true, font: 'Calibri' })],
          }))
        }
      }
      add(spacer(80))
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
        spacing: { before: 200, after: 80 },
        children: [new TextRun({
          text: cat.charAt(0).toUpperCase() + cat.slice(1),
          bold: true, size: 22, color: C.forest, font: 'Calibri',
        })],
      }))
      for (const item of items) {
        add(new Paragraph({
          spacing: { after: 50 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: item.checked ? '☑  ' : '☐  ', size: 20, color: item.checked ? C.forestMid : C.grey, font: 'Calibri' }),
            new TextRun({ text: item.name, size: 20, strike: item.checked, font: 'Calibri' }),
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
          spacing: { before: 160, after: 30 },
          children: [new TextRun({
            text: new Date(note.created_at).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
            size: 16, color: C.grey, font: 'Calibri',
          })],
        }),
        new Paragraph({
          spacing: { after: 140 },
          children: [new TextRun({ text: note.text, size: 20, font: 'Calibri' })],
        }),
      )
    }
  }

  // ── Build & save ──────────────────────────────────────────────────────────────
  const sectionDef: ISectionOptions = {
    properties: {
      page: {
        margin: { top: 720, bottom: 720, left: 900, right: 900 },
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
          run: { font: 'Calibri', size: 20 },
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
  mist:      [232, 240, 235] as [number, number, number],
  grey:      [107, 114, 128] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  red:       [220, 38, 38] as [number, number, number],
  amber:     [217, 119, 6] as [number, number, number],
  green:     [22, 163, 74] as [number, number, number],
}

/** Strip characters outside Latin-1 (jsPDF built-in fonts only support Latin-1) */
function safe(s: string | null | undefined): string {
  if (!s) return '-'
  // Replace common unicode symbols with ASCII equivalents before stripping
  return s
    .replace(/\u2014/g, '-')   // em dash
    .replace(/\u2013/g, '-')   // en dash
    .replace(/\u2192/g, '->')  // →
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u201c|\u201d/g, '"') // curly quotes
    .replace(/[^\x00-\xFF]/g, '')   // drop anything outside Latin-1
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
  const W = doc.internal.pageSize.getWidth()
  const MARGIN = 40
  let y = MARGIN

  const checkPage = (needed = 40) => {
    if (y + needed > doc.internal.pageSize.getHeight() - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  const sectionHeader = (title: string) => {
    checkPage(32)
    doc.setFillColor(...PDF_C.forest)
    doc.rect(MARGIN, y, W - MARGIN * 2, 24, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...PDF_C.white)
    doc.text(title.toUpperCase(), MARGIN + 8, y + 16)
    y += 32
  }

  const kv = (label: string, value: string | null | undefined) => {
    checkPage(18)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_C.forest)
    doc.text(`${label}:`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(safe(value), MARGIN + doc.getTextWidth(`${label}:`) + 6, y)
    y += 16
  }

  // ── Cover ───────────────────────────────────────────────────────────────────
  doc.setFillColor(...PDF_C.forest)
  doc.rect(0, 0, W, 180, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...PDF_C.white)
  const titleX = W / 2
  doc.text(safe(trip.title), titleX, 80, { align: 'center' })

  const subtitle = trip.start_date && trip.end_date
    ? `${fmt(trip.start_date)}  ->  ${fmt(trip.end_date)}`
    : trip.start_date ? `From ${fmt(trip.start_date)}` : ''
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...PDF_C.mint)
    doc.text(subtitle, titleX, 108, { align: 'center' })
  }
  doc.setFontSize(10)
  doc.setTextColor(...PDF_C.mint)
  doc.text('* WanderPlan *', titleX, 140, { align: 'center' })

  y = 200

  // ── Overview ────────────────────────────────────────────────────────────────
  sectionHeader('Overview')
  if (trip.destination) kv('Destination', trip.destination)
  kv('Start date', fmt(trip.start_date))
  kv('End date', fmt(trip.end_date))
  if (trip.description) kv('Description', trip.description)
  y += 10

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
      headStyles: { fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      didParseCell: (data) => {
        if (data.row.index === 5) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = PDF_C.mist
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
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
      headStyles: { fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = (data.cell.raw as string) ?? ''
          if (val === 'BOOKED' || val === 'CONFIRMED') data.cell.styles.textColor = PDF_C.green
          else if (val === 'CANCELLED') data.cell.styles.textColor = PDF_C.red
          else if (val === 'TO BOOK') data.cell.styles.textColor = PDF_C.amber
          else data.cell.styles.textColor = PDF_C.grey
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
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
      headStyles: { fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = (data.cell.raw as string) ?? ''
          if (val === 'BOOKED' || val === 'CONFIRMED') data.cell.styles.textColor = PDF_C.green
          else if (val === 'CANCELLED') data.cell.styles.textColor = PDF_C.red
          else if (val === 'TO BOOK') data.cell.styles.textColor = PDF_C.amber
          else data.cell.styles.textColor = PDF_C.grey
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
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
      headStyles: { fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = (data.cell.raw as string) ?? ''
          if (val === 'BOOKED' || val === 'CONFIRMED') data.cell.styles.textColor = PDF_C.green
          else if (val === 'CANCELLED') data.cell.styles.textColor = PDF_C.red
          else if (val === 'TO BOOK') data.cell.styles.textColor = PDF_C.amber
          else data.cell.styles.textColor = PDF_C.grey
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
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
      checkPage(36)
      // Day header
      doc.setFillColor(...PDF_C.mist)
      doc.rect(MARGIN, y, W - MARGIN * 2, 20, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...PDF_C.forest)
      const dayLabel = date === '__unscheduled__' ? 'UNSCHEDULED' : fmtDayHeader(date)
      doc.text(dayLabel, MARGIN + 6, y + 14)
      y += 26

      for (const a of acts) {
        checkPage(14)
        const time = a.start_time
          ? `${fmtTime(a.start_time)}${a.end_time ? '-' + fmtTime(a.end_time) : ''}`
          : ''
        const cost = a.cost != null ? `EUR ${a.cost.toFixed(2)}` : ''
        const meta = [time, cost].filter(Boolean).join('  |  ')
        const title = safe(a.title) || 'Untitled'
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...PDF_C.forestMid)
        doc.text('-', MARGIN + 8, y)
        doc.setTextColor(40, 40, 40)
        doc.text(title, MARGIN + 18, y)
        if (meta) {
          doc.setTextColor(...PDF_C.grey)
          doc.setFontSize(7.5)
          doc.text(meta, MARGIN + 18 + doc.getTextWidth(title) + 4, y)
        }
        y += 13
        if (a.notes) {
          checkPage(12)
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(7.5)
          doc.setTextColor(...PDF_C.grey)
          const noteLines = doc.splitTextToSize(safe(a.notes), W - MARGIN * 2 - 26)
          doc.text(noteLines, MARGIN + 26, y)
          y += noteLines.length * 11 + 2
        }
      }
      y += 6
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
      headStyles: { fillColor: PDF_C.forest, textColor: PDF_C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 247, 242] },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
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
      checkPage(24)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...PDF_C.forest)
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), MARGIN, y)
      y += 14
      for (const item of items) {
        checkPage(13)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...(item.checked ? PDF_C.forestMid : PDF_C.grey))
        doc.text(item.checked ? '[x]' : '[ ]', MARGIN + 6, y)
        doc.setTextColor(40, 40, 40)
        const itemName = safe(item.name)
        doc.text(itemName, MARGIN + 26, y)
        if (item.notes) {
          doc.setTextColor(...PDF_C.grey)
          doc.setFontSize(7.5)
          doc.text(`- ${safe(item.notes)}`, MARGIN + 26 + doc.getTextWidth(itemName) + 4, y)
        }
        y += 13
      }
      y += 4
    }
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (notes.length > 0) {
    sectionHeader('Notes')
    for (const note of notes) {
      checkPage(28)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(...PDF_C.grey)
      doc.text(new Date(note.created_at).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }), MARGIN, y)
      y += 12
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      const lines = doc.splitTextToSize(safe(note.text), W - MARGIN * 2)
      doc.text(lines, MARGIN, y)
      y += lines.length * 13 + 6
    }
  }

  doc.save(`${trip.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
}
