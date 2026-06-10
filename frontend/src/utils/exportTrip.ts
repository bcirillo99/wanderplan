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

// ── Palette — editorial modern ─────────────────────────────────────────────────
const C = {
  ink:      '0F172A',
  inkSoft:  '334155',
  mute:     '64748B',
  soft:     '94A3B8',
  line:     'E2E8F0',
  lineSoft: 'F1F5F9',
  panel:    'F8FAFC',
  white:    'FFFFFF',
  accent:   '2D4A3E',
  accentMid:'4A7A5A',
  red:      'DC2626',
  amber:    'D97706',
  green:    '16A34A',
  // legacy aliases kept for unchanged call sites
  forest:   '0F172A',
  forestMid:'334155',
  mint:     '2D4A3E',
  mist:     'F8FAFC',
  ivory:    'F8FAFC',
  grey:     '64748B',
  greyLight:'E2E8F0',
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

const FONT = 'Calibri'

let sectionCounter = 0
function resetSections() { sectionCounter = 0 }

/** Cover page — editorial: small eyebrow label, large display title, thin rule, meta row */
function coverTitle(title: string, subtitle: string, destination?: string | null): Paragraph[] {
  const paras: Paragraph[] = []

  // Eyebrow label — top-left feel via centered minimal cap label
  paras.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 320 },
    children: [new TextRun({
      text: 'T R I P   D O S S I E R',
      size: 16, color: C.accentMid, font: FONT, bold: true,
    })],
  }))

  // Display title
  paras.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: title, bold: true, size: 84, color: C.ink, font: FONT })],
  }))

  // Hairline rule
  paras.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 4 } },
    children: [new TextRun({ text: '', size: 4 })],
  }))

  // Meta row: destination · dates
  const metaParts: string[] = []
  if (destination) metaParts.push(destination)
  if (subtitle) metaParts.push(subtitle)
  if (metaParts.length) {
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({
        text: metaParts.join('   ·   '),
        size: 22, color: C.mute, font: FONT,
      })],
    }))
  }

  // Bottom footer mark
  paras.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 4800 },
    children: [new TextRun({ text: 'WanderPlan', size: 16, color: C.soft, font: FONT })],
  }))

  paras.push(new Paragraph({ children: [new PageBreak()] }))
  return paras
}

/** Section heading — numbered eyebrow + display title + hairline rule */
function sectionHeading(_emoji: string, title: string): Paragraph[] {
  sectionCounter += 1
  const n = String(sectionCounter).padStart(2, '0')
  return [
    new Paragraph({
      spacing: { before: 520, after: 60 },
      children: [new TextRun({
        text: `${n}   ·   SECTION`,
        bold: true, size: 14, color: C.accent, font: FONT,
      })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 6 } },
      children: [new TextRun({
        text: title,
        bold: true, size: 32, color: C.ink, font: FONT,
      })],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun('')] }),
  ]
}

/** Day heading — clean date + faint hairline */
function dayHeading(dateStr: string, location?: string | null): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 280, after: 40 },
      children: [
        new TextRun({ text: fmtDayHeader(dateStr), bold: true, size: 22, color: C.ink, font: FONT }),
        ...(location ? [new TextRun({ text: `   ·   ${location}`, size: 19, color: C.mute, font: FONT })] : []),
      ],
    }),
    new Paragraph({
      spacing: { after: 140 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 2 } },
      children: [new TextRun({ text: '', size: 2 })],
    }),
  ]
}

/** Bullet item — minimal dot */
function bullet(text: string, sub?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 280 },
    children: [
      new TextRun({ text: '·  ', color: C.soft, bold: true, size: 22, font: FONT }),
      new TextRun({ text, size: 20, font: FONT, color: C.ink }),
      ...(sub ? [new TextRun({ text: `   ${sub}`, size: 17, color: C.mute, font: FONT })] : []),
    ],
  })
}

/** Key-value pair — label muted, value strong */
function kv(label: string, value: string | null | undefined): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: label.toUpperCase(), bold: true, size: 14, color: C.mute, font: FONT }),
      new TextRun({ text: '   ', size: 14, font: FONT }),
      new TextRun({ text: value ?? '—', size: 20, font: FONT, color: C.ink }),
    ],
  })
}

function spacer(size = 140): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [new TextRun('')] })
}

/** Table header row — clean light header */
function tHead(cells: string[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: cells.map(c => new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      shading: { type: ShadingType.SOLID, color: C.panel, fill: C.panel },
      margins: { top: 110, bottom: 110, left: 160, right: 160 },
      children: [new Paragraph({
        children: [new TextRun({
          text: c.toUpperCase(),
          bold: true, size: 14, color: C.mute, font: FONT,
        })],
      })],
    })),
  })
}

/** Table data row — no zebra, just hairline separators */
function tRow(cells: (string | TextRun[])[]): TableRow {
  return new TableRow({
    children: cells.map(c => new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 90, bottom: 90, left: 160, right: 160 },
      children: [new Paragraph({
        children: typeof c === 'string'
          ? [new TextRun({ text: c, size: 19, font: FONT, color: C.ink })]
          : c,
      })],
    })),
  })
}

function makeTable(headers: string[], rows: (string | TextRun[])[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:              { style: BorderStyle.SINGLE, size: 4, color: C.line },
      bottom:           { style: BorderStyle.SINGLE, size: 4, color: C.line },
      left:             { style: BorderStyle.NONE },
      right:            { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C.lineSoft },
      insideVertical:   { style: BorderStyle.NONE },
    },
    rows: [tHead(headers), ...rows.map(r => tRow(r))],
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

  resetSections()

  // ── Cover ───────────────────────────────────────────────────────────────────
  const subtitle = trip.start_date && trip.end_date
    ? `${fmt(trip.start_date)}  →  ${fmt(trip.end_date)}`
    : trip.start_date ? `From ${fmt(trip.start_date)}` : ''
  add(...coverTitle(trip.title, subtitle, trip.destination))

  // ── Overview ────────────────────────────────────────────────────────────────
  add(...sectionHeading('', 'Overview'))
  if (trip.destination) add(kv('Destination', trip.destination))
  add(kv('Start date', fmt(trip.start_date)))
  add(kv('End date', fmt(trip.end_date)))
  if (trip.description) add(kv('Description', trip.description))
  add(spacer())

  // ── Budget ──────────────────────────────────────────────────────────────────
  if (stats) {
    add(...sectionHeading('', 'Budget'))
    add(makeTable(
      ['Category', 'Amount'],
      [
        ['Flights',         `€ ${stats.flights.toFixed(2)}`],
        ['Accommodations',  `€ ${stats.accommodation.toFixed(2)}`],
        ['Transports',      `€ ${stats.transport.toFixed(2)}`],
        ['Activities',      `€ ${stats.activities.toFixed(2)}`],
        ['Extras',          `€ ${stats.extras.toFixed(2)}`],
        [[new TextRun({ text: 'Total', bold: true, size: 19, font: FONT, color: C.ink })],
         [new TextRun({ text: `€ ${stats.total.toFixed(2)}`, bold: true, size: 19, font: FONT, color: C.ink })]],
      ]
    ))
    add(spacer())
  }

  // ── Flights ─────────────────────────────────────────────────────────────────
  if (flights.length > 0) {
    add(...sectionHeading('', 'Flights'))
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
    add(...sectionHeading('', 'Accommodations'))
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
    add(...sectionHeading('', 'Transports'))
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
    add(...sectionHeading('', 'Itinerary'))

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
          spacing: { before: 280, after: 80 },
          children: [new TextRun({ text: 'Unscheduled', bold: true, size: 22, color: C.mute, font: FONT })],
        }), new Paragraph({
          spacing: { after: 140 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 2 } },
          children: [new TextRun({ text: '', size: 2 })],
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
            indent: { left: 560 },
            children: [new TextRun({ text: a.notes, size: 17, color: C.mute, font: FONT })],
          }))
        }
      }
      add(spacer(100))
    }
  }

  // ── Extras ──────────────────────────────────────────────────────────────────
  if (extras.length > 0) {
    add(...sectionHeading('', 'Extras'))
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
    add(...sectionHeading('', 'Packing List'))

    const byCategory = packingItems.reduce<Record<string, PackingItem[]>>((acc, p) => {
      const key = p.category ?? 'other'
      if (!acc[key]) acc[key] = []
      acc[key].push(p)
      return acc
    }, {})

    for (const [cat, items] of Object.entries(byCategory)) {
      add(new Paragraph({
        spacing: { before: 240, after: 100 },
        children: [new TextRun({
          text: cat.toUpperCase(),
          bold: true, size: 14, color: C.mute, font: FONT,
        })],
      }))
      for (const item of items) {
        add(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 280 },
          children: [
            new TextRun({ text: item.checked ? '☑  ' : '☐  ', size: 20, color: item.checked ? C.accent : C.soft, font: FONT }),
            new TextRun({ text: item.name, size: 20, strike: item.checked, font: FONT, color: item.checked ? C.mute : C.ink }),
            ...(item.notes ? [new TextRun({ text: `   ${item.notes}`, size: 17, color: C.mute, font: FONT })] : []),
          ],
        }))
      }
    }
    add(spacer())
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (notes.length > 0) {
    add(...sectionHeading('', 'Notes'))
    for (const note of notes) {
      add(
        new Paragraph({
          spacing: { before: 220, after: 40 },
          children: [new TextRun({
            text: new Date(note.created_at).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }).toUpperCase(),
            size: 13, color: C.mute, font: FONT, bold: true,
          })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: note.text, size: 20, font: FONT, color: C.ink })],
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
          run: { font: FONT, size: 20, color: C.ink },
        },
      },
    },
    sections: [sectionDef],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${trip.title.replace(/[^a-z0-9]/gi, '_')}.docx`)
}

// ── Markdown Export ────────────────────────────────────────────────────────────
export function exportTripToMarkdown(params: {
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
  const md = buildTripMarkdown(params)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${params.trip.title.replace(/[^a-z0-9]/gi, '_')}.md`)
}

export function buildTripMarkdown(params: {
  trip: Trip
  flights: Flight[]
  accommodations: Accommodation[]
  transports: Transport[]
  activities: Activity[]
  notes: Note[]
  stats: TripStats | null
  extras: Extra[]
  packingItems: PackingItem[]
}): string {
  const { trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems } = params
  const L: string[] = []
  const push = (...lines: string[]) => L.push(...lines)

  const money = (n?: number | null, ccy = '€') => n != null ? `${ccy} ${n.toFixed(2)}` : '—'
  const status = (s?: string | null) => s ? s.replace('_', ' ') : '—'

  // ── Header ────────────────────────────────────────────────────────────────
  push(`# ${trip.title}`, '')
  const metaBits: string[] = []
  if (trip.destination) metaBits.push(`**Destination**: ${trip.destination}`)
  if (trip.start_date || trip.end_date) {
    metaBits.push(`**Dates**: ${fmt(trip.start_date)} → ${fmt(trip.end_date)}`)
  }
  if (metaBits.length) push(metaBits.join('  ·  '), '')
  if (trip.description) push(`> ${trip.description}`, '')

  // ── Budget ────────────────────────────────────────────────────────────────
  if (stats) {
    push('## Budget', '', '| Category | Amount |', '| --- | ---: |',
      `| Flights | ${money(stats.flights)} |`,
      `| Accommodations | ${money(stats.accommodation)} |`,
      `| Transports | ${money(stats.transport)} |`,
      `| Activities | ${money(stats.activities)} |`,
      `| Extras | ${money(stats.extras)} |`,
      `| **Total** | **${money(stats.total)}** |`, '')
  }

  // ── Flights ───────────────────────────────────────────────────────────────
  if (flights.length) {
    push('## Flights', '', '| Route | Date | Time | Airline | Flight # | Cost | Status | Ref |', '| --- | --- | --- | --- | --- | ---: | --- | --- |')
    flights
      .slice()
      .sort((a, b) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))
      .forEach(f => {
        const time = f.departure_time
          ? `${fmtTime(f.departure_time.slice(11))}${f.arrival_time ? ' → ' + fmtTime(f.arrival_time.slice(11)) : ''}`
          : '—'
        push(`| ${f.origin} → ${f.destination} | ${fmt(f.departure_time)} | ${time} | ${f.airline ?? '—'} | ${f.flight_number ?? '—'} | ${money(f.cost)} | ${status(f.status)} | ${f.booking_reference ?? '—'} |`)
      })
    push('')
  }

  // ── Accommodations ────────────────────────────────────────────────────────
  if (accommodations.length) {
    push('## Accommodations', '', '| Name | Location | Check-in | Check-out | Cost/night | Total | Status | Ref |', '| --- | --- | --- | --- | ---: | ---: | --- | --- |')
    accommodations
      .slice()
      .sort((a, b) => (a.check_in ?? '').localeCompare(b.check_in ?? ''))
      .forEach(a => {
        push(`| ${a.name} | ${a.location ?? a.address ?? '—'} | ${fmt(a.check_in)} | ${fmt(a.check_out)} | ${money(a.cost_per_night)} | ${money(a.total_cost)} | ${status(a.status)} | ${a.booking_reference ?? '—'} |`)
      })
    push('')
  }

  // ── Transports ────────────────────────────────────────────────────────────
  if (transports.length) {
    push('## Transports', '', '| Type | Route | Date & Time | Operator | Cost | Status | Ref |', '| --- | --- | --- | --- | ---: | --- | --- |')
    transports
      .slice()
      .sort((a, b) => (a.departure_time ?? '').localeCompare(b.departure_time ?? ''))
      .forEach(t => {
        const dt = t.departure_time
          ? `${fmt(t.departure_time)} ${fmtTime(t.departure_time.slice(11))}`
          : '—'
        const type = t.transport_type.charAt(0).toUpperCase() + t.transport_type.slice(1)
        push(`| ${type} | ${t.origin} → ${t.destination} | ${dt} | ${t.operator ?? '—'} | ${money(t.cost)} | ${status(t.status)} | ${t.booking_reference ?? '—'} |`)
      })
    push('')
  }

  // ── Itinerary by day ──────────────────────────────────────────────────────
  if (activities.length) {
    push('## Itinerary', '')
    const byDate = activities.reduce<Record<string, Activity[]>>((acc, a) => {
      const key = a.activity_date ?? '__unscheduled__'
      ;(acc[key] ??= []).push(a)
      return acc
    }, {})
    Object.values(byDate).forEach(list =>
      list.sort((a, b) => (!a.start_time ? 1 : !b.start_time ? -1 : a.start_time.localeCompare(b.start_time)))
    )

    for (const [date, acts] of Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))) {
      const loc = acts.find(a => a.location)?.location
      const dayLabel = date === '__unscheduled__' ? 'Unscheduled' : fmtDayHeader(date)
      push(`### ${dayLabel}${loc ? `  ·  ${loc}` : ''}`, '')
      for (const a of acts) {
        const time = a.start_time
          ? `${fmtTime(a.start_time)}${a.end_time ? '–' + fmtTime(a.end_time) : ''}`
          : ''
        const meta = [time, a.cost != null ? money(a.cost) : null].filter(Boolean).join(' · ')
        const head = meta ? `**${a.title ?? 'Untitled'}** — ${meta}` : `**${a.title ?? 'Untitled'}**`
        push(`- ${head}`)
        if (a.notes) push(`  - ${a.notes.replace(/\n+/g, ' ')}`)
      }
      push('')
    }
  }

  // ── Extras ────────────────────────────────────────────────────────────────
  if (extras.length) {
    push('## Extras', '', '| Category | Description | Estimated | Actual | Currency |', '| --- | --- | ---: | ---: | --- |')
    extras.forEach(e => {
      const cat = e.category ? e.category.charAt(0).toUpperCase() + e.category.slice(1) : '—'
      push(`| ${cat} | ${e.description ?? '—'} | ${e.amount != null ? e.amount.toFixed(2) : '—'} | ${e.actual_amount != null ? e.actual_amount.toFixed(2) : '—'} | ${e.currency ?? '€'} |`)
    })
    push('')
  }

  // ── Packing List ──────────────────────────────────────────────────────────
  if (packingItems.length) {
    push('## Packing List', '')
    const byCat = packingItems.reduce<Record<string, PackingItem[]>>((acc, p) => {
      ;(acc[p.category ?? 'other'] ??= []).push(p)
      return acc
    }, {})
    for (const [cat, items] of Object.entries(byCat)) {
      push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`, '')
      items.forEach(i => {
        const box = i.checked ? '[x]' : '[ ]'
        const note = i.notes ? ` — ${i.notes}` : ''
        push(`- ${box} ${i.name}${note}`)
      })
      push('')
    }
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (notes.length) {
    push('## Notes', '')
    for (const n of notes) {
      const when = new Date(n.created_at).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
      push(`**${when}**`, '', n.text, '', '---', '')
    }
  }

  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ── PDF Export ─────────────────────────────────────────────────────────────────

const PDF_C = {
  ink:       [15, 23, 42]   as [number, number, number],
  inkSoft:   [51, 65, 85]   as [number, number, number],
  mute:      [100, 116, 139] as [number, number, number],
  soft:      [148, 163, 184] as [number, number, number],
  line:      [226, 232, 240] as [number, number, number],
  lineSoft:  [241, 245, 249] as [number, number, number],
  panel:     [248, 250, 252] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  accent:    [45, 74, 62]   as [number, number, number],
  accentMid: [74, 122, 90]  as [number, number, number],
  red:       [220, 38, 38]  as [number, number, number],
  amber:     [217, 119, 6]  as [number, number, number],
  green:     [22, 163, 74]  as [number, number, number],
  // legacy aliases
  forest:    [15, 23, 42]   as [number, number, number],
  forestMid: [51, 65, 85]   as [number, number, number],
  mint:      [45, 74, 62]   as [number, number, number],
  mintLight: [148, 163, 184] as [number, number, number],
  mist:      [248, 250, 252] as [number, number, number],
  ivory:     [248, 250, 252] as [number, number, number],
  grey:      [100, 116, 139] as [number, number, number],
  greyLight: [226, 232, 240] as [number, number, number],
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

  // ── Section header: numbered eyebrow + display title + hairline rule ────────
  let pdfSectionN = 0
  const sectionHeader = (title: string) => {
    checkPage(64)
    pdfSectionN += 1
    const num = String(pdfSectionN).padStart(2, '0')
    // Eyebrow
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...PDF_C.accent)
    doc.text(`${num}   ·   SECTION`, MARGIN, y)
    y += 14
    // Display title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.setTextColor(...PDF_C.ink)
    doc.text(title, MARGIN, y + 4)
    y += 14
    // Hairline rule
    doc.setDrawColor(...PDF_C.line)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y + 6, W - MARGIN, y + 6)
    y += 22
  }

  const kvLine = (label: string, value: string | null | undefined) => {
    checkPage(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...PDF_C.mute)
    doc.text(label.toUpperCase(), MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...PDF_C.ink)
    doc.text(safe(value), MARGIN, y + 13)
    y += 26
  }

  // ── Cover — editorial: eyebrow label, large title, accent rule, meta row ────
  // Top-right brand mark
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_C.soft)
  doc.text('WanderPlan', W - MARGIN, MARGIN + 4, { align: 'right' })

  // Eyebrow label centered
  const eyebrowY = H * 0.32
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_C.accentMid)
  doc.text('T R I P   D O S S I E R', W / 2, eyebrowY, { align: 'center' })

  // Display title — wrap, center
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(34)
  doc.setTextColor(...PDF_C.ink)
  const titleLines = doc.splitTextToSize(safe(trip.title), W - MARGIN * 2.5)
  const titleY = eyebrowY + 38
  doc.text(titleLines, W / 2, titleY, { align: 'center' })
  const titleEndY = titleY + (titleLines.length - 1) * 40

  // Thin accent rule
  const ruleY = titleEndY + 28
  doc.setDrawColor(...PDF_C.accent)
  doc.setLineWidth(1)
  const ruleW = 56
  doc.line(W / 2 - ruleW / 2, ruleY, W / 2 + ruleW / 2, ruleY)

  // Meta row — destination · dates
  const subtitle = trip.start_date && trip.end_date
    ? `${fmt(trip.start_date)}  -  ${fmt(trip.end_date)}`
    : trip.start_date ? `From ${fmt(trip.start_date)}` : ''
  const metaParts: string[] = []
  if (trip.destination) metaParts.push(safe(trip.destination))
  if (subtitle) metaParts.push(subtitle)
  if (metaParts.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...PDF_C.mute)
    doc.text(metaParts.join('   ·   '), W / 2, ruleY + 28, { align: 'center' })
  }

  // Bottom footer mark
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...PDF_C.soft)
  doc.text('Your journey, beautifully documented.', W / 2, H - MARGIN - 4, { align: 'center' })

  doc.addPage()
  y = MARGIN

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
        ['Total',            `EUR ${stats.total.toFixed(2)}`],
      ],
      headStyles: {
        fillColor: PDF_C.panel, textColor: PDF_C.mute, fontStyle: 'bold', fontSize: 7,
        cellPadding: { top: 8, bottom: 8, left: 10, right: 10 }, lineColor: PDF_C.line, lineWidth: 0.4,
      },
      bodyStyles: { fontSize: 9, cellPadding: { top: 8, bottom: 8, left: 10, right: 10 }, textColor: PDF_C.ink },
      styles: { lineColor: PDF_C.lineSoft, lineWidth: 0.3 },
      didParseCell: (data) => {
        if (data.row.index === 5 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = PDF_C.ink
          data.cell.styles.fillColor = PDF_C.panel
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
        fillColor: PDF_C.panel, textColor: PDF_C.mute, fontStyle: 'bold', fontSize: 7,
        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 }, lineColor: PDF_C.line, lineWidth: 0.4,
      },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 }, textColor: PDF_C.ink },
      styles: { lineColor: PDF_C.lineSoft, lineWidth: 0.3 },
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
        fillColor: PDF_C.panel, textColor: PDF_C.mute, fontStyle: 'bold', fontSize: 7,
        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 }, lineColor: PDF_C.line, lineWidth: 0.4,
      },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 }, textColor: PDF_C.ink },
      styles: { lineColor: PDF_C.lineSoft, lineWidth: 0.3 },
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
        fillColor: PDF_C.panel, textColor: PDF_C.mute, fontStyle: 'bold', fontSize: 7,
        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 }, lineColor: PDF_C.line, lineWidth: 0.4,
      },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 }, textColor: PDF_C.ink },
      styles: { lineColor: PDF_C.lineSoft, lineWidth: 0.3 },
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
      checkPage(48)

      // Day header — clean date + hairline
      const dayLabel = date === '__unscheduled__' ? 'Unscheduled' : fmtDayHeader(date)
      const loc = acts.find(a => a.location)?.location
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...PDF_C.ink)
      doc.text(dayLabel, MARGIN, y)
      if (loc) {
        const labelW = doc.getTextWidth(dayLabel)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...PDF_C.mute)
        doc.text(`   ·   ${safe(loc)}`, MARGIN + labelW, y)
      }
      y += 10
      doc.setDrawColor(...PDF_C.line)
      doc.setLineWidth(0.4)
      doc.line(MARGIN, y, W - MARGIN, y)
      y += 16

      for (const a of acts) {
        checkPage(16)
        const time = a.start_time
          ? `${fmtTime(a.start_time)}${a.end_time ? '-' + fmtTime(a.end_time) : ''}`
          : ''
        const cost = a.cost != null ? `EUR ${a.cost.toFixed(2)}` : ''
        const title = safe(a.title) || 'Untitled'

        // Left time column — tabular muted
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...PDF_C.mute)
        const timeW = 52
        if (time) doc.text(time, MARGIN, y)

        // Title
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(...PDF_C.ink)
        doc.text(title, MARGIN + timeW, y)

        // Cost right-aligned
        if (cost) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...PDF_C.mute)
          doc.text(cost, W - MARGIN, y, { align: 'right' })
        }
        y += 14
        if (a.notes) {
          checkPage(13)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...PDF_C.mute)
          const noteLines = doc.splitTextToSize(safe(a.notes), W - MARGIN * 2 - timeW)
          doc.text(noteLines, MARGIN + timeW, y)
          y += noteLines.length * 11 + 2
        }
      }
      y += 10
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
        fillColor: PDF_C.panel, textColor: PDF_C.mute, fontStyle: 'bold', fontSize: 7,
        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 }, lineColor: PDF_C.line, lineWidth: 0.4,
      },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 }, textColor: PDF_C.ink },
      styles: { lineColor: PDF_C.lineSoft, lineWidth: 0.3 },
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
      checkPage(32)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...PDF_C.mute)
      doc.text(cat.toUpperCase(), MARGIN, y)
      y += 14
      for (const item of items) {
        checkPage(14)
        // Checkbox
        doc.setDrawColor(...(item.checked ? PDF_C.accent : PDF_C.soft))
        doc.setLineWidth(0.6)
        doc.rect(MARGIN, y - 7, 7, 7)
        if (item.checked) {
          doc.setFillColor(...PDF_C.accent)
          doc.rect(MARGIN, y - 7, 7, 7, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(...PDF_C.white)
          doc.text('x', MARGIN + 2.1, y - 1.5)
        }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...(item.checked ? PDF_C.mute : PDF_C.ink))
        const itemName = safe(item.name)
        doc.text(itemName, MARGIN + 13, y)
        if (item.notes) {
          doc.setTextColor(...PDF_C.soft)
          doc.setFontSize(8)
          doc.text(`  ${safe(item.notes)}`, MARGIN + 13 + doc.getTextWidth(itemName) + 2, y)
        }
        y += 14
      }
      y += 8
    }
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (notes.length > 0) {
    sectionHeader('Notes')
    for (const note of notes) {
      checkPage(36)
      // Note date — uppercase muted eyebrow
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...PDF_C.mute)
      doc.text(new Date(note.created_at).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).toUpperCase(), MARGIN, y)
      y += 14
      // Note text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...PDF_C.ink)
      const lines = doc.splitTextToSize(safe(note.text), W - MARGIN * 2)
      doc.text(lines, MARGIN, y)
      y += lines.length * 13 + 14
      // Hairline separator
      doc.setDrawColor(...PDF_C.line)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y - 8, W - MARGIN, y - 8)
    }
  }

  // ── Page footers (skip cover = page 1) ───────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    // Hairline above footer
    doc.setDrawColor(...PDF_C.line)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, H - FOOTER_H, W - MARGIN, H - FOOTER_H)
    // Footer text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...PDF_C.mute)
    doc.text(safe(trip.title), MARGIN, H - FOOTER_H + 14)
    doc.text(`${p - 1} / ${totalPages - 1}`, W - MARGIN, H - FOOTER_H + 14, { align: 'right' })
  }

  doc.save(`${trip.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
}
