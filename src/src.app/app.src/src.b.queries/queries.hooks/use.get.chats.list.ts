import { fetchingUserChats } from "../queries.mutations/get.chats.list";
import { ChatEncryptionService } from "../../src.c.encryption/encryption.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatsData } from "../../src.c.extensions/extentions.types/types";

export const useFetchingUserChats = () => {
    const queryClient = useQueryClient();

    return useQuery<ChatsData[]>({
        queryKey: ["chats"],
        queryFn: async () => {
            const chats: any[] = await fetchingUserChats();

            return Promise.all(chats.map(async (chat) => {
                const { lastMessage, ...chatData } = chat;
                if (!lastMessage) return chatData;

                const encryptionService = new ChatEncryptionService(chat.userId);
                await encryptionService.init();
                const decryptedMessage = encryptionService.decryptRoomText(lastMessage);

                queryClient.setQueryData(["messages", chat.userId], (messages: any[] = []) => {
                    if (messages.some((message) => message.messageId === chat.messageId)) {
                        return messages;
                    }

                    return [...messages, {
                        messageId: chat.messageId,
                        userId: chat.messageUserId,
                        roomId: chat.roomId,
                        content: decryptedMessage,
                        createdAt: chat.lastMessageCreatedAt,
                    }];
                });
                return chatData;
            }));
        },
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 1,
    });
};