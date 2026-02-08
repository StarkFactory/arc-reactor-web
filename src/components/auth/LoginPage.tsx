import { useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import './LoginPage.css'

type Mode = 'login' | 'register'

export function LoginPage() {
  const { t } = useTranslation()
  const { login, register, error, clearError, isLoading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode)
    clearError()
    setEmail('')
    setPassword('')
    setName('')
  }, [clearError])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, password, name)
    }
  }, [mode, email, password, name, login, register])

  const isValid = mode === 'login'
    ? email.trim() && password.trim()
    : email.trim() && password.length >= 8 && name.trim()

  return (
    <div className="LoginPage">
      <div className="LoginPage-card">
        <div className="LoginPage-logo">{t('app.title')}</div>
        <p className="LoginPage-subtitle">{t('app.subtitle')}</p>

        <div className="LoginPage-tabs">
          <button
            className={`LoginPage-tab ${mode === 'login' ? 'LoginPage-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            {t('auth.login')}
          </button>
          <button
            className={`LoginPage-tab ${mode === 'register' ? 'LoginPage-tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            {t('auth.register')}
          </button>
        </div>

        <form className="LoginPage-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              className="LoginPage-input"
              type="text"
              placeholder={t('auth.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="LoginPage-input"
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <input
            className="LoginPage-input"
            type="password"
            placeholder={mode === 'register' ? t('auth.passwordHint') : t('auth.password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && <div className="LoginPage-error">{error}</div>}

          <button
            className="LoginPage-submit"
            type="submit"
            disabled={!isValid || isLoading}
          >
            {isLoading ? t('auth.processing') : mode === 'login' ? t('auth.login') : t('auth.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
