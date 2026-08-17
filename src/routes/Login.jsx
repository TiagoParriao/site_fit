import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-login-page">
      <section className="auth-intro">
        <div className="auth-brand">
          <span className="navbar-logo-mark"><i /><i /><i /></span>
          <span><strong>Magros</strong> <em>Skinnys</em></span>
        </div>
        <div className="auth-intro-copy">
          <span className="auth-pill">Saúde compartilhada</span>
          <h2>Juntos no caminho.<br /><em>Cada um no seu ritmo.</em></h2>
          <p>Acompanhe saúde, evolução e hábitos com quem importa — mantendo suas finanças só para você.</p>
        </div>
        <div className="auth-highlights">
          <span><strong>Saúde</strong>visível no grupo</span>
          <span><strong>Finanças</strong>100% privadas</span>
          <span><strong>Histórico</strong>sempre preservado</span>
        </div>
      </section>
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div className="auth-mobile-brand"><span className="navbar-logo-mark"><i /><i /><i /></span><span><strong>Magros</strong> <em>Skinnys</em></span></div>
        <span className="auth-form-kicker">Boas-vindas de volta</span>
        <h1>Entrar</h1>
        <p className="auth-form-subtitle">Continue de onde parou.</p>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p>
          Não tem conta? <Link to="/signup">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}
