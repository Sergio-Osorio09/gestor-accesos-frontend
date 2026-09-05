import { useId, useState, type ComponentPropsWithRef } from 'react'
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  utf8ByteLength,
} from '../schemas/registerSchema'
import { STRENGTH_LABEL, strengthOf } from './passwordStrength'

interface PasswordFieldProps extends ComponentPropsWithRef<'input'> {
  label: string
  value: string
  error?: string
}

export function PasswordField({ label, value, error, ...inputProps }: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  const bytes = utf8ByteLength(value)
  const longEnough = value.length >= PASSWORD_MIN_LENGTH
  const withinBcryptLimit = bytes <= PASSWORD_MAX_BYTES
  const strength = strengthOf(value)

  return (
    <div className="field">
      <div className="field__header">
        <label htmlFor={id}>{label}</label>
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <input
        {...inputProps}
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-requirements`}
      />

      {value.length > 0 && (
        <p className={`strength strength--${strength}`}>
          Fuerza orientativa: <strong>{STRENGTH_LABEL[strength]}</strong>
        </p>
      )}

      <ul className="requirements" id={`${id}-requirements`}>
        <Requirement met={longEnough}>
          Al menos {PASSWORD_MIN_LENGTH} caracteres. No pedimos mayúsculas, dígitos ni símbolos:
          una frase larga es mejor contraseña.
        </Requirement>
        <Requirement met={withinBcryptLimit}>
          Como mucho {PASSWORD_MAX_BYTES} bytes (llevas {bytes}). Los acentos y los emojis ocupan
          más de un byte.
        </Requirement>
      </ul>

      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  )
}

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={met ? 'requirement requirement--met' : 'requirement'}>
      <span aria-hidden="true">{met ? '✓' : '·'}</span>
      <span>{children}</span>
    </li>
  )
}
