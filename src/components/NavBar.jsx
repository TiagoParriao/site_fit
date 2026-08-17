import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { profile, signOut } = useAuth()

  return (
    <nav className="navbar">
      <span className="navbar-brand">
        <span className="navbar-logo-mark"><i /><i /><i /></span>
        <span><strong>Magros</strong> <em>Skinnys</em></span>
      </span>
      <div className="navbar-links">
        <NavLink to="/" end>
          Trilha
        </NavLink>
        <NavLink to="/peso">Peso</NavLink>
        <NavLink to="/financas">Finanças</NavLink>
        <NavLink to="/grupo">Grupo</NavLink>
      </div>
      <div className="navbar-user">
        {profile && <span className="navbar-avatar">{profile.nome?.slice(0, 1).toUpperCase()}</span>}
        {profile && <span className="navbar-user-name">{profile.nome}</span>}
        <button className="link-button" onClick={signOut}>
          Sair
        </button>
      </div>
    </nav>
  )
}
