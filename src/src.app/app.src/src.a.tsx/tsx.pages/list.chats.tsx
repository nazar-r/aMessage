import { useEffect, useRef, useState } from "react";
import { Menu } from "../tsx.items/items.menu/menu";
import { Outlet, useNavigate } from "react-router-dom";
import { useFetchingUserChats } from "../../src.b.extensions/getApi/use.get.list.of.chats";
import { useAddUserAsContact } from "../../src.b.extensions/setApi/set.api.POST/use.add.contact";
import { useRemoveUserContact } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.contact";
import { useOnlineUsersQuery } from "../../src.a.socket/socket.a.config/use.socket.service.query";
import { useRemoveUserChat } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.chat";
import { ChatEncryptionService } from "../../src.a.socket/socket.b.chats/chats.a.crypto.service";

const ChatsListContent = () => {
    const navigate = useNavigate();
    const { data: chats } = useFetchingUserChats();
    const { data: onlineUsers = [] } = useOnlineUsersQuery();
    const { mutate: mutateAddUserContact } = useAddUserAsContact();
    const { mutate: removeAddUserContact } = useRemoveUserContact();
    const { mutate: deleteUserChat } = useRemoveUserChat();
    const [decryptedChats, setDecryptedChats] = useState(chats);
    const listRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        if (!chats) return;

        const decryptLastMessage = async () => {
            const result = await Promise.all(
                chats.map(async (chat) => {
                    if (!chat.lastMessage) return chat;

                    try {
                        const encryptionService = new ChatEncryptionService(chat.userId);
                        await encryptionService.init();

                        return {
                            ...chat,
                            lastMessage: encryptionService.decryptRoomText(chat.lastMessage),
                        };
                    } catch {
                        return chat;
                    }
                })
            );

            setDecryptedChats(result);
        };

        decryptLastMessage();
    }, [chats]);

    const formatMessageDate = (createdAt: string) => {
        const messageDate = new Date(createdAt);
        const now = new Date();
        const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const differenceInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));

        if (differenceInDays === 0) {
            return messageDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
        }

        if (differenceInDays === 1) {
            return messageDate.toLocaleDateString("uk-UA", {
                weekday: "long",
            });
        }

        return messageDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

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
                    {decryptedChats?.map((chat) => {
                        const isOnline = onlineUsers.includes(chat.userId);

                        return (
                            <li key={chat.roomId} className="list-page__list-item" onClick={() => navigate(`/chats/${encodeURIComponent(chat.userName)}/${chat.userId}`, { state: { peerWsId: chat.userId, userName: chat.userName } })}>
                                <div className="list-page__list-item--image">
                                    {isOnline ? <div className="online"></div> : <div className="online-none"></div>}
                                    {chat.isContact === true && <div className="contact">C</div>}
                                </div>

                                <div className="list-page__list-item--content">
                                    <div className="list-page__list-item--content__container">
                                        <div className="list-page__list-item--title">
                                            <div className="list-item--title__name">{chat.userName}</div>
                                            <div className="list-item--title__time">{chat.lastMessageCreatedAt ? formatMessageDate(chat.lastMessageCreatedAt) : ""}</div>
                                        </div>

                                        <p className="list-page__list-item--message">{chat.lastMessage}</p>
                                    </div>

                                    <div className="list-page__list-item--actions">
                                        <div className="list-page__list-item--add-contact" onClick={(e) => { e.stopPropagation(); removeUserChat(chat.roomId); }}>
                                            {"✕ Delete Chat"}
                                        </div>

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