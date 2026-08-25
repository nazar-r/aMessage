import { useRef } from "react";
import { Menu } from "../tsx.items/items.menu/menu";
import { Outlet, useNavigate } from "react-router-dom";
import { useFetchingUserChats } from "../../src.b.extensions/getApi/use.get.list.of.chats";
import { useAddUserAsContact } from "../../src.b.extensions/setApi/set.api.POST/use.add.contact";
import { useRemoveUserContact } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.contact";
import { useOnlineUsersQuery } from "../../src.a.socket/socket.a.config/use.socket.service.query";
import { useRemoveUserChat } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.chat";

const ChatsListContent = () => {
    const navigate = useNavigate();
    const { data: chats } = useFetchingUserChats();
    const { data: onlineUsers = [] } = useOnlineUsersQuery();
    const { mutate: mutateAddUserContact } = useAddUserAsContact();
    const { mutate: removeAddUserContact } = useRemoveUserContact();
    const { mutate: deleteUserChat } = useRemoveUserChat();
    const listRef = useRef<HTMLUListElement | null>(null);

    // console.log("chats", chats);

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

    const removeUserChat = (roomId: string) => {
        deleteUserChat({
            chatId: roomId,
        });
    };

    return (
        <div className="lobby-page">
            <div className="list-page">
                <div className="list-page__title">Your Chats</div>
                <ul ref={listRef} className="list-page__list">
                    {chats?.map((chat) => {
                        const isOnline = onlineUsers.includes(chat.userId);

                        return (
                            <li key={chat.roomId} className="list-page__list-item" onClick={() => navigate(`/chats/${encodeURIComponent(chat.userName)}/${chat.userId}`, { state: { peerWsId: chat.userId, userName: chat.userName } })}>
                                <div className="list-page__list-item--image">
                                    {chat.isContact === true && <div className="contact">C</div>}
                                    {isOnline ? <div className="online"></div> :<div className="online-none"></div> }
                                </div>

                                <div className="list-page__list-item--content">
                                    <div className="list-page__list-item--content__container">
                                        <div className="list-page__list-item--title">
                                            <div className="list-item--title__name">{chat.userName}</div>
                                            <div className="list-item--title__time">00:00</div>
                                        </div>

                                        <p className="list-page__list-item--message"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed </p>
                                    </div>

                                    <div className="list-page__list-item--actions">
                                        <div className="list-page__list-item--add-contact" onClick={(e) => { e.stopPropagation(); removeUserChat(chat.roomId) }}> {"✕ Delete Chat"}  </div>
                                        <div className="list-page__list-item--add-contact" onClick={(e) => (e.stopPropagation(), chat.isContact === true ? removeUserContact(chat.userId) : addUserContact(chat.userId))}>
                                            {chat.isContact === true ? "✕ Delete contact" : "✓ Add Contact"}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <Menu scrollRef={listRef} />
            </div>
            <Outlet />
        </div>
    );
};

export default ChatsListContent;