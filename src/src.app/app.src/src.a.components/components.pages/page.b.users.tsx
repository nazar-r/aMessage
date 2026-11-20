import { Menu } from "../components.items/items.menu/menu";
import { sendPublicKey } from "../../src.c.extensions/extentions.fetching/send.public.key";
import { formatLastSeen } from "../../src.c.extensions/extentions.items/format.last.seen";
import { useFetchingUsers } from "../../src.b.queries/queries.hooks/use.get.users.api";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAddUserAsContact } from "../../src.b.queries/queries.hooks/use.add.contact";
import { useOnlineUsersQuery } from "../../src.b.queries/queries.hooks/use.socket.service.query";
import { useRemoveUserContact } from "../../src.b.queries/queries.hooks/use.remove.contact";
import type { UsersData } from "../../src.c.extensions/extentions.types/types";

const UsersListContent = () => {
    const navigate = useNavigate();
    const { data: users = [] } = useFetchingUsers();
    const { data: onlineUsers = [] } = useOnlineUsersQuery();
    const [decryptedChats, setDecryptedChats] = useState(users);
    const { mutate: addUserAsContact } = useAddUserAsContact();
    const { mutate: removeUserContact } = useRemoveUserContact();

    useEffect(() => {
        sendPublicKey();
    }, []);

    const addContact = (userId: string) => {
        addUserAsContact({
            userContactId: userId,
        });
    };

    const removeContact = (userId: string) => {
        removeUserContact({
            userContactId: userId,
        });
    };

    return (
        <div className="lobby-page">
            <div className="list-page">
                <div className="list-page__title">Our Users</div>
                <ul className="list-page__list">
                    {users?.map((user: UsersData) => {
                        const isOnline = onlineUsers.includes(user.userId);
                        const isContact = user.isContact === true;

                        return (
                            <li key={user.userId} className="list-page__list-item" onClick={() => navigate(`/users/${encodeURIComponent(user.userName)}/${user.userId}`, { state: { lastSeen: user.lastSeen, userName: user.userName } })}>
                                <div className="list-page__list-item--image">
                                    {isOnline && <div className="online"></div>}
                                    {isContact && <div className="contact">C<div className="contact-popup">This user is your contact</div></div>}
                                </div>

                                <div className="list-page__list-item--content">
                                    <div className="list-page__list-item--content__container">
                                        <div className="list-page__list-item--title">
                                            <div className="list-item--title__name">{user.userName}</div>
                                            <div className="list-item--title__time">00:00</div>
                                        </div>

                                        <p className="list-page__list-item--message">{formatLastSeen(user.lastSeen)}</p>
                                    </div>

                                    <div className="list-page__list-item--add-contact" onClick={(e) => (e.stopPropagation(), isContact === true ? removeContact(user.userId) : addContact(user.userId))}>
                                        {isContact ? "✕ Delete contact" : "✓ Add Contact"}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <Menu />
            </div>
            <Outlet />
        </div>
    );
};

export default UsersListContent;