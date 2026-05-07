import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useMenuScrollFade } from "../items.menu.animation";
import type { MenuProps } from "../../tsx.extensions/types";

export const Menu = ({ scrollRef }: MenuProps) => {
    const [defMenu, setMenu] = useState(false);

    const isFaded = useMenuScrollFade(scrollRef ?? undefined);
    const isMobile = window.innerWidth <= 1250;

    const menuButtonClass = `menu-button ${isFaded ? "fade" : ""}`;

    const navigate = useNavigate();
    const launchMenu = () => setMenu((prev) => !prev);

    const menuButton = createPortal(
        <div className={menuButtonClass} onClick={launchMenu}>Menu</div>,
        document.body
    );

    const menuItems = (
        <>
            {!isMobile ? <div className="menu-container__item" onClick={launchMenu}>Menu</div> : null}
            <div className="menu-container__item" onClick={() => navigate("/chatslist")}>Chats</div>
            <div className="menu-container__item" onClick={() => navigate("/contactslist")}>Contacts</div>
            <div className="menu-container__item" onClick={() => navigate("/chatslist")}>Chats</div>
            {isMobile ? <div className="menu-container__item" onClick={launchMenu}>Menu</div> : null}
        </>
    );

    const menuContainer = defMenu
        ? createPortal(<div className="menu-container">{menuItems}</div>, document.body)
        : null;

    return <>
        {menuButton}
        {menuContainer}
    </>;
};