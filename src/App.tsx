import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { StatusPage } from './pages/StatusPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { CheckYourEmailPage } from './features/auth/pages/CheckYourEmailPage'
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

/** Las rutas, sin el router, para que los tests monten su propio MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StatusPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/check-your-email" element={<CheckYourEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function NotFoundPage() {
  return (
    <main className="page page--narrow">
      <header className="header">
        <h1>Esta página no existe</h1>
        <p className="lead">
          Puede que el enlace esté incompleto. <Link to="/">Volver al inicio</Link>.
        </p>
      </header>
    </main>
  )
}
