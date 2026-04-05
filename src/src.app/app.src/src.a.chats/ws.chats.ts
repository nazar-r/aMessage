import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import type { RoomConfig, GotMessagesData, MessagesData } from "../src.a.tsx/tsx.extensions/types";

type RemovedMessagePayload = {
  messageId: string;
};

type NewMessagePayload = {
  userId: string;
  text: string;
  messageId: string;
};

type MessagesHistoryPayload = {
  messages: GotMessagesData[];
  nextCursor: string | null;
};

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<MessagesData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const roomId = peerWsId ? `room-with-${peerWsId}` : "";

  useEffect(() => {
    if (!peerWsId || socketRef.current) return;

    const s = io("http://localhost:3001", {
      withCredentials: true,
      query: { peerId: peerWsId },
    });

    socketRef.current = s;

    const handleMessagesHistory = ({ messages: msgs, nextCursor }: MessagesHistoryPayload) => {
      const formattedMessages: MessagesData[] = msgs.map((msg) => ({
        messageStatus: msg.userId === peerWsId ? "got" : "mine",
        messageId: msg.messageId,
        content: msg.text,
      }));

      setMessages(formattedMessages);
      setCursor(nextCursor);
    };

    const handleNewMessage = (msg: NewMessagePayload) => {
      const receivedMessage: MessagesData = {
        messageStatus: msg.userId === peerWsId ? "got" : "mine",
        messageId: msg.messageId,
        content: msg.text,
      };

      setMessages((prev) => [...prev, receivedMessage]);
    };

    const handleMessageRemoved = ({ messageId }: RemovedMessagePayload) => {
      setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
    };

    s.on("connect", () => console.log("WS connected:", s.id));
    s.on("connect_error", (err) => console.error("WS connect_error:", err));
    s.on("messagesHistory", handleMessagesHistory);
    s.on("newMessage", handleNewMessage);
    s.on("messageRemoved", handleMessageRemoved);

    return () => {
      s.off("connect");
      s.off("connect_error");
      s.off("messagesHistory", handleMessagesHistory);
      s.off("newMessage", handleNewMessage);
      s.off("messageRemoved", handleMessageRemoved);
      s.disconnect();
      socketRef.current = null;
    };
  }, [peerWsId]);

  const sendMessage = (message: MessagesData) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("message", { text: message.content });
  };

  const removeMessage = (messageId: string) => {
    const socket = socketRef.current;
    const messageElem = document.getElementById(messageId);
    
    if (!socket) return;
    if (messageElem) {
      messageElem.classList.remove("chat-message");
      messageElem.classList.add("chat-message--fade");
      setTimeout(() => {socket.emit("removeMessage", { messageId })}, 200);
    }
  };

  return {
    roomId,
    sendMessage,
    removeMessage,
    messages,
    socket: socketRef.current,
    cursor,
  };
};