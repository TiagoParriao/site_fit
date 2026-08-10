import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fetchMeasurements, latestByName, historyForName } from '../lib/measurements'
import MeasurementChart from './MeasurementChart'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function MeasurementsSection() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  const [selectedNome, setSelectedNome] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await fetchMeasurements(supabase, user.id)
    setLogs(rows)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  const latest = useMemo(() => latestByName(logs), [logs])
  const nomesConhecidos = useMemo(() => [...new Set(logs.map((l) => l.nome))].sort(), [logs])
  const historico = useMemo(() => historyForName(logs, selectedNome), [logs, selectedNome])

  useEffect(() => {
    if (!selectedNome && latest.length > 0) setSelectedNome(latest[0].nome)
  }, [latest, selectedNome])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const nomeLimpo = nome.trim()
    const { error } = await supabase
      .from('measurement_logs')
      .upsert({ user_id: user.id, nome: nomeLimpo, valor_cm: Number(valor), data }, { onConflict: 'user_id,nome,data' })
    if (error) {
      setError(error.message)
      return
    }
    setSelectedNome(nomeLimpo)
    setNome('')
    setValor('')
    setData(todayISO())
    load()
  }

  async function handleDelete(id) {
    await supabase.from('measurement_logs').delete().eq('id', id)
    load()
  }

  return (
    <div className="card">
      <h2>Medidas corporais</h2>
      {error && <p className="error">{error}</p>}

      <form className="stacked-form" onSubmit={handleAdd}>
        <div className="grid-3">
          <label>
            Medida
            <input
              list="medidas-conhecidas"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Cintura"
              required
            />
            <datalist id="medidas-conhecidas">
              {nomesConhecidos.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          <label>
            Tamanho (cm)
            <input type="number" step="0.1" value={valor} onChange={(e) => setValor(e.target.value)} required />
          </label>
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
        </div>
        <button type="submit">Registrar medida</button>
        <p className="calorie-progress-label">
          Se já existir um registro dessa medida nessa data, ele será atualizado em vez de duplicado.
        </p>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : latest.length === 0 ? (
        <p className="empty-state">Nenhuma medida registrada ainda.</p>
      ) : (
        <>
          <div className="measurement-grid">
            {latest.map((m) => (
              <button
                key={m.nome}
                type="button"
                className={`measurement-card${m.nome === selectedNome ? ' active' : ''}`}
                onClick={() => setSelectedNome(m.nome)}
              >
                <span className="measurement-name">{m.nome}</span>
                <span className="measurement-value">{m.valor_cm}cm</span>
              </button>
            ))}
          </div>

          <MeasurementChart logs={historico} />

          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Medida</th>
                <th>Tamanho</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historico
                .slice()
                .reverse()
                .map((log) => (
                  <tr key={log.id}>
                    <td data-label="Data">{new Date(`${log.data}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                    <td data-label="Medida">{log.nome}</td>
                    <td data-label="Tamanho">{log.valor_cm}cm</td>
                    <td>
                      <button className="link-button" onClick={() => handleDelete(log.id)}>
                        remover
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
