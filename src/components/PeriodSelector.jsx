import { PERIOD_PRESETS } from '../lib/periods'

export default function PeriodSelector({ preset, onPresetChange, date, onDateChange, start, onStartChange, end, onEndChange }) {
  return (
    <div className="period-selector">
      <div className="period-selector-tabs">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`period-tab${preset === p.key ? ' active' : ''}`}
            onClick={() => onPresetChange(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'dia' && (
        <label>
          Dia
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </label>
      )}
      {preset === 'mes' && (
        <label>
          Mês
          <input
            type="month"
            value={date ? date.slice(0, 7) : ''}
            onChange={(e) => onDateChange(`${e.target.value}-01`)}
          />
        </label>
      )}
      {preset === 'ano' && (
        <label>
          Ano
          <input
            type="number"
            value={date ? date.slice(0, 4) : ''}
            onChange={(e) => onDateChange(`${e.target.value}-01-01`)}
          />
        </label>
      )}
      {preset === 'custom' && (
        <div className="grid-2">
          <label>
            De
            <input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} />
          </label>
          <label>
            Até
            <input type="date" value={end} onChange={(e) => onEndChange(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  )
}
