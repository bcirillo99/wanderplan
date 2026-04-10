// frontend/src/components/FormField.tsx

interface BaseProps { label: string; required?: boolean }
interface InputProps    extends BaseProps { type: 'input';    inputType?: string; value: string; onChange: (v: string) => void; placeholder?: string; min?: string; max?: string }
interface TextareaProps extends BaseProps { type: 'textarea'; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }
interface SelectProps   extends BaseProps { type: 'select';   value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }

type FormFieldProps = InputProps | TextareaProps | SelectProps

export default function FormField(props: FormFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        {props.label}
        {props.required && <span>*</span>}
      </label>
      {props.type === 'textarea' ? (
        <textarea
          className="form-control"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows ?? 3}
        />
      ) : props.type === 'select' ? (
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
      ) : (
        <input
          type={props.inputType ?? 'text'}
          className="form-control"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          required={props.required}
          min={props.min}
          max={props.max}
        />
      )}
    </div>
  )
}
