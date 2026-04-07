import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RemovedMessagePayload, E2EEPeerPublicKeyPayload, NewMessagePayload, } from "../src.a.tsx/tsx.extensions/types";
import type { MessagesHistoryPayload, RoomConfig, MessagesData, SendMessageVariables } from "../src.a.tsx/tsx.extensions/types";
import { decryptRoomText, deriveSharedRoomKey, ensureRoomKeyPair, exportPublicKey, } from "../src.a.encryption/encryption.keys";
import { getStoredPeerPublicKey, importPublicKey, encryptRoomText, setStoredPeerPublicKey, waitForSodium, } from "../src.a.encryption/encryption.keys";

const isTempMessageId = (id: string) => id.startsWith("tmp-");

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const myKeyPairRef = useRef<{
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  } | null>(null);

  const sharedKeyRef = useRef<Uint8Array | null>(null);
  const encryptedTextByMessageIdRef = useRef<Map<string, string>>(new Map());
  const pendingOwnMessageIdsRef = useRef<string[]>([]);

  const queryClient = useQueryClient();

  const roomId = peerWsId ? `room-with-${peerWsId}` : "";
  const messagesKey = ["one-on-one-room-messages", roomId];

  const { data: messages = [] } = useQuery({
    queryKey: messagesKey,
    queryFn: async () => [] as MessagesData[],
    initialData: [] as MessagesData[],
    enabled: !!peerWsId,
  });

  const [cursor, setCursor] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const setMessagesCache = (
    updater: MessagesData[] | ((prev: MessagesData[]) => MessagesData[])
  ) => {
    queryClient.setQueryData<MessagesData[]>(messagesKey, (prev = []) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  };

  const upsertMessageById = (incoming: MessagesData) => {
    setMessagesCache((prev) => {
      const index = prev.findIndex((m) => m.messageId === incoming.messageId);

      if (index === -1) {
        return [...prev, incoming];
      }

      const next = [...prev];
      next[index] = incoming;
      return next;
    });
  };

  const replaceTempMessage = (tempId: string, incoming: MessagesData) => {
    setMessagesCache((prev) => {
      let replaced = false;

      const next = prev.map((m) => {
        if (m.messageId === tempId) {
          replaced = true;
          return incoming;
        }
        return m;
      });

      return replaced ? next : [...next, incoming];
    });
  };

  const removePendingTempId = (tempId: string) => {
    pendingOwnMessageIdsRef.current = pendingOwnMessageIdsRef.current.filter(
      (id) => id !== tempId
    );
  };

  const rehydrateMessages = () => {
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
  };

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, tempId }: SendMessageVariables) => {
      const socket = socketRef.current;
      const sharedKey = sharedKeyRef.current;

      if (!socket) {
        throw new Error("Socket is not connected.");
      }

      if (!sharedKey) {
        throw new Error("E2EE shared key is not ready yet.");
      }

      const trimmed = content.trim();
      if (!trimmed) return;

      const encrypted = encryptRoomText(trimmed, sharedKey);

      socket.emit("message", {
        text: encrypted,
        clientMessageId: tempId,
      });
    },

    onMutate: async ({ content, tempId }) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      pendingOwnMessageIdsRef.current.push(tempId);

      const optimisticMessage: MessagesData = {
        messageStatus: "mine",
        messageId: tempId,
        content: trimmed,
      };

      setMessagesCache((prev) => [...prev, optimisticMessage]);
    },

    onError: (_err, { tempId }) => {
      removePendingTempId(tempId);

      setMessagesCache((prev) => prev.filter((msg) => msg.messageId !== tempId));
    },
  });

  useEffect(() => {
    if (!peerWsId || socketRef.current) return;
    let cancelled = false;

    const init = async () => {
      await waitForSodium();
      if (cancelled) return;

      const keyPair = await ensureRoomKeyPair();
      if (cancelled) return;

      myKeyPairRef.current = keyPair;

      const storedPeerPublicKey = await getStoredPeerPublicKey(peerWsId);
      if (storedPeerPublicKey) {
        sharedKeyRef.current = deriveSharedRoomKey(
          myKeyPairRef.current.secretKey,
          storedPeerPublicKey
        );
      }

      const s = io("https://api.amessage.site", {
        withCredentials: true,
        query: { peerId: peerWsId },
      });

      socketRef.current = s;

      const announceMyPublicKey = () => {
        if (!myKeyPairRef.current) return;
        s.emit("e2ee:publicKey", {
          publicKey: exportPublicKey(myKeyPairRef.current.publicKey),
        });
      };

      const handleUsersOnline = (users: string[]) => {
        setOnlineUsers(new Set(users));
      };

      const handleUserStatus = ({
        userId,
        status,
      }: {
        userId: string;
        status: "online" | "offline";
      }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);

          if (status === "online") next.add(userId);
          else next.delete(userId);

          return next;
        });
      };

      const handlePeerPublicKey = async (payload: E2EEPeerPublicKeyPayload) => {
        if (payload.userId !== peerWsId || !payload.publicKey) return;
        if (!myKeyPairRef.current) return;

        const peerPublicKey = importPublicKey(payload.publicKey);

        await setStoredPeerPublicKey(peerWsId, peerPublicKey);

        sharedKeyRef.current = deriveSharedRoomKey(
          myKeyPairRef.current.secretKey,
          peerPublicKey
        );

        rehydrateMessages();
      };

      const handleMessagesHistory = ({
        messages: msgs,
        nextCursor,
      }: MessagesHistoryPayload) => {
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

        queryClient.setQueryData<MessagesData[]>(
          messagesKey,
          [...formattedMessages, ...optimisticOwnMessages]
        );

        setCursor(nextCursor);
      };

      const handleNewMessage = (msg: NewMessagePayload) => {
        encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

        const receivedMessage: MessagesData = {
          messageStatus: msg.userId === peerWsId ? "got" : "mine",
          messageId: msg.messageId,
          content: decryptRoomText(msg.text, sharedKeyRef.current),
        };

        const isMine = msg.userId !== peerWsId;

        if (isMine && msg.clientMessageId) {
          removePendingTempId(msg.clientMessageId);
          replaceTempMessage(msg.clientMessageId, receivedMessage);
          return;
        }

        if (isMine) {
          const fallbackTempId = pendingOwnMessageIdsRef.current.shift();

          if (fallbackTempId) {
            replaceTempMessage(fallbackTempId, receivedMessage);
            return;
          }
        }

        upsertMessageById(receivedMessage);
      };

      const handleMessageRemoved = ({ messageId }: RemovedMessagePayload) => {
        encryptedTextByMessageIdRef.current.delete(messageId);
        removePendingTempId(messageId);

        setMessagesCache((prev) =>
          prev.filter((msg) => msg.messageId !== messageId)
        );
      };

      const handleMessageUpdated = (msg: NewMessagePayload) => {
        encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

        const updatedMessage: MessagesData = {
          messageStatus: msg.userId === peerWsId ? "got" : "mine",
          messageId: msg.messageId,
          content: decryptRoomText(msg.text, sharedKeyRef.current),
        };

        upsertMessageById(updatedMessage);
      };

      s.on("connect", () => {
        console.log("WS connected:", s.id);
        announceMyPublicKey();
        s.emit("e2ee:requestPeerPublicKey");
      });

      s.on("connect_error", (err) => console.error("WS connect_error:", err));
      s.on("messagesHistory", handleMessagesHistory);
      s.on("newMessage", handleNewMessage);
      s.on("messageRemoved", handleMessageRemoved);
      s.on("messageUpdated", handleMessageUpdated);
      s.on("e2ee:peerPublicKey", handlePeerPublicKey);

      s.on("users-online", handleUsersOnline);
      s.on("user-status", handleUserStatus);
    };

    init();

    return () => {
      cancelled = true;

      const s = socketRef.current;
      if (s) {
        s.off("connect");
        s.off("connect_error");
        s.off("messagesHistory");
        s.off("newMessage");
        s.off("messageRemoved");
        s.off("messageUpdated");
        s.off("e2ee:peerPublicKey");
        s.off("users-online");
        s.off("user-status");
        s.disconnect();
      }

      socketRef.current = null;
      myKeyPairRef.current = null;
      sharedKeyRef.current = null;
      encryptedTextByMessageIdRef.current.clear();
      pendingOwnMessageIdsRef.current = [];
    };
  }, [peerWsId, queryClient]);

  const sendMessage = (message: MessagesData) => {
    const content = message.content.trim();
    if (!content) return;

    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `tmp-${crypto.randomUUID()}`
        : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    sendMessageMutation.mutate({
      content,
      tempId,
    });
  };

  const removeMessage = (messageId: string) => {
    const socket = socketRef.current;
    const messageElem = document.getElementById(messageId);
    if (!socket) return;

    if (messageElem) {
      messageElem.classList.remove("chat-message");
      messageElem.classList.add("chat-message--fade");

      setTimeout(() => {
        setMessagesCache((prev) =>
          prev.filter((msg) => msg.messageId !== messageId)
        );
        socket.emit("removeMessage", { messageId });
      }, 200);
    } else {
      setMessagesCache((prev) => prev.filter((msg) => msg.messageId !== messageId));
      socket.emit("removeMessage", { messageId });
    }
  };

  const updateMessage = (messageId: string, newContent: string) => {
    const socket = socketRef.current;
    const sharedKey = sharedKeyRef.current;
    if (!socket) return;
    if (!sharedKey) {
      console.error("E2EE shared key is not ready yet.");
      return;
    }

    const trimmed = newContent.trim();
    if (!trimmed) return;

    const encrypted = encryptRoomText(trimmed, sharedKey);

    encryptedTextByMessageIdRef.current.set(messageId, encrypted);

    setMessagesCache((prev) =>
      prev.map((msg) =>
        msg.messageId === messageId ? { ...msg, content: trimmed } : msg
      )
    );

    socket.emit("updateMessage", {
      messageId,
      text: encrypted,
    });
  };

  return {
    roomId,
    sendMessage,
    removeMessage,
    updateMessage,
    messages,
    socket: socketRef.current,
    cursor,
    onlineUsers,
    isPeerOnline: peerWsId ? onlineUsers.has(peerWsId) : false,
  };
};