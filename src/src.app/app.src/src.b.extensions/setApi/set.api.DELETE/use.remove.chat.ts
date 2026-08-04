import { useQueryClient, useMutation } from "@tanstack/react-query";
import { removeUserChat } from "./remove.chat";

export const useRemoveUserChat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chatId }: { chatId: string }) =>
            removeUserChat(chatId),

        onMutate: ({ chatId }: { chatId: string }) => {
            queryClient.setQueryData(["chats"], (prevChats: any[] = []) =>
                prevChats.filter((chat) => chat.roomId !== chatId)
            );
        },

        onError: (error) => {
            console.error(error);
        },
    });
};