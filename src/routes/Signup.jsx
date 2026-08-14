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
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Criar conta</h1>
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
