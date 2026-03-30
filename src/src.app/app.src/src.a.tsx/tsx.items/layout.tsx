import { Outlet } from 'react-router-dom';

const Layout = () => (
    <div className="main-container">
        <Outlet />
    </div>
);

export default Layout;