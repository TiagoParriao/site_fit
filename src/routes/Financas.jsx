import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import FinanceHistoryChart from '../components/FinanceHistoryChart'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon, UndoIcon } from '../components/icons'

const FORMAS = [
  { key: 'debito', label: 'Conta (débito/pix/dinheiro)' },
  { key: 'credito', label: 'Cartão de crédito' },
]

function formaLabel(key) {
  return FORMAS.find((f) => f.key === key)?.label ?? key
}

export default function Financas() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [novoTipo, setNovoTipo] = useState('despesa')
  const [novoValor, setNovoValor] = useState('')
  const [novaForma, setNovaForma] = useState('debito')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novaData, setNovaData] = useState(todayISO())
  const [novaCaixinhaId, setNovaCaixinhaId] = useState('')

  const [pockets, setPockets] = useState([])
  const [novaCaixinhaNome, setNovaCaixinhaNome] = useState('')
  const [pocketActionId, setPocketActionId] = useState(null)
  const [pocketActionTipo, setPocketActionTipo] = useState(null)
  const [pocketValor, setPocketValor] = useState('')
  const [pocketRendimento, setPocketRendimento] = useState('')

  const [editingSaldo, setEditingSaldo] = useState(false)
  const [novoSaldo, setNovoSaldo] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editTipo, setEditTipo] = useState('despesa')
  const [editValor, setEditValor] = useState('')
  const [editForma, setEditForma] = useState('debito')
  const [editDescricao, setEditDescricao] = useState('')
  const [editData, setEditData] = useState('')
  const [editCaixinhaId, setEditCaixinhaId] = useState('')

  const [showAllLogs, setShowAllLogs] = useState(false)
  const LOGS_LIMIT = 10

  const load = useCallback(async () => {
    setLoading(true)
    const [logsRes, balanceRes, pocketsRes] = await Promise.all([
      supabase.from('finance_logs').select('*').eq('user_id', user.id).order('data', { ascending: false }),
      supabase.from('finance_balances').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('finance_pockets').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    ])
    setLogs(logsRes.data ?? [])
    setBalance(balanceRes.data ?? null)
    setPockets(pocketsRes.data ?? [])
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const isDespesa = novoTipo === 'despesa'
    const { error } = await supabase.from('finance_logs').insert({
      user_id: user.id,
      tipo: novoTipo,
      valor: Number(novoValor),
      forma_pagamento: isDespesa ? novaForma : null,
      descricao: novaDescricao || null,
      data: novaData,
      caixinha_id: isDespesa && novaCaixinhaId ? novaCaixinhaId : null,
    })
    if (error) {
      setError(error.message)
      return
    }
    setNovoValor('')
    setNovaDescricao('')
    setNovaCaixinhaId('')
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
    setEditForma(log.forma_pagamento || 'debito')
    setEditDescricao(log.descricao || '')
    setEditData(log.data)
    setEditCaixinhaId(log.caixinha_id || '')
  }

  async function handleSaveEdit(id) {
    setError('')
    const isDespesa = editTipo === 'despesa'
    const { error } = await supabase
      .from('finance_logs')
      .update({
        tipo: editTipo,
        valor: Number(editValor),
        forma_pagamento: isDespesa ? editForma : null,
        descricao: editDescricao || null,
        data: editData,
        caixinha_id: isDespesa && editCaixinhaId ? editCaixinhaId : null,
      })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
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

  async function handlePagarFatura() {
    setError('')
    const abertos = logs.filter((l) => l.tipo === 'despesa' && l.forma_pagamento === 'credito' && !l.fatura_paga)
    if (abertos.length === 0) return
    const total = abertos.reduce((sum, l) => sum + Number(l.valor), 0)

    const { data: pagamento, error: insertError } = await supabase
      .from('finance_logs')
      .insert({
        user_id: user.id,
        tipo: 'despesa',
        valor: total,
        forma_pagamento: 'debito',
        descricao: 'Pagamento da fatura do cartão',
        data: todayISO(),
        eh_pagamento_fatura: true,
      })
      .select()
      .single()
    if (insertError) {
      setError(insertError.message)
      return
    }

    const { error: updateError } = await supabase
      .from('finance_logs')
      .update({ fatura_paga: true, pagamento_id: pagamento.id })
      .in('id', abertos.map((l) => l.id))
    if (updateError) {
      setError(updateError.message)
      return
    }
    load()
  }

  async function handleReverterPagamento(pagamentoId) {
    setError('')
    const { error: updateError } = await supabase
      .from('finance_logs')
      .update({ fatura_paga: false, pagamento_id: null })
      .eq('pagamento_id', pagamentoId)
    if (updateError) {
      setError(updateError.message)
      return
    }
    const { error: deleteError } = await supabase.from('finance_logs').delete().eq('id', pagamentoId)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    load()
  }

  async function handleCreatePocket(e) {
    e.preventDefault()
    if (!novaCaixinhaNome.trim()) return
    setError('')
    const { error } = await supabase.from('finance_pockets').insert({ user_id: user.id, nome: novaCaixinhaNome, saldo: 0 })
    if (error) {
      setError(error.message)
      return
    }
    setNovaCaixinhaNome('')
    load()
  }

  function startPocketAction(pocket, tipo) {
    setPocketActionId(pocket.id)
    setPocketActionTipo(tipo)
    setPocketValor('')
    setPocketRendimento('')
    setError('')
  }

  function cancelPocketAction() {
    setPocketActionId(null)
    setPocketActionTipo(null)
    setPocketValor('')
    setPocketRendimento('')
  }

  async function handlePocketDeposit(pocket, e) {
    e.preventDefault()
    setError('')
    const valor = Number(pocketValor)
    if (!(valor > 0)) return
    if (valor > saldoAtual) {
      setError('Esse valor é maior que o saldo em conta disponível.')
      return
    }
    const { error: insertError } = await supabase.from('finance_logs').insert({
      user_id: user.id,
      tipo: 'despesa',
      valor,
      forma_pagamento: 'debito',
      descricao: `Caixinha: ${pocket.nome}`,
      data: todayISO(),
      caixinha_id: pocket.id,
      eh_transferencia_caixinha: true,
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    const { error: updateError } = await supabase
      .from('finance_pockets')
      .update({ saldo: Number(pocket.saldo) + valor })
      .eq('id', pocket.id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    cancelPocketAction()
    load()
  }

  async function handlePocketWithdraw(pocket, e) {
    e.preventDefault()
    setError('')
    const valor = Number(pocketValor)
    const rendimento = pocketRendimento === '' ? 0 : Number(pocketRendimento)
    if (!(valor > 0)) return
    if (valor > Number(pocket.saldo)) {
      setError('Esse valor é maior que o saldo guardado nessa caixinha.')
      return
    }
    const total = valor + rendimento
    const descricaoRendimento = rendimento > 0 ? ` (+ R$ ${rendimento.toFixed(2)} de rendimento)` : ''
    const { error: insertError } = await supabase.from('finance_logs').insert({
      user_id: user.id,
      tipo: 'receita',
      valor: total,
      descricao: `Caixinha: ${pocket.nome}${descricaoRendimento}`,
      data: todayISO(),
      caixinha_id: pocket.id,
      eh_transferencia_caixinha: true,
      rendimento_caixinha: rendimento > 0 ? rendimento : null,
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    const { error: updateError } = await supabase
      .from('finance_pockets')
      .update({ saldo: Number(pocket.saldo) - valor })
      .eq('id', pocket.id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    cancelPocketAction()
    load()
  }

  async function handleDeletePocket(pocket) {
    if (Number(pocket.saldo) !== 0) {
      setError('Só dá pra excluir uma caixinha vazia. Retire o saldo antes.')
      return
    }
    setError('')
    await supabase.from('finance_pockets').delete().eq('id', pocket.id)
    load()
  }

  const hoje = todayISO()
  const saldoInicial = balance?.valor ?? 0

  const entradas = useMemo(() => logs.filter((l) => l.tipo === 'receita'), [logs])
  const saidasConta = useMemo(
    () => logs.filter((l) => l.tipo === 'despesa' && l.forma_pagamento !== 'credito'),
    [logs]
  )
  const saidasCartao = useMemo(
    () => logs.filter((l) => l.tipo === 'despesa' && l.forma_pagamento === 'credito'),
    [logs]
  )

  const saldoAtual = useMemo(() => {
    const entrou = entradas.filter((l) => l.data <= hoje).reduce((sum, l) => sum + Number(l.valor), 0)
    const saiu = saidasConta.filter((l) => l.data <= hoje).reduce((sum, l) => sum + Number(l.valor), 0)
    return saldoInicial + entrou - saiu
  }, [entradas, saidasConta, saldoInicial, hoje])

  const itensFaturaAberta = useMemo(
    () => saidasCartao.filter((l) => !l.fatura_paga).sort((a, b) => (a.data < b.data ? 1 : -1)),
    [saidasCartao]
  )
  const faturaAberta = useMemo(() => itensFaturaAberta.reduce((sum, l) => sum + Number(l.valor), 0), [itensFaturaAberta])
  const saldoDepoisDaFatura = saldoAtual - faturaAberta

  const ultimoPagamento = useMemo(() => {
    const pagamentos = logs
      .filter((l) => l.eh_pagamento_fatura)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
    return pagamentos[0] ?? null
  }, [logs])

  const logsConta = useMemo(
    () =>
      [...entradas, ...saidasConta]
        .filter((l) => l.data <= hoje)
        .sort((a, b) => (a.data < b.data ? -1 : 1)),
    [entradas, saidasConta, hoje]
  )

  const logsFuturos = useMemo(
    () => logs.filter((l) => l.data > hoje).sort((a, b) => (a.data < b.data ? -1 : 1)),
    [logs, hoje]
  )
  const logsPassados = useMemo(
    () => logs.filter((l) => l.data <= hoje).sort((a, b) => (a.data < b.data ? 1 : -1)),
    [logs, hoje]
  )
  const totalAVencer = useMemo(
    () => logsFuturos.reduce((sum, l) => sum + Number(l.valor), 0) + faturaAberta,
    [logsFuturos, faturaAberta]
  )

  const pocketById = useMemo(() => Object.fromEntries(pockets.map((p) => [p.id, p])), [pockets])

  // Se tudo que ainda não caiu (entradas e saídas futuras na conta) caísse hoje, e a fatura
  // em aberto fosse paga junto — sem limite de mês, pra dar pra planejar vários meses à frente.
  // Saídas futuras vinculadas a uma caixinha ficam de fora: esse dinheiro já saiu do saldo
  // quando foi guardado lá, contar de novo aqui seria descontar duas vezes.
  const projecao = useMemo(() => {
    const entrou = entradas.filter((l) => l.data > hoje).reduce((sum, l) => sum + Number(l.valor), 0)
    const saiu = saidasConta
      .filter((l) => l.data > hoje && !l.caixinha_id)
      .reduce((sum, l) => sum + Number(l.valor), 0)
    return saldoAtual + entrou - saiu - faturaAberta
  }, [entradas, saidasConta, saldoAtual, faturaAberta, hoje])

  function renderRow(log) {
    if (editingId === log.id) {
      return (
        <tr key={log.id}>
          <td colSpan={5}>
            <div className="inline-edit-row">
              <label>
                Data
                <input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} required />
              </label>
              <label>
                Tipo
                <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)}>
                  <option value="receita">Entrada</option>
                  <option value="despesa">Saída</option>
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
                <label>
                  Forma
                  <select value={editForma} onChange={(e) => setEditForma(e.target.value)}>
                    {FORMAS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Descrição (opcional)
                <input value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
              </label>
              {editTipo === 'despesa' && pockets.length > 0 && (
                <label>
                  Reservado numa caixinha? (opcional)
                  <select value={editCaixinhaId} onChange={(e) => setEditCaixinhaId(e.target.value)}>
                    <option value="">Nenhuma</option>
                    {pockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button type="button" onClick={() => handleSaveEdit(log.id)}>
                Salvar
              </button>
              <button type="button" className="link-button" onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </div>
          </td>
        </tr>
      )
    }
    return (
      <tr key={log.id}>
        <td data-label="Data">{new Date(`${log.data}T00:00:00`).toLocaleDateString('pt-BR')}</td>
        <td data-label="Tipo">{log.tipo === 'receita' ? 'Entrada' : 'Saída'}</td>
        <td data-label="Descrição">
          {log.descricao || log.categoria || '-'}
          <span className="finance-tags">
            {log.tipo === 'despesa' && (
              <>
                <span className="finance-tag">{formaLabel(log.forma_pagamento || 'debito')}</span>
                {log.forma_pagamento === 'credito' && (
                  <span className={`finance-tag${log.fatura_paga ? '' : ' finance-tag-agendado'}`}>
                    {log.fatura_paga ? 'paga' : 'em aberto'}
                  </span>
                )}
              </>
            )}
            {log.eh_transferencia_caixinha && <span className="finance-tag finance-tag-caixinha">caixinha</span>}
            {!log.eh_transferencia_caixinha && log.caixinha_id && pocketById[log.caixinha_id] && (
              <span className="finance-tag finance-tag-caixinha">coberta: {pocketById[log.caixinha_id].nome}</span>
            )}
          </span>
        </td>
        <td data-label="Valor" className={log.tipo === 'receita' ? 'finance-positive' : 'finance-negative'}>
          {log.tipo === 'receita' ? '+' : '-'}R$ {Number(log.valor).toFixed(2)}
        </td>
        <td>
          <span className="row-actions">
            {log.eh_pagamento_fatura ? (
              <button
                className="icon-button"
                title="reverter pagamento da fatura"
                onClick={() => handleReverterPagamento(log.id)}
              >
                <UndoIcon />
              </button>
            ) : log.eh_transferencia_caixinha ? null : (
              <>
                <button className="icon-button" title="editar" onClick={() => startEdit(log)}>
                  <PencilIcon />
                </button>
                <button className="icon-button" title="remover" onClick={() => handleDelete(log.id)}>
                  <TrashIcon />
                </button>
              </>
            )}
          </span>
        </td>
      </tr>
    )
  }

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <header className="route-header">
        <span>Só você vê</span>
        <h1>Finanças</h1>
        <p>Clareza para decidir, privacidade por padrão.</p>
      </header>
      <div className="finance-privacy-strip-real"><strong>✓ Seus dados financeiros são privados.</strong><span>Nenhum membro do grupo consegue acessá-los.</span></div>
      {error && <p className="error">{error}</p>}

      <div className="finance-summary-hero-real">
        <div className="card finance-quick-card finance-quick-balance"><span>Saldo em conta</span><strong>R$ {saldoAtual.toFixed(2)}</strong><p>Movimentos em débito, Pix e dinheiro.</p></div>
        <div className="card finance-quick-card finance-quick-invoice"><span>Cartão de crédito</span><strong>R$ {faturaAberta.toFixed(2)}</strong><p>{itensFaturaAberta.length} {itensFaturaAberta.length === 1 ? 'item' : 'itens'} em aberto.</p></div>
        <div className="card finance-quick-card finance-quick-future"><span>A vencer</span><strong>R$ {totalAVencer.toFixed(2)}</strong><p>Projeção final: R$ {projecao.toFixed(2)}.</p></div>
      </div>

      <div className="finance-content-grid-real">
      <div className="card finance-detail-card">
        <h2>Saldo em conta</h2>
        <p className="empty-state">
          Só conta o que entra e o que sai direto da conta (débito/pix/dinheiro). Compras no cartão não mexem aqui até
          você pagar a fatura.
        </p>
        <div className="finance-summary-grid">
          <div>
            <span className="finance-summary-label">Saldo atual</span>
            <span className="finance-summary-value">R$ {saldoAtual.toFixed(2)}</span>
          </div>
        </div>

        <FinanceHistoryChart logs={logsConta} saldoInicial={saldoInicial} />

        {editingSaldo ? (
          <form onSubmit={handleSetSaldo} className="form-actions">
            <label>
              Saldo inicial (R$, antes de começar a usar isso aqui)
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
              setNovoSaldo(String(saldoInicial))
              setEditingSaldo(true)
            }}
          >
            {balance ? 'Editar saldo inicial' : 'Definir saldo inicial'}
          </button>
        )}
      </div>

      <div className="card finance-detail-card invoice-detail-card">
        <h2>Cartão de crédito</h2>
        <p className="finance-invoice-total">R$ {faturaAberta.toFixed(2)}</p>
        <p className="empty-state">em compras no cartão que ainda não foram pagas.</p>
        {faturaAberta > 0 && (
          <p className="finance-invoice-note">
            Se você pagar a fatura hoje, seu saldo em conta fica em{' '}
            <strong className={saldoDepoisDaFatura < 0 ? 'finance-negative' : 'finance-positive'}>
              R$ {saldoDepoisDaFatura.toFixed(2)}
            </strong>
            .
          </p>
        )}

        {itensFaturaAberta.length > 0 && (
          <ul className="finance-invoice-list">
            {itensFaturaAberta.map((l) => (
              <li key={l.id}>
                <span>
                  {new Date(`${l.data}T00:00:00`).toLocaleDateString('pt-BR')} — {l.descricao || l.categoria || 'sem descrição'}
                </span>
                <span>R$ {Number(l.valor).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}

        {faturaAberta > 0 && (
          <button type="button" onClick={handlePagarFatura}>
            Pagar fatura agora
          </button>
        )}

        {ultimoPagamento && (
          <p className="finance-invoice-note">
            Último pagamento: R$ {Number(ultimoPagamento.valor).toFixed(2)} em{' '}
            {new Date(`${ultimoPagamento.data}T00:00:00`).toLocaleDateString('pt-BR')}.{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => handleReverterPagamento(ultimoPagamento.id)}
            >
              Reverter pagamento
            </button>
          </p>
        )}
      </div>
      </div>

      <div className="card finance-future-card">
        <h2>A vencer</h2>
        <p className="empty-state">
          Lançamentos com data futura — o que ainda não caiu na conta — somados à fatura do cartão já em aberto. Sem
          limite de mês: lance quantos meses à frente quiser pra se planejar. Saídas marcadas como "coberta" por uma
          caixinha não entram na projeção abaixo, porque esse dinheiro já saiu do saldo quando foi guardado lá.
        </p>
        <p className="finance-invoice-note">
          Se tudo isso cair hoje, seu saldo em conta fica em{' '}
          <strong className={projecao < 0 ? 'finance-negative' : 'finance-positive'}>R$ {projecao.toFixed(2)}</strong>.
        </p>

        {logsFuturos.length === 0 ? (
          <p className="empty-state">Nada agendado pra frente.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{logsFuturos.map(renderRow)}</tbody>
          </table>
        )}
      </div>

      <div className="card finance-pockets-card">
        <div className="card-heading-real">
          <div>
            <span className="section-kicker">Guardado à parte</span>
            <h2>Caixinhas</h2>
            <p>Reserve dinheiro do saldo em conta pra um objetivo, igual as caixinhas do banco.</p>
          </div>
        </div>

        {pockets.length === 0 ? (
          <p className="empty-state">Nenhuma caixinha ainda.</p>
        ) : (
          <ul className="pocket-list">
            {pockets.map((p) => (
              <li key={p.id} className="pocket-item">
                <div className="pocket-item-head">
                  <span className="pocket-item-nome">{p.nome}</span>
                  <span className="pocket-item-saldo">R$ {Number(p.saldo).toFixed(2)}</span>
                </div>

                {pocketActionId === p.id ? (
                  <form
                    className="form-actions"
                    onSubmit={(e) => (pocketActionTipo === 'deposito' ? handlePocketDeposit(p, e) : handlePocketWithdraw(p, e))}
                  >
                    <label>
                      {pocketActionTipo === 'deposito' ? 'Valor a guardar (R$)' : 'Valor a retirar (R$)'}
                      <input
                        type="number"
                        step="0.01"
                        value={pocketValor}
                        onChange={(e) => setPocketValor(e.target.value)}
                        required
                      />
                    </label>
                    {pocketActionTipo === 'saque' && (
                      <label>
                        Rendimento (R$, opcional)
                        <input
                          type="number"
                          step="0.01"
                          value={pocketRendimento}
                          onChange={(e) => setPocketRendimento(e.target.value)}
                          placeholder="Ex: 0,07"
                        />
                      </label>
                    )}
                    <button type="submit">{pocketActionTipo === 'deposito' ? 'Guardar' : 'Retirar'}</button>
                    <button type="button" className="link-button" onClick={cancelPocketAction}>
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <div className="pocket-item-actions">
                    <button type="button" className="link-button" onClick={() => startPocketAction(p, 'deposito')}>
                      Guardar
                    </button>
                    <button type="button" className="link-button" onClick={() => startPocketAction(p, 'saque')}>
                      Retirar
                    </button>
                    {Number(p.saldo) === 0 && (
                      <button type="button" className="link-button" onClick={() => handleDeletePocket(p)}>
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <form className="form-actions" onSubmit={handleCreatePocket}>
          <label>
            Nova caixinha
            <input
              value={novaCaixinhaNome}
              onChange={(e) => setNovaCaixinhaNome(e.target.value)}
              placeholder="Ex: Viagem, IPVA..."
              required
            />
          </label>
          <button type="submit">Criar</button>
        </form>
      </div>

      <form className="card finance-register-card" onSubmit={handleAdd}>
        <div className="card-heading-real"><div><span className="section-kicker">Novo movimento</span><h2>Registrar</h2><p>Adicione uma entrada ou saída.</p></div></div>
        <div className="grid-2">
          <label>
            Tipo
            <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}>
              <option value="receita">Entrada</option>
              <option value="despesa">Saída</option>
            </select>
          </label>
          <label>
            Valor (R$)
            <input type="number" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} required />
          </label>
        </div>
        <div className="grid-2">
          <label>
            Data
            <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} required />
          </label>
          {novoTipo === 'despesa' && (
            <label>
              Forma
              <select value={novaForma} onChange={(e) => setNovaForma(e.target.value)}>
                {FORMAS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label>
          Descrição (opcional)
          <input value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} placeholder="Ex: mercado" />
        </label>
        {novoTipo === 'despesa' && pockets.length > 0 && (
          <label>
            Reservado numa caixinha? (opcional)
            <select value={novaCaixinhaId} onChange={(e) => setNovaCaixinhaId(e.target.value)}>
              <option value="">Nenhuma</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit">Adicionar</button>
      </form>

      <div className="card finance-history-card-real">
        <div className="card-heading-real"><div><span className="section-kicker">Histórico completo</span><h2>Lançamentos</h2><p>Todos os movimentos da sua conta.</p></div></div>
        {logsPassados.length === 0 ? (
          <p className="empty-state">Nada registrado ainda.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>{(showAllLogs ? logsPassados : logsPassados.slice(0, LOGS_LIMIT)).map(renderRow)}</tbody>
            </table>
            {logsPassados.length > LOGS_LIMIT && (
              <button type="button" className="link-button" onClick={() => setShowAllLogs((v) => !v)}>
                {showAllLogs ? 'Mostrar menos' : `Ver todos (${logsPassados.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
