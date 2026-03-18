import { SignIn, useUser } from '@clerk/clerk-react'
import { useConvexAuth } from 'convex/react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CoeList from './pages/CoeList'
import SediList from './pages/SediList'
import DipendentiList from './pages/DipendentiList'
import ServiziList from './pages/ServiziList'
import CorsiList from './pages/CorsiList'
import IscrizioniList from './pages/IscrizioniList'
import ImportExcel from './components/ImportExcel'

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { isLoaded } = useUser()

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Piano Formazione</h1>
            <p className="text-slate-600 mt-2">Dasein — Gestione corsi e dipendenti</p>
          </div>
          <SignIn routing="hash" />
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/coe" element={<CoeList />} />
        <Route path="/sedi" element={<SediList />} />
        <Route path="/dipendenti" element={<DipendentiList />} />
        <Route path="/servizi" element={<ServiziList />} />
        <Route path="/corsi" element={<CorsiList />} />
        <Route path="/iscrizioni" element={<IscrizioniList />} />
        <Route path="/importa" element={<ImportExcel />} />
      </Routes>
    </Layout>
  )
}

export default App
