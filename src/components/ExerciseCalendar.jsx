import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fetchExerciseHistory } from '../lib/exerciseHistory'
import { todayISO } from '../lib/dates'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function firstWeekday(year, monthIndex) {
  return new Date(year, monthIndex, 1).getDay()
}

export default function ExerciseCalendar({ subcategorias, refreshKey }) {
  const { user } = useAuth()
  const hoje = todayISO()
  const [year, setYear] = useState(Number(hoje.slice(0, 4)))
  const [monthIndex, setMonthIndex] = useState(Number(hoje.slice(5, 7)) - 1)
  const [minutosPorDia, setMinutosPorDia] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const mesISO = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
    const result = await fetchExerciseHistory(supabase, user.id, 'mes', { date: mesISO }, subcategorias)
    const porDia = {}
    for (const d of result.days) porDia[d.data] = d.minutos
    setMinutosPorDia(porDia)
    setLoading(false)
  }, [user.id, year, monthIndex, subcategorias, refreshKey])

  useEffect(() => {
    load()
  }, [load])

  function irParaMesAnterior() {
    if (monthIndex === 0) {
      setYear((y) => y - 1)
      setMonthIndex(11)
    } else {
      setMonthIndex((m) => m - 1)
    }
  }

  function irParaProximoMes() {
    if (monthIndex === 11) {
      setYear((y) => y + 1)
      setMonthIndex(0)
    } else {
      setMonthIndex((m) => m + 1)
    }
  }

  function irParaHoje() {
    setYear(Number(hoje.slice(0, 4)))
    setMonthIndex(Number(hoje.slice(5, 7)) - 1)
  }

  const total = daysInMonth(year, monthIndex)
  const offset = firstWeekday(year, monthIndex)
  const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const diasComExercicio = Object.keys(minutosPorDia).filter((d) => d.slice(0, 7) === `${year}-${String(monthIndex + 1).padStart(2, '0')}`).length

  return (
    <div className="exercise-calendar">
      <div className="exercise-calendar-head">
        <button type="button" className="link-button" onClick={irParaHoje}>
          Hoje
        </button>
        <div className="exercise-calendar-nav">
          <button type="button" className="icon-button" onClick={irParaMesAnterior} title="Mês anterior">
            ‹
          </button>
          <strong>
            {MESES[monthIndex]} {year}
          </strong>
          <button type="button" className="icon-button" onClick={irParaProximoMes} title="Próximo mês">
            ›
          </button>
        </div>
        <span className="exercise-calendar-total">{diasComExercicio} {diasComExercicio === 1 ? 'dia treinado' : 'dias treinados'}</span>
      </div>

      <div className="exercise-calendar-grid">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="exercise-calendar-weekday">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="exercise-calendar-cell empty" />
          const dataISO = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const minutos = minutosPorDia[dataISO]
          const isHoje = dataISO === hoje
          return (
            <div key={dataISO} className={`exercise-calendar-cell${minutos ? ' active' : ''}${isHoje ? ' today' : ''}`}>
              <span className="exercise-calendar-day">{day}</span>
              {minutos ? <span className="exercise-calendar-minutes">{minutos}min</span> : null}
            </div>
          )
        })}
      </div>
      {loading && <p className="empty-state">Carregando...</p>}
    </div>
  )
}
