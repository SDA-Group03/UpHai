import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { Layout } from "@/layouts/Layout";
import { LoadingPage } from "@/components/LoadingPage";
import Dashboard from "@/pages/Deployed";
import AudioPlayground from "@/pages/AudioPlayground";
import VisionPlayground from "@/pages/VisionPlayground";
// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ModelsPage = lazy(() => import("../pages/ModelsPage").then((module) => ({ default: module.ModelsPage })));
const ChatPlayground = lazy(() => import("@/pages/ChatPlayground"));
export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/models"
              element={
                <Layout>
                  <ModelsPage />
                </Layout>
              }
            />
            <Route
              path="/playground/chat"
              element={
                <Layout>
                  <ChatPlayground />
                </Layout>
              }
            />
            <Route
              path="/dashboard/deployed"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/playground/audio"
              element={
                <Layout>
                  <AudioPlayground />
                </Layout>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
