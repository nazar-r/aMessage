import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from "@vercel/analytics/react";
import RouterRendering from './main.tsx';

const container = document.querySelector('.main');
const queryClient = new QueryClient();
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterRendering />
      {import.meta.env.VITE_VERCEL_ENABLED === "true" && <Analytics />}
    </QueryClientProvider>
  </StrictMode>
);