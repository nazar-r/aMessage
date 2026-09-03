import { useQueryClient, useMutation } from "@tanstack/react-query";
import { sendSearchMessage } from "./ask.gemini";
import type { SearchMessage } from '../../types';

export const useSendSearchMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prompt: string) => sendSearchMessage(prompt),

    onMutate: (prompt: string) => {
      const newMessage: SearchMessage = {
        messageId: crypto.randomUUID(),
        content: prompt,
        messageStatus: "mine",
      };

      queryClient.setQueryData(["searchMessages"], (prevMessages: SearchMessage[] = []) => [
        ...prevMessages,
        newMessage,
      ]);
    },

    onSuccess: (data) => {
      const answerMessage: SearchMessage = {
        messageId: crypto.randomUUID(),
        content: data.answer,
        messageStatus: "got",
      };

      queryClient.setQueryData(["searchMessages"], (prevMessages: SearchMessage[] = []) => [
        ...prevMessages,
        answerMessage,
      ]);
    },

    onError: (error) => {
      console.error(error);
    },
  });
};