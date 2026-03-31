import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pushingMessages } from "./send.messages.api";
import type { messagesData, ContextType } from "../types";

export const useCreatingMessage = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation<any, unknown, messagesData, ContextType>({
        mutationFn: (data: messagesData) => pushingMessages(data),

        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ["messages"] });

            const prev = queryClient.getQueryData(["messages"]);

            queryClient.setQueryData(["messages"], (old: any) => [
                ...(old || []),
                {
                    messageId: `temp-${Date.now()}`,
                    content: newMessage.content,
                },
                { messageId: "test-1", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
                { messageId: "test-2", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
                { messageId: "test-3", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }
            ]);

            return { prev };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            if (onSuccessCallback) onSuccessCallback();
        },
    });
};