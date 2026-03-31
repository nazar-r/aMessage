import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatingMessages } from "./update.messages.api";
import type { messagesData, ContextType } from "../types";

export const useUpdatingMessage = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation<any, unknown, { messageId: string; data: messagesData }, ContextType>({
        mutationFn: ({ messageId, data }) => updatingMessages(data, messageId),

        onMutate: async ({ messageId, data }) => {
            await queryClient.cancelQueries({ queryKey: ["messages"] });

            const prev = queryClient.getQueryData<messagesData[]>(["messages"]);

            queryClient.setQueryData<messagesData[]>(["messages"], (old) =>
                old?.map(message => message.messageId === messageId ? { ...message, content: data.content } : message) || []
            );

            return { prev };
        },

        onError: (_err, _variables, context) => {
            if (context?.prev) {
                queryClient.setQueryData(["messages"], context.prev);
            }
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            if (onSuccessCallback) onSuccessCallback();
        },
    });
};