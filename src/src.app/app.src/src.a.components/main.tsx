import { authentication } from '../src.c.extensions/extentions.fetching/authentication';
import { useSocketService } from '../src.a.socket/socket.a.launch/use.socket.service';
import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, type RouteObject } from 'react-router-dom';
import '../src.b.styles/index.css';

const Layout = lazy(() => import('./components.items/layout'));

const LoginPage = lazy(() => import('./components.pages/page.a.login'));
const WelcomePage = lazy(() => import('./components.pages/page.a.welcome'));
const ChatPage = lazy(() => import('./components.pages/page.c.chat'));
const SearchPage = lazy(() => import('./components.pages/page.c.agent'));
const ErrorPage = lazy(() => import('./components.pages/page.d.error'));
const UsersListPage = lazy(() => import('./components.pages/page.b.users'));
const ChatsListPage = lazy(() => import('./components.pages/page.b.chats'));

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
  <><Suspense fallback={null}><UsersListPage /></Suspense>
    <Outlet /></>
);

const ChatsLayout = () => (
  <> <Suspense fallback={null}><ChatsListPage /></Suspense>
    <Outlet /></>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(<Layout />),
    children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: withSuspense(<WelcomePage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: '*', element: withSuspense(<ErrorPage />) },
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
          { path: 'search', element: withSuspense(<SearchPage />) },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);
const RouterRendering = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default RouterRendering;
