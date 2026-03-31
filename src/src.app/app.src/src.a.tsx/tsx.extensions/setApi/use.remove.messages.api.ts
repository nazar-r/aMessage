import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removingMessages } from "./remove.messages.api";

export const useRemovingMessages = (onSuccessCallback?: (messageId: string) => void) => {
    const queryClient = useQueryClient();

    return useMutation<unknown, unknown, string>({
        mutationFn: (messageId: string) => removingMessages(messageId),

        onMutate: async (messageId) => {
            await queryClient.cancelQueries({ queryKey: ["messages"] });
            const prev = queryClient.getQueryData(["messages"]);

            queryClient.setQueryData(["messages"], (old: any) =>
                (old || []).filter((message: any) => message.messageId !== messageId)
            );

            return { prev };
        },

        onSuccess: (_data, messageId) => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            if (onSuccessCallback) onSuccessCallback(messageId);
        },
    });
};