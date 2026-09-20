import { Menu } from "../tsx.items/items.menu/menu";
import { useRemoveUserChat } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.chat";
import { formatMessageDate } from "../tsx.items/format.date";
import { Outlet, useNavigate } from "react-router-dom";
import { useAddUserAsContact } from "../../src.b.extensions/setApi/set.api.POST/use.add.contact";
import { useFetchingUserChats } from "../../src.b.extensions/getApi/use.get.list.of.chats";
import { useRemoveUserContact } from "../../src.b.extensions/setApi/set.api.DELETE/use.remove.contact";
import { useOnlineUsersQuery } from "../../src.a.socket/socket.a.config/use.socket.service.query";
import { ChatEncryptionService } from "../../src.a.socket/socket.b.chats/chats.a.crypto.service";
import { useEffect, useRef, useState } from "react";

const ChatsListContent = () => {
    const navigate = useNavigate();
    const { data: chats, isPending: isChatsPending } = useFetchingUserChats();
    const { data: onlineUsers = [] } = useOnlineUsersQuery();
    const { mutate: mutateAddUserContact } = useAddUserAsContact();
    const { mutate: removeAddUserContact } = useRemoveUserContact();
    const { mutate: deleteUserChat } = useRemoveUserChat();
    const [decryptedChats, setDecryptedChats] = useState(chats);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const listRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        if (!chats) return;

        const decryptLastMessage = async () => {
            setIsDecrypting(true);

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
            setIsDecrypting(false);
        };

        decryptLastMessage();
    }, [chats]);

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

    const isLoading = isChatsPending || isDecrypting;

    return (
        <div className="lobby-page">
            <div className="list-page">
                <div className="list-page__title">Your Chats</div>

                <ul ref={listRef} className="list-page__list">
                    {isLoading ? null : decryptedChats && decryptedChats.length > 0 ? (
                        decryptedChats.map((chat) => {
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
                        })
                    ) : (
                        <li className="list-page__list-item--empty">
                            <div className="list-page__list-item--empty-article">You have no chats yet.</div>
                            <div className="list-page__list-item--empty-button" onClick={() => navigate(`/users`)}>Start a New one → </div>
                        </li>
                    )}
                </ul>

                <Menu scrollRef={listRef} />
            </div>

            <Outlet />
        </div>
    );
};

export default ChatsListContent;