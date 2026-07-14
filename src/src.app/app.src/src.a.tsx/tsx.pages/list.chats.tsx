import { useFetchingUsers } from "../../src.b.extensions/getApi/use.get.users.api";
import { useAddUserAsContact } from "../../src.b.extensions/setApi/set.api.POST/use.add.contact";
import { useRemoveUserContact } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.contact";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Menu } from "../tsx.items/items.menu/menu";
import { Outlet } from 'react-router-dom';

const ChatsListContent = () => {
    const navigate = useNavigate();
    const { data: users } = useFetchingUsers();
    const { mutate: mutateAddUserContact } = useAddUserAsContact();
    const { mutate: removeAddUserContact } = useRemoveUserContact();
    const listRef = useRef<HTMLUListElement | null>(null);

    const addUserContact = (userId: string) => {
        mutateAddUserContact({
            userContactId: userId,
        });
    };

    const removeUserContact = (userId: string) => {
        removeAddUserContact({
            userContactId: userId,
        });
    };

    return (
        <div className="lobby-page">
            <div className="list-page">
                <div className="list-page__title">Your Chats</div>
                <ul ref={listRef} className="list-page__list">
                    {users?.map((user) => (
                        <li key={user.userId} className="list-page__list-item" onClick={() => navigate(`/chats/${user.userId}`, { state: { peerWsId: user.userId, userName: user.userName } })}>
                            <div className="list-page__list-item--image">
                                {user.isContact === true && <div className="contact">C</div>}
                            </div>
                            <div className="list-page__list-item--content">
                                <div className="list-page__list-item--content__container">
                                    <div className="list-page__list-item--title">
                                        <div className="list-item--title__name">{user.userName}</div>
                                        <div className="list-item--title__time">00:00</div>
                                    </div>
                                    <p className="list-page__list-item--message">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed</p>
                                </div>
                                <div className="list-page__list-item--add-contact" onClick={(e) => (e.stopPropagation(),
                                    user.isContact === true
                                        ? removeUserContact(user.userId)
                                        : addUserContact(user.userId)
                                )}>{user.isContact === true
                                    ? "✕ Delete contact"
                                    : "✓ Add Contact"}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <Menu scrollRef={listRef} />
            </div>
            <Outlet />
        </div>
    );
};

export default ChatsListContent;