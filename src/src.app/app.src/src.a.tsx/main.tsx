import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authentication } from '../src.b.extensions/authentication.ts';
import { LaunchSocketConnection } from '../src.a.chats/ws.root.tsx';
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { ReactElement } from 'react';
import '../src.b.css/index.css';

const Layout = lazy(() => import('./tsx.items/layout.tsx'));
const LoginPage = lazy(() => import('./tsx.pages/page.login.tsx'));
const WelcomePage = lazy(() => import('./tsx.pages/page.welcome.tsx'));
const ChatPage = lazy(() => import('./tsx.pages/page.chat.tsx'));
const UsersListPage = lazy(() => import('./tsx.pages/list.contacts.tsx'));
const ChatsListPage = lazy(() => import('./tsx.pages/list.chats.tsx'));

const withSuspense = (component: ReactElement) => (
  <Suspense>{component}</Suspense>
);

const privateAuth = (component: ReactElement) => {
  const Wrapper = () => {
    const { data, isLoading } = authentication();
    return isLoading
      ? null
      : data
        ? <LaunchSocketConnection>{component}</LaunchSocketConnection>
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
      {
        path: 'users', element: privateAuth(withSuspense(<UsersListPage />)), children: [
          {
            path: "/users/:chatId",
            element: privateAuth(withSuspense(<ChatPage />)),
          },
        ]
      },
      {
        path: 'chats', element: privateAuth(withSuspense(<ChatsListPage />)), children: [
          {
            path: "/chats/:chatId",
            element: privateAuth(withSuspense(<ChatPage />)),
          },
        ]
      },
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