import { ChatAdapter } from "./socket.chats.service";
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";
import { useQueryChatAdapter } from "../../src.b.queries/queries.hooks/use.query.chats.adapter";
import type { MessageInterface } from "../../src.c.extensions/extentions.types/chats.types";

export const useChatAdapter = () => {
  const { chatId: peerWsId = "" } = useParams<{ chatId: string }>();
  const useAdapter = useRef<ChatAdapter | null>(null);
  const useQuery = useQueryChatAdapter(peerWsId);

  const sendMessage = useCallback((payload: MessageInterface) => {
    const adapter = useAdapter.current;
    if (!adapter) return;
    const tempId = crypto.randomUUID();

    useQuery.setNewMessage.mutate({
      ...payload,
      messageId: tempId,
      messageStatus: "mine",
    });

    adapter.sendMessage(payload, tempId);
  }, [useQuery]);

  const updateMessage = useCallback((payload: MessageInterface) => {
    const adapter = useAdapter.current;
    if (!adapter) return;

    useQuery.setMessageUpdate.mutate(payload);
    adapter.updateMessage(payload);
  }, [useQuery]);

  const deleteMessage = useCallback((messageId: string) => {
    const adapter = useAdapter.current;
    if (!adapter) return;

    useQuery.setMessageRemove.mutate(messageId);
    adapter.deleteMessage(messageId);
  }, [useQuery]);

  useEffect(() => {
    const adapter = new ChatAdapter(peerWsId);
    useAdapter.current = adapter;
    adapter.setNewMessageCallback(useQuery.setRecievedMessage);
    adapter.setMessageUpdateCallback(useQuery.setRecievedMessageUpdate);
    adapter.setMessageRemoveCallback(useQuery.setRecievedMessageRemove);
    adapter.setMessagesHistoryCallback(useQuery.mergeMessages);

    void adapter.init();

    return () => {
      adapter.destroy();
      useAdapter.current = null;
    };
  }, [peerWsId]);

  return {
    sendMessage,
    updateMessage,
    deleteMessage,
    messages: useQuery.messages,
    adapter: useAdapter.current,
  };
};