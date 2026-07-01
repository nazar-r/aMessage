import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RemovedMessagePayload,
  NewMessagePayload,
  MessagesHistoryPayload,
  MessagesData,
  SendMessageVariables,
  UseOneOnOneRoomQueryArgs,
} from "../src.b.extensions/types";
import {
  decryptRoomText,
  encryptRoomText,
} from "../src.b.encryption/encryption.keys";

const isTempMessageId = (id: string) => id.startsWith("tmp-");

const createTempMessageId = () => {
  const hasRandomUUID = typeof crypto !== "undefined" && "randomUUID" in crypto;

  return hasRandomUUID
    ? `tmp-${crypto.randomUUID()}`
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useOneOnOneRoomQuery = ({
  peerWsId,
  onCursorChange,
  socketRef,
  sharedKeyRef,
  encryptedTextByMessageIdRef,
  pendingOwnMessageIdsRef,
}: UseOneOnOneRoomQueryArgs) => {
  const queryClient = useQueryClient();

  const roomId = useMemo(
    () => (peerWsId ? `room-with-${peerWsId}` : ""),
    [peerWsId]
  );

  const messagesKey = useMemo(
    () => ["one-on-one-room-messages", roomId] as const,
    [roomId]
  );

  const { data: messages = [] } = useQuery({
    queryKey: messagesKey,
    queryFn: async () => [] as MessagesData[],
    initialData: [] as MessagesData[],
    enabled: !!peerWsId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "always",
  });

  const setMessagesCache = useCallback(
    (
      updater: MessagesData[] | ((prev: MessagesData[]) => MessagesData[])
    ) => {
      queryClient.setQueryData<MessagesData[]>(messagesKey, (prev = []) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    [messagesKey, queryClient]
  );

  const upsertMessageById = useCallback(
    (incoming: MessagesData) => {
      setMessagesCache((prev) => {
        const index = prev.findIndex((m) => m.messageId === incoming.messageId);
        const next = [...prev];
        next[index] = incoming;

        return index === -1 ? [...prev, incoming] : next;
      });
    },
    [setMessagesCache]
  );

  const replaceTempMessage = useCallback(
    (tempId: string, incoming: MessagesData) => {
      setMessagesCache((prev) => {
        const wasReplaced = prev.some((m) => m.messageId === tempId);
        const next = prev.map((m) =>
          m.messageId === tempId ? incoming : m
        );

        return wasReplaced ? next : [...next, incoming];
      });
    },
    [setMessagesCache]
  );

  const removePendingTempId = useCallback(
    (tempId: string) => {
      pendingOwnMessageIdsRef.current = pendingOwnMessageIdsRef.current.filter(
        (id) => id !== tempId
      );
    },
    [pendingOwnMessageIdsRef]
  );

  const rehydrateMessages = useCallback(() => {
    const sharedKey = sharedKeyRef.current;

    setMessagesCache((prev) =>
      prev.map((msg) => {
        const raw =
          encryptedTextByMessageIdRef.current.get(msg.messageId) ?? msg.content;

        return {
          ...msg,
          content: decryptRoomText(raw, sharedKey),
        };
      })
    );
  }, [encryptedTextByMessageIdRef, setMessagesCache, sharedKeyRef]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, tempId }: SendMessageVariables): Promise<void> => {
      const socket = socketRef.current;
      const sharedKey = sharedKeyRef.current;
      const trimmed = content.trim();

      const hasSocket = !!socket;
      const hasSharedKey = !!sharedKey;
      const hasContent = !!trimmed;

      return !hasSocket
        ? Promise.reject(new Error("Socket is not connected."))
        : !hasSharedKey
          ? Promise.reject(new Error("E2EE shared key is not ready yet."))
          : !hasContent
            ? Promise.resolve()
            : void socket.emit("message", {
              text: encryptRoomText(trimmed, sharedKey),
              clientMessageId: tempId,
            });
    },

    onMutate: async ({ content, tempId }) => {
      const trimmed = content.trim();
      const hasContent = !!trimmed;

      return hasContent
        ? (
          pendingOwnMessageIdsRef.current.push(tempId),
          setMessagesCache((prev) => [
            ...prev,
            {
              messageStatus: "mine",
              messageId: tempId,
              content: trimmed,
            },
          ])
        )
        : undefined;
    },

    onError: (_err, { tempId }) => {
      removePendingTempId(tempId);

      setMessagesCache((prev) => prev.filter((msg) => msg.messageId !== tempId));
    },
  });

  const sendMessage = useCallback(
    (message: MessagesData) => {
      const content = message.content.trim();
      const hasContent = !!content;
      const tempId = createTempMessageId();

      hasContent
        ? sendMessageMutation.mutate({
          content,
          tempId,
        })
        : undefined;
    },
    [sendMessageMutation]
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      const socket = socketRef.current;
      const messageElem = document.getElementById(messageId);

      const hasSocket = !!socket;
      const hasMessageElem = !!messageElem;

      return hasSocket
        ? hasMessageElem
          ? (
            messageElem.classList.remove("chat-message"),
            messageElem.classList.add("chat-message--fade"),
            setTimeout(() => {
              setMessagesCache((prev) =>
                prev.filter((msg) => msg.messageId !== messageId)
              );

              socket.emit("removeMessage", {
                messageId,
              });
            }, 200)
          )
          : (
            setMessagesCache((prev) =>
              prev.filter((msg) => msg.messageId !== messageId)
            ),
            socket.emit("removeMessage", {
              messageId,
            })
          )
        : undefined;
    },
    [setMessagesCache, socketRef]
  );

  const updateMessage = useCallback(
    (messageId: string, newContent: string) => {
      const socket = socketRef.current;
      const sharedKey = sharedKeyRef.current;
      const trimmed = newContent.trim();

      const hasSocket = !!socket;
      const hasSharedKey = !!sharedKey;
      const hasContent = !!trimmed;

      return !hasSocket
        ? undefined
        : !hasSharedKey
          ? (console.error("E2EE shared key is not ready yet."), undefined)
          : !hasContent
            ? undefined
            : (
              encryptedTextByMessageIdRef.current.set(
                messageId,
                encryptRoomText(trimmed, sharedKey)
              ),
              upsertMessageById({
                messageStatus: "mine",
                messageId,
                content: trimmed,
              }),
              socket.emit("updateMessage", {
                messageId,
                text: encryptRoomText(trimmed, sharedKey),
              })
            );
    },
    [encryptedTextByMessageIdRef, sharedKeyRef, socketRef, upsertMessageById]
  );

  const handleMessagesHistory = useCallback(
    ({ messages: msgs, nextCursor }: MessagesHistoryPayload) => {
      const formattedMessages: MessagesData[] = msgs.map((msg) => {
        encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

        return {
          messageStatus: msg.userId === peerWsId ? "got" : "mine",
          messageId: msg.messageId,
          content: decryptRoomText(msg.text, sharedKeyRef.current),
        };
      });

      const currentMessages =
        queryClient.getQueryData<MessagesData[]>(messagesKey) ?? [];

      const optimisticOwnMessages = currentMessages.filter((msg) =>
        isTempMessageId(msg.messageId)
      );

      queryClient.setQueryData<MessagesData[]>(messagesKey, [
        ...formattedMessages,
        ...optimisticOwnMessages,
      ]);

      onCursorChange(nextCursor);
    },
    [
      encryptedTextByMessageIdRef,
      messagesKey,
      onCursorChange,
      peerWsId,
      queryClient,
      sharedKeyRef,
    ]
  );

  const handleNewMessage = useCallback(
    (msg: NewMessagePayload) => {
      encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

      const receivedMessage: MessagesData = {
        messageStatus: msg.userId === peerWsId ? "got" : "mine",
        messageId: msg.messageId,
        content: decryptRoomText(msg.text, sharedKeyRef.current),
      };

      const isMine = msg.userId !== peerWsId;
      const hasClientMessageId = !!msg.clientMessageId;
      const fallbackTempId = pendingOwnMessageIdsRef.current[0];
      const hasFallbackTempId = !!fallbackTempId;

      return !isMine
        ? upsertMessageById(receivedMessage)
        : hasClientMessageId
          ? (
            removePendingTempId(msg.clientMessageId!),
            replaceTempMessage(msg.clientMessageId!, receivedMessage)
          )
          : hasFallbackTempId
            ? (
              pendingOwnMessageIdsRef.current.shift(),
              replaceTempMessage(fallbackTempId, receivedMessage)
            )
            : upsertMessageById(receivedMessage);
    },
    [
      encryptedTextByMessageIdRef,
      peerWsId,
      pendingOwnMessageIdsRef,
      replaceTempMessage,
      removePendingTempId,
      sharedKeyRef,
      upsertMessageById,
    ]
  );

  const handleMessageRemoved = useCallback(
    ({ messageId }: RemovedMessagePayload) => {
      encryptedTextByMessageIdRef.current.delete(messageId);
      removePendingTempId(messageId);

      setMessagesCache((prev) => prev.filter((msg) => msg.messageId !== messageId));
    },
    [encryptedTextByMessageIdRef, removePendingTempId, setMessagesCache]
  );

  const handleMessageUpdated = useCallback(
    (msg: NewMessagePayload) => {
      encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

      const updatedMessage: MessagesData = {
        messageStatus: msg.userId === peerWsId ? "got" : "mine",
        messageId: msg.messageId,
        content: decryptRoomText(msg.text, sharedKeyRef.current),
      };

      upsertMessageById(updatedMessage);
    },
    [encryptedTextByMessageIdRef, peerWsId, sharedKeyRef, upsertMessageById]
  );

  return {
    roomId,
    messages,
    sendMessage,
    removeMessage,
    updateMessage,
    rehydrateMessages,
    handleMessagesHistory,
    handleNewMessage,
    handleMessageRemoved,
    handleMessageUpdated,
  };
};