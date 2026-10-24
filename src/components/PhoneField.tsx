import { PHONE_COUNTRY_CODE, PHONE_LENGTH, sanitizePhone } from '../validation/phone'

interface PhoneFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  invalid?: boolean
  required?: boolean
}

export default function PhoneField({ id, label, value, onChange, onBlur, error, invalid = false, required }: PhoneFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="phone-input">
        <span className="phone-input-prefix" aria-hidden="true">
          {PHONE_COUNTRY_CODE}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          maxLength={PHONE_LENGTH}
          pattern={`\\d{${PHONE_LENGTH}}`}
          value={value}
          onChange={(event) => onChange(sanitizePhone(event.target.value))}
          onBlur={onBlur}
          aria-invalid={invalid}
          placeholder="Ej. 987654321"
        />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
