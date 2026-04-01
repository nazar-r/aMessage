import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pushingMessages } from "./send.messages.api";
import type { MessagesData, ContextType } from "../types";

export const useCreatingMessage = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation<any, unknown, MessagesData, ContextType>({
        mutationFn: (data: MessagesData) => pushingMessages(data),

        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ["messages"] });

            const prev = queryClient.getQueryData(["messages"]);

            queryClient.setQueryData(["messages"], (old: any) => [
                ...(old || []),
                {
                    messageId: `temp-${crypto.randomUUID()}`,
                    content: newMessage.content,
                    messageStatus: "mine",
                }]);

            return { prev };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            if (onSuccessCallback) onSuccessCallback();
        },
    });
};