import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from "@vercel/analytics/react";
import RouterRendering from './main.tsx';

const container = document.querySelector('.main');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <StrictMode>
    <RouterRendering />
    <Analytics />
  </StrictMode>
);