import { AppRouter } from './app/AppRouter'

function App() {
  return <AppRouter />
}

export default App
import React from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ModelsPage } from './pages/ModelsPage';

function App() {
  return (
    <DashboardLayout>
      <ModelsPage />
    </DashboardLayout>
  );
}

export default App;
