import { Outlet } from 'react-router-dom';
import { useEffect } from "react";

export const useKeyboardOffset = () => {
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const update = () => {
            const keyboardHeight = Math.max(
                0,
                window.innerHeight - vv.height
            );

            document.documentElement.style.setProperty(
                "--keyboard-offset",
                `${keyboardHeight}px`
            );
        };

        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);

        update();

        return () => {
            vv.removeEventListener("resize", update);
            vv.removeEventListener("scroll", update);
        };
    }, []);
};

const Layout = () => {
    useKeyboardOffset()

    return (<div className="main-container">
        <Outlet />
    </div>)
};

export default Layout;