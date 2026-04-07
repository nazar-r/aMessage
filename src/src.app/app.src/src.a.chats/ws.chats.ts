import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import type { RemovedMessagePayload, E2EEPeerPublicKeyPayload, NewMessagePayload, MessagesHistoryPayload, RoomConfig, MessagesData } from "../src.a.tsx/tsx.extensions/types";
import { decryptRoomText, deriveSharedRoomKey, ensureRoomKeyPair, exportPublicKey, getStoredPeerPublicKey, importPublicKey, encryptRoomText, setStoredPeerPublicKey, waitForSodium } from "../src.a.encryption/encryption.keys";

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const myKeyPairRef = useRef<{
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  } | null>(null);

  const sharedKeyRef = useRef<Uint8Array | null>(null);
  const encryptedTextByMessageIdRef = useRef<Map<string, string>>(new Map());
  const roomId = peerWsId ? `room-with-${peerWsId}` : "";

  const [messages, setMessages] = useState<MessagesData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const rehydrateMessages = () => {
    const sharedKey = sharedKeyRef.current;

    setMessages((prev) =>
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

        setMessages(formattedMessages);
        setCursor(nextCursor);
      };

      const handleNewMessage = (msg: NewMessagePayload) => {
        encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

        const receivedMessage: MessagesData = {
          messageStatus: msg.userId === peerWsId ? "got" : "mine",
          messageId: msg.messageId,
          content: decryptRoomText(msg.text, sharedKeyRef.current),
        };

        setMessages((prev) => [...prev, receivedMessage]);
      };

      const handleMessageRemoved = ({ messageId }: RemovedMessagePayload) => {
        encryptedTextByMessageIdRef.current.delete(messageId);
        setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
      };

      const handleMessageUpdated = (msg: NewMessagePayload) => {
        encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === msg.messageId
              ? { ...m, content: decryptRoomText(msg.text, sharedKeyRef.current) }
              : m
          )
        );
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
    };
  }, [peerWsId]);

  const sendMessage = (message: MessagesData) => {
    const socket = socketRef.current;
    const sharedKey = sharedKeyRef.current;

    if (!socket) return;
    if (!sharedKey) {
      console.error("E2EE shared key is not ready yet.");
      return;
    }

    if (!message.content.trim()) return;

    socket.emit("message", {
      text: encryptRoomText(message.content, sharedKey),
    });
  };

  const removeMessage = (messageId: string) => {
    const socket = socketRef.current;
    const messageElem = document.getElementById(messageId);
    if (!socket) return;

    if (messageElem) {
      messageElem.classList.remove("chat-message");
      messageElem.classList.add("chat-message--fade");
      setTimeout(() => socket.emit("removeMessage", { messageId }), 200);
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

    const encrypted = encryptRoomText(newContent, sharedKey);

    encryptedTextByMessageIdRef.current.set(messageId, encrypted);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === messageId ? { ...msg, content: newContent } : msg
      )
    );

    socket.emit("updateMessage", {
      messageId,
      text: encrypted,
    });
  };

  return {
    roomId, sendMessage, removeMessage, updateMessage, messages, socket: socketRef.current, cursor, onlineUsers,
    isPeerOnline: peerWsId ? onlineUsers.has(peerWsId) : false,
  };
};