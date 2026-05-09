import { useFetchingUsers } from "../tsx.extensions/getApi/use.get.users.api";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Menu } from "../tsx.items/items.menu/menu";
import { Outlet } from 'react-router-dom';

const ChoosingUserPageContent = () => {
    const navigate = useNavigate();
    const { data: users } = useFetchingUsers();

    const listRef = useRef<HTMLUListElement | null>(null);

    return (
        <div className="lobby-page">
            <div className="list-page">
                <div className="list-page__title">Your Contacts</div>
                <ul ref={listRef} className="list-page__list">
                    {users?.map((user) => (
                        <li key={user.userId} className="list-page__list-item" onClick={() => navigate("/chatslist/chat", { state: { peerWsId: user.userId, userName: user.userName } })}>
                            <div className="list-page__list-item--image"></div>
                            <div className="list-page__list-item--content">
                                <div className="list-page__list-item--title">
                                    <div className="list-item--title__name">{user.userName}</div>
                                    <div className="list-item--title__time">17:28</div>
                                </div>
                                <p className="list-page__list-item--message">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed</p>
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

export default ChoosingUserPageContent;