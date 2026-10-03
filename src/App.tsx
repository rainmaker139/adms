import { HashRouter, Navigate, Route, Routes } from 'react-router'
import DemoLayout from './layouts/DemoLayout'
import Dashboard from './pages/Dashboard'
import TestPage from './pages/TestPage'

export default function App() {
  return <HashRouter><Routes><Route element={<DemoLayout />}>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="markets" element={<TestPage key="markets" title="참여마트" />} />
    <Route path="operations" element={<TestPage key="operations" title="농할운영" />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route></Routes></HashRouter>
}



