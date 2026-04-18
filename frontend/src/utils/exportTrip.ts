// frontend/src/utils/exportTrip.ts
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak,
  type ISectionOptions, VerticalAlign,
} from 'docx'
import { saveAs } from 'file-saver'
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
      top:          { style: BorderStyle.NONE },
      bottom:       { style: BorderStyle.NONE },
      left:         { style: BorderStyle.NONE },
      right:        { style: BorderStyle.NONE },
      insideH:      { style: BorderStyle.SINGLE, size: 2, color: C.greyLight },
      insideV:      { style: BorderStyle.NONE },
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
