import { useState } from 'react'
import CaloriesSection from './CaloriesSection'
import ExerciseSection from './ExerciseSection'

export default function TrilhaSection() {
  const [tipo, setTipo] = useState('caloria')

  return (
    <div className="card">
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
      </div>
      {tipo === 'caloria' ? <CaloriesSection /> : <ExerciseSection />}
    </div>
  )
}
