import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessageInterface } from "../../src.c.extensions/extentions.types/chats.types";

const upsertMessages = (prev: MessageInterface[], incoming: MessageInterface[]) => {
  const existingMessages = new Set(prev.map((item) => item.messageId));
  const newMessages = incoming.filter((item) => !existingMessages.has(item.messageId));

  return [...prev, ...newMessages];
};

export const useQueryChatAdapter = (peerWsId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["chat", peerWsId];

  const { data: messages = [] } = useQuery<MessageInterface[]>({
    queryKey,
    queryFn: () => queryClient.getQueryData<MessageInterface[]>(queryKey) ?? [],
    initialData: () => queryClient.getQueryData<MessageInterface[]>(queryKey) ?? [],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const setNewMessage = useMutation({
    mutationFn: async () => { },

    onMutate(message: MessageInterface) {
      queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
        upsertMessages(prev, [message]),
      );
    },
  });

  const setMessageUpdate = useMutation({
    mutationFn: async () => { },

    onMutate(message: MessageInterface) {
      queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
        prev.map((item) =>
          item.messageId === message.messageId ? { ...item, ...message } : item,
        ),
      );
    },
  });

  const setMessageRemove = useMutation({
    mutationFn: async () => { },

    onMutate(messageId: string) {
      queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
        prev.filter((item) => item.messageId !== messageId),
      );
    },
  });

  const setRecievedMessage = (message: MessageInterface) => {
    queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
      upsertMessages(prev, [message]),
    );
  };

  const setRecievedMessageUpdate = (message: MessageInterface) => {
    queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
      prev.map((item) =>
        item.messageId === message.messageId ? { ...item, ...message } : item,
      ),
    );
  };

  const setRecievedMessageRemove = (messageId: string) => {
    queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
      prev.filter((item) => item.messageId !== messageId),
    );
  };

  const mergeMessages = (messages: MessageInterface[]) => {
    queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
      upsertMessages(prev, messages),
    );
  };

  return {
    messages,
    setNewMessage,
    setMessageUpdate,
    setMessageRemove,
    setRecievedMessage,
    setRecievedMessageUpdate,
    setRecievedMessageRemove,
    mergeMessages,
  };
};