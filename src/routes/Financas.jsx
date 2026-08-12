import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import FinanceHistoryChart from '../components/FinanceHistoryChart'
import FinanceProgressBar from '../components/FinanceProgressBar'
import {
  DESPESA_CATEGORIES,
  FORMAS_PAGAMENTO,
  CLASSES_GASTO,
  categoriesForTipo,
  categoryLabel,
  defaultClasseForCategoria,
  formaPagamentoLabel,
  classeLabel,
} from '../lib/financeCategories'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon } from '../components/icons'

function firstDayOfMonthISO(dataISO) {
  return `${dataISO.slice(0, 7)}-01`
}

function daysInMonth(mesAnoISO) {
  const [y, m] = mesAnoISO.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export default function Financas() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [goal, setGoal] = useState(null)
  const [balance, setBalance] = useState(null)
  const [income, setIncome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [novoTipo, setNovoTipo] = useState('despesa')
  const [novoValor, setNovoValor] = useState('')
  const [novaCategoria, setNovaCategoria] = useState(DESPESA_CATEGORIES[0].key)
  const [novaFormaPagamento, setNovaFormaPagamento] = useState('debito')
  const [novaClasse, setNovaClasse] = useState(DESPESA_CATEGORIES[0].classe)
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novaData, setNovaData] = useState(todayISO())

  const [editingMeta, setEditingMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState('')

  const [editingSaldo, setEditingSaldo] = useState(false)
  const [novoSaldo, setNovoSaldo] = useState('')

  const [editingIncome, setEditingIncome] = useState(false)
  const [novoSalario, setNovoSalario] = useState('')
  const [novaMetaDiaria, setNovaMetaDiaria] = useState('')

  const [filtroPagamento, setFiltroPagamento] = useState('todos')

  const [editingId, setEditingId] = useState(null)
  const [editTipo, setEditTipo] = useState('despesa')
  const [editValor, setEditValor] = useState('')
  const [editCategoria, setEditCategoria] = useState('')
  const [editFormaPagamento, setEditFormaPagamento] = useState('debito')
  const [editClasse, setEditClasse] = useState('diario')
  const [editDescricao, setEditDescricao] = useState('')
  const [editData, setEditData] = useState('')

  const mesAtual = firstDayOfMonthISO(todayISO())

  const load = useCallback(async () => {
    setLoading(true)
    const [logsRes, goalRes, balanceRes, incomeRes] = await Promise.all([
      supabase.from('finance_logs').select('*').eq('user_id', user.id).order('data', { ascending: false }),
      supabase.from('finance_goals').select('*').eq('user_id', user.id).eq('mes_ano', mesAtual).maybeSingle(),
      supabase.from('finance_balances').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('finance_income').select('*').eq('user_id', user.id).eq('mes_ano', mesAtual).maybeSingle(),
    ])
    if (logsRes.data) setLogs(logsRes.data)
    if (goalRes.data) setGoal(goalRes.data)
    if (balanceRes.data) setBalance(balanceRes.data)
    if (incomeRes.data) setIncome(incomeRes.data)
    setLoading(false)
  }, [user.id, mesAtual])

  useEffect(() => {
    load()
  }, [load])

  function handleTipoChange(tipo, setCategoria, setClasse) {
    const primeiraCategoria = categoriesForTipo(tipo)[0]
    setCategoria(primeiraCategoria.key)
    if (setClasse) setClasse(primeiraCategoria.classe ?? 'diario')
    return tipo
  }

  function handleCategoriaChange(categoria, setCategoria, setClasse) {
    setCategoria(categoria)
    setClasse(defaultClasseForCategoria(categoria))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const isDespesa = novoTipo === 'despesa'
    const { error } = await supabase.from('finance_logs').insert({
      user_id: user.id,
      tipo: novoTipo,
      valor: Number(novoValor),
      categoria: novaCategoria,
      forma_pagamento: isDespesa ? novaFormaPagamento : null,
      classe: isDespesa ? novaClasse : null,
      descricao: novaDescricao || null,
      data: novaData,
    })
    if (error) {
      setError(error.message)
      return
    }
    setNovoValor('')
    setNovaDescricao('')
    load()
  }

  async function handleDelete(id) {
    await supabase.from('finance_logs').delete().eq('id', id)
    load()
  }

  function startEdit(log) {
    setEditingId(log.id)
    setEditTipo(log.tipo)
    setEditValor(String(log.valor))
    setEditCategoria(log.categoria)
    setEditFormaPagamento(log.forma_pagamento || 'debito')
    setEditClasse(log.classe || defaultClasseForCategoria(log.categoria))
    setEditDescricao(log.descricao || '')
    setEditData(log.data)
  }

  async function handleSaveEdit(id) {
    setError('')
    const isDespesa = editTipo === 'despesa'
    const { error } = await supabase
      .from('finance_logs')
      .update({
        tipo: editTipo,
        valor: Number(editValor),
        categoria: editCategoria,
        forma_pagamento: isDespesa ? editFormaPagamento : null,
        classe: isDespesa ? editClasse : null,
        descricao: editDescricao || null,
        data: editData,
      })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
  }

  async function handleSetGoal(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase
      .from('finance_goals')
      .upsert({ user_id: user.id, mes_ano: mesAtual, valor_meta: Number(novaMeta) }, { onConflict: 'user_id,mes_ano' })
    if (error) {
      setError(error.message)
      return
    }
    setEditingMeta(false)
    load()
  }

  async function handleSetSaldo(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase
      .from('finance_balances')
      .upsert({ user_id: user.id, valor: Number(novoSaldo), data: todayISO() }, { onConflict: 'user_id' })
    if (error) {
      setError(error.message)
      return
    }
    setEditingSaldo(false)
    load()
  }

  async function handleSetIncome(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('finance_income').upsert(
      {
        user_id: user.id,
        mes_ano: mesAtual,
        salario: novoSalario === '' ? null : Number(novoSalario),
        meta_diaria: novaMetaDiaria === '' ? null : Number(novaMetaDiaria),
      },
      { onConflict: 'user_id,mes_ano' }
    )
    if (error) {
      setError(error.message)
      return
    }
    setEditingIncome(false)
    load()
  }

  const despesasMes = useMemo(
    () => logs.filter((l) => l.tipo === 'despesa' && l.data.slice(0, 7) === mesAtual.slice(0, 7)),
    [logs, mesAtual]
  )

  const gastoMes = useMemo(() => despesasMes.reduce((sum, l) => sum + Number(l.valor), 0), [despesasMes])

  const gastoPorCategoria = useMemo(() => {
    const totals = {}
    despesasMes.forEach((l) => {
      totals[l.categoria] = (totals[l.categoria] || 0) + Number(l.valor)
    })
    return Object.entries(totals)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
  }, [despesasMes])

  const saidasFixas = useMemo(
    () => despesasMes.filter((l) => l.classe === 'fixa').reduce((sum, l) => sum + Number(l.valor), 0),
    [despesasMes]
  )

  const gastoHojeDiario = useMemo(
    () =>
      despesasMes
        .filter((l) => l.classe === 'diario' && l.data === todayISO())
        .reduce((sum, l) => sum + Number(l.valor), 0),
    [despesasMes]
  )

  const salario = Number(income?.salario ?? 0)
  const saldoParaDiario = salario - saidasFixas
  const limiteDiarioMaximo = useMemo(() => {
    const dias = daysInMonth(mesAtual)
    return dias > 0 ? saldoParaDiario / dias : 0
  }, [saldoParaDiario, mesAtual])
  const metaDiariaEfetiva = income?.meta_diaria != null ? Number(income.meta_diaria) : limiteDiarioMaximo

  const faturaAtual = useMemo(
    () => despesasMes.filter((l) => l.forma_pagamento === 'credito').reduce((sum, l) => sum + Number(l.valor), 0),
    [despesasMes]
  )
  const sobraPrevista = salario - saidasFixas - faturaAtual

  const statusFatura = useMemo(() => {
    if (!income?.salario) return 'sem-dados'
    const margem = saldoParaDiario > 0 ? sobraPrevista / saldoParaDiario : sobraPrevista >= 0 ? 1 : -1
    if (sobraPrevista < 0) return 'vermelho'
    if (margem < 0.15) return 'amarelo'
    return 'verde'
  }, [income, sobraPrevista, saldoParaDiario])

  const filteredLogs = useMemo(
    () => (filtroPagamento === 'todos' ? logs : logs.filter((l) => l.forma_pagamento === filtroPagamento)),
    [logs, filtroPagamento]
  )

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <h1>Finanças</h1>
      <p className="empty-state">Seus lançamentos aqui são privados: ninguém do grupo pode ver.</p>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Limite diário</h2>
        <p className="empty-state">
          Salário menos saídas fixas, dividido pelos dias do mês — o teto pra gastar no dia a dia sem alimentar o cartão.
        </p>
        <div className="finance-limit-grid">
          <div>
            <span className="finance-limit-label">Salário do mês</span>
            <span className="finance-limit-value">R$ {salario.toFixed(2)}</span>
          </div>
          <div>
            <span className="finance-limit-label">Saídas fixas (automático)</span>
            <span className="finance-limit-value">R$ {saidasFixas.toFixed(2)}</span>
          </div>
          <div>
            <span className="finance-limit-label">Limite diário máximo</span>
            <span className="finance-limit-value">R$ {limiteDiarioMaximo.toFixed(2)}</span>
          </div>
          <div>
            <span className="finance-limit-label">Sua meta de teto diário</span>
            <span className="finance-limit-value">R$ {metaDiariaEfetiva.toFixed(2)}</span>
          </div>
        </div>

        {editingIncome ? (
          <form onSubmit={handleSetIncome} className="form-actions">
            <label>
              Salário / renda líquida do mês (R$)
              <input type="number" step="0.01" value={novoSalario} onChange={(e) => setNovoSalario(e.target.value)} />
            </label>
            <label>
              Meta de teto diário reduzido (R$, opcional)
              <input
                type="number"
                step="0.01"
                value={novaMetaDiaria}
                onChange={(e) => setNovaMetaDiaria(e.target.value)}
                placeholder={`Ex: ${(limiteDiarioMaximo / 2).toFixed(2)}`}
              />
            </label>
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={() => setEditingIncome(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <button
            className="link-button"
            onClick={() => {
              setNovoSalario(income?.salario != null ? String(income.salario) : '')
              setNovaMetaDiaria(income?.meta_diaria != null ? String(income.meta_diaria) : '')
              setEditingIncome(true)
            }}
          >
            {income ? 'Editar salário e meta diária' : 'Definir salário e meta diária'}
          </button>
        )}

        <h3>Gasto de hoje no diário</h3>
        <FinanceProgressBar gasto={gastoHojeDiario} meta={metaDiariaEfetiva} />
      </div>

      <div className="card">
        <h2>Termômetro da fatura</h2>
        {!income?.salario ? (
          <p className="empty-state">Defina seu salário no card acima pra ver a projeção da fatura.</p>
        ) : (
          <>
            <div className="finance-limit-grid">
              <div>
                <span className="finance-limit-label">Fatura acumulada no mês (crédito)</span>
                <span className="finance-limit-value">R$ {faturaAtual.toFixed(2)}</span>
              </div>
              <div>
                <span className="finance-limit-label">Sobra prevista no débito</span>
                <span className="finance-limit-value">R$ {sobraPrevista.toFixed(2)}</span>
              </div>
            </div>
            <p className={`finance-status-badge finance-status-${statusFatura}`}>
              {statusFatura === 'verde' &&
                `A fatura do mês que vem virá menor! Deve sobrar R$ ${sobraPrevista.toFixed(2)} livres no débito.`}
              {statusFatura === 'amarelo' &&
                `Atenção: a folga está apertada, só R$ ${sobraPrevista.toFixed(2)} de sobra prevista.`}
              {statusFatura === 'vermelho' &&
                `Alerta: a fatura já consome tudo (e falta R$ ${Math.abs(sobraPrevista).toFixed(2)}). Você continua preso no cartão.`}
            </p>
          </>
        )}
      </div>

      <div className="card">
        <h2>Histórico</h2>
        <FinanceHistoryChart logs={logs} saldoInicial={balance?.valor ?? 0} />
        {editingSaldo ? (
          <form onSubmit={handleSetSaldo} className="form-actions">
            <label>
              Saldo inicial (R$)
              <input type="number" step="0.01" value={novoSaldo} onChange={(e) => setNovoSaldo(e.target.value)} required />
            </label>
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={() => setEditingSaldo(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <button
            className="link-button"
            onClick={() => {
              setNovoSaldo(String(balance?.valor ?? 0))
              setEditingSaldo(true)
            }}
          >
            {balance ? 'Editar saldo inicial' : 'Definir saldo inicial'}
          </button>
        )}
      </div>

      <div className="card">
        <h2>Meta do mês</h2>
        {goal ? (
          <FinanceProgressBar gasto={gastoMes} meta={Number(goal.valor_meta)} />
        ) : (
          <p className="empty-state">Nenhuma meta definida para este mês.</p>
        )}
        {editingMeta ? (
          <form onSubmit={handleSetGoal} className="form-actions">
            <label>
              Meta de gasto do mês (R$)
              <input type="number" step="0.01" value={novaMeta} onChange={(e) => setNovaMeta(e.target.value)} required />
            </label>
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={() => setEditingMeta(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <button
            className="link-button"
            onClick={() => {
              setNovaMeta(String(goal?.valor_meta ?? ''))
              setEditingMeta(true)
            }}
          >
            {goal ? 'Editar meta' : 'Definir meta'}
          </button>
        )}

        {gastoPorCategoria.length > 0 && (
          <>
            <h3>Gasto por categoria no mês</h3>
            <ul className="finance-category-breakdown">
              {gastoPorCategoria.map((c) => (
                <li key={c.categoria}>
                  <span>{categoryLabel('despesa', c.categoria)}</span>
                  <span>R$ {c.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <form className="card" onSubmit={handleAdd}>
        <h2>Registrar</h2>
        <div className="grid-2">
          <label>
            Tipo
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(handleTipoChange(e.target.value, setNovaCategoria, setNovaClasse))}
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </label>
          <label>
            Valor (R$)
            <input type="number" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} required />
          </label>
        </div>
        <div className="grid-2">
          <label>
            Categoria
            <select
              value={novaCategoria}
              onChange={(e) => handleCategoriaChange(e.target.value, setNovaCategoria, setNovaClasse)}
            >
              {categoriesForTipo(novoTipo).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data
            <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} required />
          </label>
        </div>
        {novoTipo === 'despesa' && (
          <div className="grid-2">
            <label>
              Meio de pagamento
              <select value={novaFormaPagamento} onChange={(e) => setNovaFormaPagamento(e.target.value)}>
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Classe
              <select value={novaClasse} onChange={(e) => setNovaClasse(e.target.value)}>
                {CLASSES_GASTO.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label>
          Descrição (opcional)
          <input value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} placeholder="Ex: mercado do mês" />
        </label>
        <button type="submit">Adicionar</button>
      </form>

      <div className="card">
        <h2>Registros</h2>
        <div className="period-selector-tabs">
          <button
            type="button"
            className={`period-tab${filtroPagamento === 'todos' ? ' active' : ''}`}
            onClick={() => setFiltroPagamento('todos')}
          >
            Todos
          </button>
          {FORMAS_PAGAMENTO.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`period-tab${filtroPagamento === f.key ? ' active' : ''}`}
              onClick={() => setFiltroPagamento(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filteredLogs.length === 0 ? (
          <p className="empty-state">Nada registrado ainda.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Descrição</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) =>
                editingId === log.id ? (
                  <tr key={log.id}>
                    <td colSpan={6}>
                      <div className="inline-edit-row">
                        <label>
                          Data
                          <input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} required />
                        </label>
                        <label>
                          Tipo
                          <select
                            value={editTipo}
                            onChange={(e) => setEditTipo(handleTipoChange(e.target.value, setEditCategoria, setEditClasse))}
                          >
                            <option value="receita">Receita</option>
                            <option value="despesa">Despesa</option>
                          </select>
                        </label>
                        <label>
                          Categoria
                          <select
                            value={editCategoria}
                            onChange={(e) => handleCategoriaChange(e.target.value, setEditCategoria, setEditClasse)}
                          >
                            {categoriesForTipo(editTipo).map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Valor (R$)
                          <input
                            type="number"
                            step="0.01"
                            value={editValor}
                            onChange={(e) => setEditValor(e.target.value)}
                            required
                          />
                        </label>
                        {editTipo === 'despesa' && (
                          <>
                            <label>
                              Meio de pagamento
                              <select value={editFormaPagamento} onChange={(e) => setEditFormaPagamento(e.target.value)}>
                                {FORMAS_PAGAMENTO.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Classe
                              <select value={editClasse} onChange={(e) => setEditClasse(e.target.value)}>
                                {CLASSES_GASTO.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </>
                        )}
                        <label>
                          Descrição (opcional)
                          <input value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
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
                    <td data-label="Tipo">{log.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
                    <td data-label="Categoria">
                      {categoryLabel(log.tipo, log.categoria)}
                      {log.tipo === 'despesa' && (
                        <span className="finance-tags">
                          <span className="finance-tag">{formaPagamentoLabel(log.forma_pagamento)}</span>
                          <span className="finance-tag">{classeLabel(log.classe)}</span>
                        </span>
                      )}
                    </td>
                    <td data-label="Valor" className={log.tipo === 'receita' ? 'finance-positive' : 'finance-negative'}>
                      {log.tipo === 'receita' ? '+' : '-'}R$ {Number(log.valor).toFixed(2)}
                    </td>
                    <td data-label="Descrição">{log.descricao || '-'}</td>
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
        )}
      </div>
    </div>
  )
}
