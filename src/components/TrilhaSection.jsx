import { useState } from 'react'
import CaloriesSection from './CaloriesSection'
import ExerciseSection from './ExerciseSection'
import WaterSection from './WaterSection'

export default function TrilhaSection({ onDataChange }) {
  const [tipo, setTipo] = useState('caloria')

  return (
    <div className="card personal-trail-card">
      <div className="personal-trail-head">
        <div><span className="section-kicker">Registro pessoal</span><h2>Minha trilha</h2><p>Registre o que move seu dia.</p></div>
      <div className="section-tabs">
        <button
          type="button"
          className={`section-tab${tipo === 'caloria' ? ' active' : ''}`}
          onClick={() => setTipo('caloria')}
        >
          Calorias
        </button>
        <button
          type="button"
          className={`section-tab${tipo === 'exercicio' ? ' active' : ''}`}
          onClick={() => setTipo('exercicio')}
        >
          Exercício
        </button>
        <button
          type="button"
          className={`section-tab${tipo === 'agua' ? ' active' : ''}`}
          onClick={() => setTipo('agua')}
        >
          Água
        </button>
      </div>
      </div>
      {tipo === 'caloria' && <CaloriesSection onDataChange={onDataChange} />}
      {tipo === 'exercicio' && <ExerciseSection onDataChange={onDataChange} />}
      {tipo === 'agua' && <WaterSection />}
    </div>
  )
}
