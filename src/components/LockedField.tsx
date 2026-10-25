interface LockedFieldProps {
  id: string
  label: string
  /** Valor ya preparado para mostrar (por ejemplo, un dato enmascarado). */
  value: string
  placeholder?: string
  hint?: string
  type?: string
}

/** Campo de solo lectura: solo presenta el valor recibido, no conoce su origen ni su formato. */
export default function LockedField({ id, label, value, placeholder, hint, type = 'text' }: LockedFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} readOnly disabled />
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  )
}
