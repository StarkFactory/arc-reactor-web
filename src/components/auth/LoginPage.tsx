import { useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import './LoginPage.css'

type Mode = 'login' | 'register'

export function LoginPage() {
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
        <div className="LoginPage-logo">Arc Reactor</div>
        <p className="LoginPage-subtitle">AI Agent Chat</p>

        <div className="LoginPage-tabs">
          <button
            className={`LoginPage-tab ${mode === 'login' ? 'LoginPage-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            로그인
          </button>
          <button
            className={`LoginPage-tab ${mode === 'register' ? 'LoginPage-tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            회원가입
          </button>
        </div>

        <form className="LoginPage-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              className="LoginPage-input"
              type="text"
              placeholder="이름"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="LoginPage-input"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <input
            className="LoginPage-input"
            type="password"
            placeholder={mode === 'register' ? '비밀번호 (8자 이상)' : '비밀번호'}
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
            {isLoading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
