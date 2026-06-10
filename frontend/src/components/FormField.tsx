// frontend/src/components/FormField.tsx
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { parse, format, isValid } from 'date-fns'

// ── String ↔ Date helpers ──────────────────────────────────────────────────────
const DATE_FMT     = 'yyyy-MM-dd'
const TIME_FMT     = 'HH:mm'
const DATETIME_FMT = "yyyy-MM-dd'T'HH:mm"

function toDate(value: string, fmt: string): Date | null {
  if (!value) return null
  const d = parse(value, fmt, new Date())
  return isValid(d) ? d : null
}

function fromDate(d: Date | null, fmt: string): string {
  return d && isValid(d) ? format(d, fmt) : ''
}

function parseMin(s?: string, fmt = DATE_FMT): Date | undefined {
  if (!s) return undefined
  const d = parse(s, fmt, new Date())
  return isValid(d) ? d : undefined
}

// ── Prop types ─────────────────────────────────────────────────────────────────
interface BaseProps { label: string; required?: boolean }
interface InputProps    extends BaseProps { type: 'input';    inputType?: string; value: string; onChange: (v: string) => void; placeholder?: string; min?: string; max?: string; disabled?: boolean }
interface TextareaProps extends BaseProps { type: 'textarea'; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }
interface SelectProps   extends BaseProps { type: 'select';   value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }
interface DateProps     extends BaseProps { type: 'date';     value: string; onChange: (v: string) => void; min?: string; max?: string; placeholder?: string }
interface TimeProps     extends BaseProps { type: 'time';     value: string; onChange: (v: string) => void; }
interface DateTimeProps extends BaseProps { type: 'datetime'; value: string; onChange: (v: string) => void; min?: string; max?: string; placeholder?: string }

type FormFieldProps = InputProps | TextareaProps | SelectProps | DateProps | TimeProps | DateTimeProps

export default function FormField(props: FormFieldProps) {
  const label = (
    <label className="form-label">
      {props.label}
      {props.required && <span>*</span>}
    </label>
  )

  if (props.type === 'textarea') {
    return (
      <div className="form-group">
        {label}
        <textarea
          className="form-control"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows ?? 3}
        />
      </div>
    )
  }

  if (props.type === 'select') {
    return (
      <div className="form-group">
        {label}
        <select
          className="form-control"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if (props.type === 'date') {
    return (
      <div className="form-group">
        {label}
        <ReactDatePicker
          selected={toDate(props.value, DATE_FMT)}
          onChange={(d: Date | null) => props.onChange(fromDate(d, DATE_FMT))}
          dateFormat="dd MMM yyyy"
          minDate={parseMin(props.min, DATE_FMT)}
          maxDate={parseMin(props.max, DATE_FMT)}
          placeholderText={props.placeholder ?? 'Select date…'}
          className="form-control"
          popperProps={{ strategy: 'fixed' }}
          autoComplete="off"
        />
      </div>
    )
  }

  if (props.type === 'time') {
    return (
      <div className="form-group">
        {label}
        <ReactDatePicker
          selected={toDate(props.value, TIME_FMT)}
          onChange={(d: Date | null) => props.onChange(fromDate(d, TIME_FMT))}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={5}
          timeCaption="Time"
          dateFormat="HH:mm"
          timeFormat="HH:mm"
          placeholderText="Select time…"
          className="form-control"
          popperProps={{ strategy: 'fixed' }}
          autoComplete="off"
        />
      </div>
    )
  }

  if (props.type === 'datetime') {
    return (
      <div className="form-group">
        {label}
        <ReactDatePicker
          selected={toDate(props.value, DATETIME_FMT)}
          onChange={(d: Date | null) => props.onChange(fromDate(d, DATETIME_FMT))}
          showTimeSelect
          timeIntervals={5}
          timeCaption="Time"
          dateFormat="dd MMM yyyy, HH:mm"
          timeFormat="HH:mm"
          minDate={parseMin(props.min, DATETIME_FMT)}
          maxDate={parseMin(props.max, DATETIME_FMT)}
          placeholderText={props.placeholder ?? 'Select date & time…'}
          className="form-control"
          popperProps={{ strategy: 'fixed' }}
          autoComplete="off"
        />
      </div>
    )
  }

  // default: input
  return (
    <div className="form-group">
      {label}
      <input
        type={props.inputType ?? 'text'}
        className="form-control"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        min={props.min}
        max={props.max}
        disabled={props.disabled}
      />
    </div>
  )
}
