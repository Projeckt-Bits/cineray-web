'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.js'

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setError('Check your email for a confirmation link!')
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-form">
      <div className="auth-form__container">
        <h2 className="auth-form__title">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        
        <form onSubmit={handleSubmit} className="auth-form__form">
          <div className="auth-form__field">
            <label htmlFor="email" className="auth-form__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-form__input"
              placeholder="Enter your email"
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="password" className="auth-form__label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="auth-form__input"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-form__submit"
          >
            {isSubmitting ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-form__toggle">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="auth-form__toggle-button"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </div>

      <style jsx>{`
        .auth-form {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-form__container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }

        .auth-form__title {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .auth-form__form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-form__field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .auth-form__label {
          font-weight: 500;
          color: #555;
        }

        .auth-form__input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .auth-form__input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .auth-form__error {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid #fcc;
          font-size: 0.9rem;
        }

        .auth-form__submit {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .auth-form__submit:hover:not(:disabled) {
          background: #5a6fd8;
        }

        .auth-form__submit:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .auth-form__toggle {
          text-align: center;
          margin-top: 1rem;
        }

        .auth-form__toggle-button {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          text-decoration: underline;
          font-size: 0.9rem;
        }

        .auth-form__toggle-button:hover {
          color: #5a6fd8;
        }
      `}</style>
    </div>
  )
}