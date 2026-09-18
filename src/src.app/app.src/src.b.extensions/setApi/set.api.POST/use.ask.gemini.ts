
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { sendSearchMessage } from "./ask.gemini";
import type { SearchMessage } from '../../types';

export const useSendSearchMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (prompt: string) => sendSearchMessage(prompt),

        onMutate: async (prompt: string) => {
            await queryClient.cancelQueries({ queryKey: ["geminiMessages"] });

            const previousMessages = queryClient.getQueryData(["geminiMessages"]);

            const newMessage: SearchMessage = {
                messageId: crypto.randomUUID(),
                content: prompt,
                messageStatus: "mine",
            };

            queryClient.setQueryData(["geminiMessages"], (prev: any) => ({
                ...prev,
                chatHistory: [
                    ...(prev?.chatHistory ?? []),
                    {
                        messageId: newMessage.messageId,
                        content: newMessage.content,
                        type: "prompt",
                        createdAt: new Date().toISOString(),
                    },
                ],
            }));

            return { previousMessages };
        },

        onSuccess: (data) => {
            queryClient.setQueryData(["geminiMessages"], (prev: any) => ({
                ...prev,
                chatHistory: [
                    ...(prev?.chatHistory ?? []),
                    {
                        messageId: crypto.randomUUID(),
                        content: data.answer,
                        type: "response",
                        createdAt: new Date().toISOString(),
                    },
                ],
            }));
        },

        onError: (error, _, context) => {
            console.error(error);

            queryClient.setQueryData(["geminiMessages"], context?.previousMessages);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["geminiMessages"] });
        },
    });
};

