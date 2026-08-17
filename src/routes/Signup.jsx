import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    dataNascimento: '',
    sexo: 'M',
    alturaCm: '',
    pesoInicial: '',
    metaKcalDiaria: '2000',
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const result = await signUp({
        email: form.email,
        password: form.password,
        nome: form.nome,
        dataNascimento: form.dataNascimento,
        sexo: form.sexo,
        alturaCm: Number(form.alturaCm),
        pesoInicial: Number(form.pesoInicial),
        metaKcalDiaria: Number(form.metaKcalDiaria),
      })
      if (result.needsEmailConfirmation) {
        setInfo('Conta criada! Confirme seu email antes de entrar.')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-login-page auth-signup-page">
      <section className="auth-intro auth-signup-intro">
        <div className="auth-brand">
          <span className="navbar-logo-mark"><i /><i /><i /></span>
          <span><strong>Magros</strong> <em>Skinnys</em></span>
        </div>
        <div className="auth-intro-copy">
          <span className="auth-pill">Comece sua trilha</span>
          <h2>Seu progresso.<br /><em>Do seu jeito.</em></h2>
          <p>Crie sua conta, entre no grupo e comece a construir um histórico que acompanha você.</p>
        </div>
        <div className="auth-highlights"><span><strong>Uma conta</strong>todo o histórico</span><span><strong>Seu grupo</strong>apoio compartilhado</span></div>
      </section>
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div className="auth-mobile-brand"><span className="navbar-logo-mark"><i /><i /><i /></span><span><strong>Magros</strong> <em>Skinnys</em></span></div>
        <span className="auth-form-kicker">Comece sua trilha</span>
        <h1>Criar conta</h1>
        <p className="auth-form-subtitle">Leva menos de dois minutos.</p>
        {error && <p className="error">{error}</p>}
        {info && <p className="info">{info}</p>}

        <label>
          Nome
          <input value={form.nome} onChange={update('nome')} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Senha
          <input type="password" value={form.password} onChange={update('password')} minLength={6} required />
        </label>
        <label>
          Data de nascimento
          <input type="date" value={form.dataNascimento} onChange={update('dataNascimento')} required />
        </label>
        <label>
          Sexo
          <select value={form.sexo} onChange={update('sexo')}>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </label>
        <label>
          Altura (cm)
          <input type="number" step="0.1" value={form.alturaCm} onChange={update('alturaCm')} required />
        </label>
        <label>
          Peso atual (kg)
          <input type="number" step="0.1" value={form.pesoInicial} onChange={update('pesoInicial')} required />
        </label>
        <label>
          Meta de calorias diárias
          <input type="number" value={form.metaKcalDiaria} onChange={update('metaKcalDiaria')} required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
        <p>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
