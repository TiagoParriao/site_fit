import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { profile, signOut } = useAuth()

  return (
    <nav className="navbar">
      <span className="navbar-brand">🔥 Fit Trail</span>
      <div className="navbar-links">
        <NavLink to="/" end>
          Trilha
        </NavLink>
        <NavLink to="/peso">Peso</NavLink>
        <NavLink to="/calorias">Calorias</NavLink>
        <NavLink to="/exercicio">Exercício</NavLink>
        <NavLink to="/grupo">Grupo</NavLink>
      </div>
      <div className="navbar-user">
        {profile && <span>{profile.nome}</span>}
        <button className="link-button" onClick={signOut}>
          Sair
        </button>
      </div>
    </nav>
  )
}
