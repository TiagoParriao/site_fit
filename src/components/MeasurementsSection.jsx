import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fetchMeasurements, latestByName, historyForName } from '../lib/measurements'
import MeasurementChart from './MeasurementChart'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon } from './icons'

export default function MeasurementsSection() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  const [selectedNome, setSelectedNome] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editValor, setEditValor] = useState('')
  const [editData, setEditData] = useState('')

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

  // Com uma medida já selecionada (card ativo), o campo de nome vem pré-preenchido —
  // só falta digitar o valor novo. Digitar outro nome ainda funciona normalmente.
  useEffect(() => {
    setNome(selectedNome)
  }, [selectedNome])

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
    setValor('')
    setData(todayISO())
    load()
  }

  async function handleDelete(id) {
    await supabase.from('measurement_logs').delete().eq('id', id)
    load()
  }

  function startEdit(log) {
    setEditingId(log.id)
    setEditValor(String(log.valor_cm))
    setEditData(log.data)
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('measurement_logs')
      .update({ valor_cm: Number(editValor), data: editData })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
  }

  return (
    <div className="card measurements-card-real">
      <div className="card-heading-real"><div><span className="section-kicker">Além da balança</span><h2>Medidas corporais</h2><p>Acompanhe cada parte da sua evolução.</p></div></div>
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
                .map((log) =>
                  editingId === log.id ? (
                    <tr key={log.id}>
                      <td colSpan={4}>
                        <div className="inline-edit-row">
                          <label>
                            Data
                            <input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} required />
                          </label>
                          <label>
                            Tamanho (cm)
                            <input
                              type="number"
                              step="0.1"
                              value={editValor}
                              onChange={(e) => setEditValor(e.target.value)}
                              required
                            />
                          </label>
                          <button type="button" onClick={() => handleSaveEdit(log.id)}>
                            Salvar
                          </button>
                          <button type="button" className="link-button" onClick={() => setEditingId(null)}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={log.id}>
                      <td data-label="Data">{new Date(`${log.data}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                      <td data-label="Medida">{log.nome}</td>
                      <td data-label="Tamanho">{log.valor_cm}cm</td>
                      <td>
                        <span className="row-actions">
                          <button className="icon-button" title="editar" onClick={() => startEdit(log)}>
                            <PencilIcon />
                          </button>
                          <button className="icon-button" title="remover" onClick={() => handleDelete(log.id)}>
                            <TrashIcon />
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
