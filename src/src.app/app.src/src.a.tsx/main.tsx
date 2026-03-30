import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authentication } from './tsx.items/authentication.ts';
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { ReactElement } from 'react';
import '../src.a.css/index.css';

const Layout = lazy(() => import('./tsx.items/layout.tsx'));
const LoginPage = lazy(() => import('./tsx.pages/login-page.tsx'));
const WelcomePage = lazy(() => import('./tsx.pages/welcome-page.tsx'));
const LobbyPage = lazy(() => import('./tsx.pages/lobby-page.tsx'));
const LobbyPagePrev = lazy(() => import('./tsx.pages/lobby-page-prev.tsx'));
const TasksEditorPage = lazy(() => import('./tsx.pages/tasks-editor-page.tsx'));
const UpdatesPage = lazy(() => import('./tsx.pages/updates-page.tsx'));

const withSuspense = (component: ReactElement) => (
  <Suspense>{component}</Suspense>
);

const privateAuth = (component: ReactElement) => {
  const Wrapper = () => {
    const { data, isLoading } = authentication();
    return isLoading
      ? null
      : data
        ? component
        : <Navigate to="/login" replace />;
  };
  return <Wrapper />;
};

const contentRoutes: RouteObject[] = [
  {
    path: '/', element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: withSuspense(<WelcomePage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'lobby-prev', element: privateAuth(withSuspense(<LobbyPagePrev />)) },
      { path: 'lobby', element: privateAuth(withSuspense(<LobbyPage />)) },
      { path: 'updates', element: privateAuth(withSuspense(<UpdatesPage />)) },
      { path: 'tasks-editor', element: privateAuth(withSuspense(<TasksEditorPage />)) },
    ],
  },
];

const appRouter = createBrowserRouter(contentRoutes);
const queryClient = new QueryClient();

const RouterRendering = () => {
  return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={appRouter} />
      </QueryClientProvider>
  );
};

export default RouterRendering;