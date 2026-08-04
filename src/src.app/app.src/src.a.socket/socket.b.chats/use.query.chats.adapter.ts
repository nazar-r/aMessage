import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessageInterface } from "../../src.b.extensions/chats.types";

const upsertMessages = (
  prev: MessageInterface[],
  incoming: MessageInterface[],
) => {
  const existingIds = new Set(prev.map((item) => item.messageId));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.messageId));

  return [...prev, ...uniqueIncoming];
};

export const useQueryChatAdapter = (peerWsId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["chat", peerWsId] as const;

  const { data: messages = [] } = useQuery<MessageInterface[]>({
    queryKey,
    queryFn: () => queryClient.getQueryData<MessageInterface[]>(queryKey) ?? [],
    initialData: () => queryClient.getQueryData<MessageInterface[]>(queryKey) ?? [],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const setNewMessage = useMutation({
    mutationFn: async () => {},

    onMutate(message: MessageInterface) {
      queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
        upsertMessages(prev, [message]),
      );
    },
  });

  const setMessageUpdate = useMutation({
    mutationFn: async () => {},

    onMutate(message: MessageInterface) {
      queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) =>
        prev.map((item) =>
          item.messageId === message.messageId ? { ...item, ...message } : item,
        ),
      );
    },
  });

  const setMessageRemove = useMutation({
    mutationFn: async () => {},

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

  const setRecievedMessageSaved = (message: MessageInterface & { tempMessageId: string }) => {
    queryClient.setQueryData<MessageInterface[]>(queryKey, (prev = []) => {
      const alreadySaved = prev.some((item) => item.messageId === message.messageId);
      const withoutTemp = prev.filter((item) => item.messageId !== message.tempMessageId);

      return alreadySaved ? withoutTemp : [...withoutTemp, message];
    });
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
    setRecievedMessageSaved,
    setRecievedMessageUpdate,
    setRecievedMessageRemove,
    mergeMessages,
  };
};