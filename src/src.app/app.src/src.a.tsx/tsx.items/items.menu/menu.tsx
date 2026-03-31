import { useState } from "react";
import { ChatsList } from './menu.chats.list';
import { ContactsList } from './menu.contacts.list';
import { SettingsPage } from './menu.settings';

const Menu = () => {
    const [defMenu, setMenu] = useState(false);
    const [defMenuItems, setMenuItems] = useState<"chats" | "contacts" | "settings" | null>(null);

    return (
        <div>
            {defMenu && (
                <div className="menu">
                    <div className="menu-content">
                        {defMenuItems === "chats" && <ChatsList />}
                        {defMenuItems === "contacts" && <ContactsList />}
                        {defMenuItems === "settings" && <SettingsPage />}
                    </div>
                </div>
            )}
            <div className="menu-container" style={{ bottom: defMenu ? "20vh" : "10vh" }}>
                <div className="menu-button" onClick={() => setMenu(prev => !prev)} style={{ fontSize: defMenu ? "18px" : "20px" }}>Menu</div>
                {defMenu && (
                    <>  <div className="menu-container__item" onClick={() => setMenuItems("chats")}>Chats</div>
                        <div className="menu-container__item" onClick={() => setMenuItems("contacts")}>Contacts</div>
                        <div className="menu-container__item" onClick={() => setMenuItems("settings")}>Settings</div></>
                )}
            </div>
        </div>
    );
};

export default Menu;