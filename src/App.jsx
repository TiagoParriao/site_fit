import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import NavBar from './components/NavBar'
import Login from './routes/Login'
import Signup from './routes/Signup'
import Dashboard from './routes/Dashboard'
import Weight from './routes/Weight'
import Financas from './routes/Financas'
import Group from './routes/Group'

function AppLayout({ children }) {
  const { session } = useAuth()
  return (
    <div className="app-shell">
      {session && <NavBar />}
      <main>{children}</main>
    </div>
  )
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peso"
          element={
            <ProtectedRoute>
              <Weight />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financas"
          element={
            <ProtectedRoute>
              <Financas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grupo"
          element={
            <ProtectedRoute>
              <Group />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
