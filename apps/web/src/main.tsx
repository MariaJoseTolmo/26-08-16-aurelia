import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { InspectionBridgesHost } from './modules/inspections/components/InspectionBridgesHost';
import { router } from './routes/router';
import './modules/dashboard/dashboard-figma-alignment.css';
import './shared/layout/app-notifications-state.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <InspectionBridgesHost />
    </QueryClientProvider>
  </React.StrictMode>,
);
