import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (<div className="main-container">
        <Outlet />
    </div>)
};

export default Layout;