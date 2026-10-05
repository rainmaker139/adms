import { HashRouter, Navigate, Route, Routes } from 'react-router'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProgramPage, { NotFoundPage } from './pages/ProgramPage'
import { AppProvider } from './state/AppProvider'

export default function App() {
  return <AppProvider><HashRouter><Routes>
    <Route path="login" element={<LoginPage />} />
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="home" element={<HomePage />} />
      <Route path="p/:programId" element={<ProgramPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></HashRouter></AppProvider>
}



