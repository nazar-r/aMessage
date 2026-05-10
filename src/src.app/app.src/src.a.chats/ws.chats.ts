import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useOneOnOneRoomQuery } from "./use.ws.chats";
import { deriveSharedRoomKey, ensureRoomKeyPair, exportPublicKey, getStoredPeerPublicKey, importPublicKey, setStoredPeerPublicKey, waitForSodium } from "../src.a.encryption/encryption.keys";
import type { E2EEPeerPublicKeyPayload, RoomKeyPair, RoomConfig } from "../src.a.tsx/tsx.extensions/types";

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const myKeyPairRef = useRef<RoomKeyPair | null>(null);
  const sharedKeyRef = useRef<Uint8Array | null>(null);
  const encryptedTextByMessageIdRef = useRef<Map<string, string>>(new Map());
  const pendingOwnMessageIdsRef = useRef<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const {
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
  } = useOneOnOneRoomQuery({
    peerWsId,
    onCursorChange: setCursor,
    socketRef,
    myKeyPairRef,
    sharedKeyRef,
    encryptedTextByMessageIdRef,
    pendingOwnMessageIdsRef,
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

      const s = io(import.meta.env.VITE_BACKEND_URL, {
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

          status === "online" ? next.add(userId) : next.delete(userId);

          return next;
        });
      };

      const handlePeerPublicKey = async (payload: E2EEPeerPublicKeyPayload) => {
        if (payload.userId !== peerWsId || !payload.publicKey) {
          return;
        }

        if (!myKeyPairRef.current) return;

        const peerPublicKey = importPublicKey(payload.publicKey);

        await setStoredPeerPublicKey(peerWsId, peerPublicKey);

        sharedKeyRef.current = deriveSharedRoomKey(
          myKeyPairRef.current.secretKey,
          peerPublicKey
        );

        rehydrateMessages();
      };

      s.on("connect", () => {
        console.log("WS connected:", s.id);

        announceMyPublicKey();
        s.emit("e2ee:requestPeerPublicKey");
      });

      s.on("connect_error", (err) => {
        console.error("WS connect_error:", err);
      });

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
  }, [
    handleMessageRemoved,
    handleMessageUpdated,
    handleMessagesHistory,
    handleNewMessage,
    peerWsId,
    rehydrateMessages,
  ]);

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