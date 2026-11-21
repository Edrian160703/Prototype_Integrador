import PhoneField from '../PhoneField'
import type { CheckoutCustomer } from '../../types/checkout'
import { DNI_LENGTH } from '../../validation/dni'
import type { CheckoutErrors } from '../../validation/checkout'

interface CustomerFieldsProps {
  values: CheckoutCustomer
  errors: CheckoutErrors
  disabled?: boolean
  onChange: (field: keyof CheckoutCustomer, value: string) => void
  onBlur: (field: keyof CheckoutCustomer) => void
}

export default function CustomerFields({ values, errors, disabled = false, onChange, onBlur }: CustomerFieldsProps) {
  return (
    <fieldset className="checkout-fieldset" disabled={disabled}>
      <legend>Tus datos</legend>

      <div className="field">
        <label htmlFor="checkout-nombre">Nombre completo</label>
        <input
          id="checkout-nombre"
          autoComplete="name"
          value={values.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
          onBlur={() => onBlur('nombre')}
          placeholder="Ej. Ana García Torres"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? 'checkout-nombre-error' : undefined}
        />
        {errors.nombre && <span id="checkout-nombre-error" className="field-error">{errors.nombre}</span>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="checkout-dni">DNI</label>
          <input
            id="checkout-dni"
            inputMode="numeric"
            autoComplete="off"
            maxLength={DNI_LENGTH}
            pattern={`\\d{${DNI_LENGTH}}`}
            value={values.dni}
            onChange={(event) => onChange('dni', event.target.value)}
            onBlur={() => onBlur('dni')}
            placeholder="8 dígitos"
            aria-invalid={Boolean(errors.dni)}
            aria-describedby="checkout-dni-hint"
          />
          {errors.dni
            ? <span id="checkout-dni-hint" className="field-error">{errors.dni}</span>
            : <span id="checkout-dni-hint" className="checkout-hint">Lo pedimos para validar tu identidad al recoger.</span>}
        </div>

        <PhoneField
          id="checkout-telefono"
          label="Teléfono (WhatsApp)"
          value={values.telefono}
          onChange={(value) => onChange('telefono', value)}
          onBlur={() => onBlur('telefono')}
          invalid={Boolean(errors.telefono)}
          error={errors.telefono}
        />
      </div>
    </fieldset>
  )
}
