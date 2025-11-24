import { type FormEvent, useMemo, useState } from 'react'
import type { AuthForm, AuthMode } from '../types/auth'

type AuthFormProps = {
  onLoginSuccess?: (data?: unknown, context?: { email: string }) => void
}

const emptyForm: AuthForm = {
  email: '',
  password: '',
  displayName: '',
  confirmPassword: '',
}

const normalizeBackendUrl = (host?: string) => {
  if (!host) return ''
  const trimmed = host.trim().replace(/\/+$/, '')
  return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`
}

const env = import.meta.env as Record<string, string | undefined>
const backendHost = env.VITE_BACKEND_IP
const backendBaseUrl = normalizeBackendUrl(backendHost)

const apiRoutes = {
  login: backendBaseUrl ? `${backendBaseUrl}/api/login` : '/api/login',
  signup: backendBaseUrl ? `${backendBaseUrl}/api/register` : '/api/register',
}

function AuthFormCard({ onLoginSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState<AuthForm>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)

  const title = useMemo(
    () => (mode === 'login' ? 'Welcome back' : 'Create your account'),
    [mode],
  )

  const handleChange = (field: keyof AuthForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const switchMode = (next: AuthMode, opts?: { keepMessage?: boolean }) => {
    setMode(next)
    if (!opts?.keepMessage) {
      setMessage(null)
    }
    setForm(emptyForm)
  }

  const validate = () => {
    if (!form.email.trim()) return 'Email is required'
    if (!form.password.trim()) return 'Password is required'
    if (mode === 'signup') {
      if (!form.displayName.trim()) return 'Display name is required'
      if (form.password.length < 8)
        return 'Password must be at least 8 characters'
      if (form.password !== form.confirmPassword)
        return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)

    const error = validate()
    if (error) {
      setMessage(error)
      return
    }

    if (mode === 'login') {
      try {
        setMessage('Logging in...')
        const response = await fetch(apiRoutes.login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Email: form.email,
            Password: form.password,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Login failed')
        }

        const body = await response.json().catch(() => null)
        const successMessage =
          (body && (body.message || body.Message)) || 'Logged in successfully.'
        setMessage(successMessage)
        onLoginSuccess?.(body, { email: form.email })
      } catch (err) {
        const fallback =
          err instanceof Error
            ? err.message
            : 'Could not complete login. Please try again.'
        setMessage(fallback)
      }
      return
    }

    // Replace with a real API call to your backend for signup.
    try {
      setMessage('Creating account...') 
      const response = await fetch(apiRoutes.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AvatarURL: 'string',
          DisplayName: form.displayName,
          Email: form.email,
          Password: form.password,
        }),
      })    
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Signup failed')
      }
      
      const body = await response.json().catch(() => null)
      const successMessage =
        (body && (body.message || body.Message)) ||
        'Account created successfully.'
      const finalMessage = `${successMessage} Please log in.`
      setMessage(finalMessage)
      switchMode('login', { keepMessage: true })
    } catch (err) {
      const fallback =
        err instanceof Error
          ? err.message
          : 'Could not complete signup. Please try again.'
      setMessage(fallback)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1>{title}</h1>
        <p className="subhead">
          {mode === 'login'
            ? 'Log in to manage your warehouse.'
            : ''}
        </p>
      </div>

      <div className="auth-switch">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => switchMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => switchMode('signup')}
        >
          Sign up
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label className="field">
            <span>Display name</span>
            <input
              name="displayName"
              type="text"
              placeholder="Your name as shown publicly"
              autoComplete="name"
              value={form.displayName}
              onChange={(e) => handleChange('displayName')(e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => handleChange('email')(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={(e) => handleChange('password')(e.target.value)}
          />
        </label>

        {mode === 'signup' && (
          <label className="field">
            <span>Confirm password</span>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) =>
                handleChange('confirmPassword')(e.target.value)
              }
            />
          </label>
        )}

        {message && <div className="banner">{message}</div>}

        <button type="submit" className="submit">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

export default AuthFormCard
