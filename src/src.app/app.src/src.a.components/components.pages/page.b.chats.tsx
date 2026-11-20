import { Menu } from "../components.items/items.menu/menu";
import { useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { sendPublicKey } from "../../src.c.extensions/extentions.fetching/send.public.key";
import { useRemoveUserChat } from "../../src.b.queries/queries.hooks/use.remove.chat";
import { formatMessageDate } from "../../src.c.extensions/extentions.items/format.date";
import { Outlet, useNavigate } from "react-router-dom";
import { useAddUserAsContact } from "../../src.b.queries/queries.hooks/use.add.contact";
import { useOnlineUsersQuery } from "../../src.b.queries/queries.hooks/use.socket.service.query";
import { useFetchingUserChats } from "../../src.b.queries/queries.hooks/use.get.chats.list";
import { useRemoveUserContact } from "../../src.b.queries/queries.hooks/use.remove.contact";

const ChatsListContent = () => {
    const navigate = useNavigate();
    const { data: chats = [] } = useFetchingUserChats();
    const { data: onlineUsers = [] } = useOnlineUsersQuery();
    const { mutate: addUserAsContact } = useAddUserAsContact();
    const { mutate: removeUserContact } = useRemoveUserContact();
    const { mutate: deleteUserChat } = useRemoveUserChat();

    useEffect(() => {
        sendPublicKey();
    }, []);

    const lastMessages = useQueries({
        queries: chats.map((chat) => ({
            queryKey: ["messages", chat.userId],
            queryFn: async (): Promise<any[]> => [],
            enabled: false,
        })),
    });

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

    const removeChat = (roomId: string) => {
        deleteUserChat({
            chatId: roomId,
        });
    };

    return (
        <div className="lobby-page">
            <div className="list-page">
                <div className="list-page__title">Your Chats</div>
                <ul className="list-page__list">
                    {chats && chats.length > 0 ? (
                        chats.map((chat, index) => {
                            const isOnline = onlineUsers.includes(chat.userId);
                            const isContact = chat.isContact === true;
                            const messages = lastMessages[index]?.data ?? [];
                            const lastMessage = messages.reduce((latest: any, message: any) => {
                                if (!latest || new Date(message.createdAt).getTime() > new Date(latest.createdAt).getTime()) {
                                    return message;
                                }

                                return latest;
                            }, undefined);

                            return (
                                <li key={chat.roomId} className="list-page__list-item" onClick={() => navigate(`/chats/${encodeURIComponent(chat.userName)}/${chat.userId}`, { state: { peerWsId: chat.userId, lastSeen: chat.lastSeen, userName: chat.userName } })}>
                                    <div className="list-page__list-item--image">
                                        {isOnline ? <div className="online"></div> : <div className="online-none"></div>}
                                        {isContact === true && (<div className="contact"> C<div className="contact-popup">this user is your contact</div></div>)}
                                    </div>

                                    <div className="list-page__list-item--content">
                                        <div className="list-page__list-item--content__container">
                                            <div className="list-page__list-item--title">
                                                <div className="list-item--title__name">{chat.userName}</div>
                                                <div className="list-item--title__time">{lastMessage?.createdAt ? formatMessageDate(lastMessage.createdAt) : ""}</div>
                                            </div>

                                            <p className="list-page__list-item--message">{lastMessage?.content ?? ""}</p>
                                        </div>

                                        <div className="list-page__list-item--actions">
                                            <div className="list-page__list-item--add-contact" onClick={(e) => { e.stopPropagation(); removeChat(chat.roomId); }}>
                                                {"✕ Delete Chat"}
                                            </div>

                                            <div className="list-page__list-item--add-contact" onClick={(e) => (e.stopPropagation(), isContact ? removeContact(chat.userId) : addContact(chat.userId))}>
                                                {chat.isContact === true ? "✕ Delete contact" : "✓ Add Contact"}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <li className="list-page__list-item--empty">
                            <div className="list-page__list-item--empty-article">You have no chats yet.</div>
                            <div className="list-page__list-item--empty-button" onClick={() => navigate(`/users`)}>Start a New one → </div>
                        </li>
                    )}
                </ul>
                <Menu />
            </div>
            <Outlet />
        </div>
    );
};

export default ChatsListContent;