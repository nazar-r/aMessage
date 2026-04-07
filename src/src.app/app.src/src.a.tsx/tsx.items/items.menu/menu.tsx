import { useState, useEffect } from "react";
import { ChatsList } from './menu.chats.list';
import { ContactsList } from './menu.contacts.list';
import { SettingsPage } from './menu.settings';

export const Menu = () => {
    const [defMenu, setMenu] = useState(false);
    const [defMenuItems, setMenuItems] = useState<"chats" | "contacts" | "settings" | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1250);

    const switchMenu = () => setMenu(prev => !prev);
    const closeOrSwitchMenu = () => { defMenuItems ? setMenuItems(null) : setMenu(prev => !prev) };
    const openMenuItem = (item: "chats" | "contacts" | "settings") => { setMenuItems(item) };

    useEffect(() => {
        const resizedPage = () => setIsMobile(window.innerWidth <= 1250);
        window.addEventListener("resize", resizedPage);
        return () => window.removeEventListener("resize", resizedPage);
    }, []);

    const menuContent = defMenuItems === "chats"
        ? <ChatsList />
        : defMenuItems === "contacts"
            ? <ContactsList />
            : defMenuItems === "settings"
                ? <SettingsPage />
                : null;

const menuItems = (
    <>
        <div className={`menu-container__item ${isMobile && defMenuItems ? "chat-message--fade" : ""}`} style={{ transitionDelay: isMobile && defMenuItems ? "0.2s" : "0s" }} onClick={() => openMenuItem("chats")}>Chats</div>
        <div className={`menu-container__item ${isMobile && defMenuItems ? "chat-message--fade" : ""}`} style={{ transitionDelay: isMobile && defMenuItems ? "0.2s" : "0s" }} onClick={() => openMenuItem("contacts")}>Contacts</div>
        <div className={`menu-container__item ${isMobile && defMenuItems ? "chat-message--fade" : ""}`} style={{ transitionDelay: isMobile && defMenuItems ? "0.2s" : "0s" }} onClick={() => openMenuItem("settings")}>Settings</div>
    </>
);

    return (
        <>{defMenu && <div className="menu"><div className="menu-content">{menuContent}</div></div>}
            <div className="menu-container" style={{ bottom: defMenu ? (isMobile ? "23vh" : "15vh") : "8vh" }}>
                {!isMobile ? <div className="menu-button" onClick={switchMenu} style={{ fontSize: defMenu ? 18 : 19 }}>Menu</div> : null}
                {defMenu && (isMobile ? (!defMenuItems ? menuItems : null) : menuItems)}
                {isMobile ? <div className="menu-button" onClick={closeOrSwitchMenu} style={{ fontSize: defMenu ? 18 : 19 }}>Menu</div> : null}
            </div> </>
    );
}