import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError } from '../../../shared/api/apiError'
import { messageFor } from '../../../shared/api/errorMessages'
import { register as registerAccount } from '../api/authApi'
import {
  registerSchema,
  type RegisterFormValues,
  type RegisterRequest,
} from '../schemas/registerSchema'
import { PasswordField } from './PasswordField'

/**
 * Mensajes propios para los errores de validación que devuelve el servidor. La
 * interfaz nunca muestra el texto crudo de la respuesta: enruta por `code` y
 * por `field`, que sí son parte del contrato.
 */
const SERVER_FIELD_MESSAGES: Record<string, string> = {
  email: 'Escribe un email válido, con @ y dominio.',
  password: 'Esa contraseña no cumple los requisitos.',
  displayName: 'Ese nombre no es válido. Usa entre 2 y 100 caracteres visibles.',
}

interface RegisterFormProps {
  /** Recibe el email ya normalizado, para la pantalla de espera. */
  onRegistered: (email: string) => void
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const emailId = useId()
  const nameId = useId()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' },
    mode: 'onBlur',
  })

  const password = watch('password') ?? ''

  const onSubmit = async (values: RegisterRequest) => {
    try {
      await registerAccount(values)
      onRegistered(values.email)
    } catch (error) {
      if (error instanceof ApiError && error.is('VALIDATION_ERROR') && error.errors.length > 0) {
        for (const fieldError of error.errors) {
          if (fieldError.field in SERVER_FIELD_MESSAGES) {
            setError(fieldError.field as keyof RegisterFormValues, {
              message: SERVER_FIELD_MESSAGES[fieldError.field],
            })
          }
        }
        return
      }
      if (error instanceof ApiError && error.is('WEAK_PASSWORD')) {
        setError('password', { message: messageFor(error) })
        return
      }
      setError('root', { message: messageFor(error) })
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor={emailId}>Email</label>
        <input
          {...register('email')}
          id={emailId}
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
        />
        {errors.email && (
          <p className="field__error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={nameId}>Nombre visible</label>
        <input
          {...register('displayName')}
          id={nameId}
          type="text"
          autoComplete="name"
          aria-invalid={errors.displayName ? true : undefined}
        />
        {errors.displayName && (
          <p className="field__error" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <PasswordField
        {...register('password')}
        label="Contraseña"
        value={password}
        error={errors.password?.message}
      />

      {errors.root && (
        <p className="form__error" role="alert">
          {errors.root.message}
        </p>
      )}

      <button className="button button--primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
