import { lazy, Suspense, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, type RouteObject } from 'react-router-dom';
import { authentication } from '../src.b.extensions/authentication';
import { useSocketService } from '../src.a.socket/socket.a.config/use.socket.service';
import '../src.b.css/index.css';

const Layout = lazy(() => import('./tsx.items/layout'));
const LoginPage = lazy(() => import('./tsx.pages/page.login'));
const WelcomePage = lazy(() => import('./tsx.pages/page.welcome'));
const ChatPage = lazy(() => import('./tsx.pages/page.chat'));
const UsersListPage = lazy(() => import('./tsx.pages/list.contacts'));
const ChatsListPage = lazy(() => import('./tsx.pages/list.chats'));

const withSuspense = (component: ReactElement) => <Suspense fallback={null}>{component}</Suspense>;
const PrivateGate = () => {
  const { data, isLoading } = authentication();

  if (isLoading) return null;
  if (!data) return <Navigate to="/login" replace />;

  return <AuthenticatedSocketShell />;
};

const AuthenticatedSocketShell = () => {
  useSocketService();
  return <Outlet />;
};

const UsersLayout = () => (
  <>
    <Suspense fallback={null}><UsersListPage /></Suspense>
    <Outlet />
  </>
);

const ChatsLayout = () => (
  <>
    <Suspense fallback={null}><ChatsListPage /></Suspense>
    <Outlet />
  </>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(<Layout />),
    children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: withSuspense(<WelcomePage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      {
        element: <PrivateGate />,
        children: [
          {
            path: 'users',
            element: <UsersLayout />,
            children: [
              { path: ':username/:chatId', element: withSuspense(<ChatPage />) },
            ],
          },
          {
            path: 'chats',
            element: <ChatsLayout />,
            children: [
              { path: ':username/:chatId', element: withSuspense(<ChatPage />) },
            ],
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);
const queryClient = new QueryClient();

export default function Main() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}