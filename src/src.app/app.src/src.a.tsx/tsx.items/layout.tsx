import { Outlet } from 'react-router-dom';
import GlassBackground from './items.animations/background.animations';

const Layout = (): any => {
  return (
    <div className="main-container">
      <GlassBackground />
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;