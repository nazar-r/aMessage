import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import type { RoomConfig, MessagesData } from "../src.a.tsx/tsx.extensions/types";

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<MessagesData[]>([]);

  const roomId = peerWsId ? `room-with-${peerWsId}` : "";

  useEffect(() => {
    if (!peerWsId || socketRef.current) return;

    const s = io("http://localhost:3001", {
      withCredentials: true,
      query: { peerId: peerWsId },
    });

    socketRef.current = s;

    s.on("connect", () => console.log("WS connected:", s.id));
    s.on("connect_error", (err) => console.error("WS connect_error:", err));

    s.on("newMessage", (msg: { userId: string; text: string; messageId: string }) => {
      const receivedMessage: MessagesData = {
        messageStatus: msg.userId === peerWsId ? "got" : "mine",
        messageId: msg.messageId,
        content: msg.text,
      };

      setMessages(prev => [...prev, receivedMessage]);
    });

    return () => {
      s.off("newMessage");
      s.disconnect();
      socketRef.current = null;
    };
  }, [peerWsId]);

  const sendMessage = (message: MessagesData) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("message", { text: message.content });
  };

  return { roomId, sendMessage, messages, socket: socketRef.current };
};