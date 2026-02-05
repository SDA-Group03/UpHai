import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ModelsPage } from '../pages/ModelsPage'
import { ProtectedRoute } from '../routes/ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import HomePage from '@/pages/HomePage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> 
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/models" element={
              <DashboardLayout>
              <ModelsPage />
             </DashboardLayout>} />
          </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
