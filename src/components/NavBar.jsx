import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavIcon({ type }) {
  const paths = {
    home: <><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
    weight: <><path d="M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/><path d="M12 8v4"/><path d="M8.5 9.5a5 5 0 0 1 7 0"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
    group: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    plan: <><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/></>,
  }
  return <svg className="nav-icon-real" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>
}

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
          <NavIcon type="home" />Trilha
        </NavLink>
        <NavLink to="/peso"><NavIcon type="weight" />Peso</NavLink>
        <NavLink to="/financas"><NavIcon type="wallet" />Finanças</NavLink>
        <NavLink to="/grupo"><NavIcon type="group" />Grupo</NavLink>
        <NavLink to="/planejamento"><NavIcon type="plan" />Planejamento</NavLink>
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
