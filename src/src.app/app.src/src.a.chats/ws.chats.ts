import { callWebSocket } from "./ws.root";
import { useOneOnOneRoomQuery } from "./use.ws.chats";
import { useEffect, useRef, useState } from "react";
import { setStoredPeerPublicKey, waitForSodium } from "../src.b.encryption/encryption.keys";
import { deriveSharedRoomKey, ensureRoomKeyPair, exportPublicKey, getStoredPeerPublicKey, importPublicKey, } from "../src.b.encryption/encryption.keys";
import type { E2EEPeerPublicKeyPayload, RoomKeyPair, RoomConfig, } from "../src.b.extensions/types";
import type { Socket } from "socket.io-client";

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socket = callWebSocket();
  const socketRef = useRef<Socket | null>(null);
  const myKeyPairRef = useRef<RoomKeyPair | null>(null);
  const sharedKeyRef = useRef<Uint8Array | null>(null);
  const encryptedTextByMessageIdRef = useRef<Map<string, string>>(new Map());
  const pendingOwnMessageIdsRef = useRef<string[]>([]);
  const joinedPeerRef = useRef<string | null>(null);
  const announcedPeerRef = useRef<string | null>(null);

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
    socketRef.current = socket ?? null;

    const cancelledRef = { current: false };

    const joinRoom = () => {
      if (!socket?.connected || !peerWsId) return;
      if (joinedPeerRef.current === peerWsId) return;

      socket.emit("joinRoom", { peerId: peerWsId });
      joinedPeerRef.current = peerWsId;
    };

    const announceMyPublicKey = () => {
      if (!socket?.connected || !peerWsId || !myKeyPairRef.current) return;
      if (announcedPeerRef.current === peerWsId) return;

      socket.emit("e2ee:publicKey", {
        publicKey: exportPublicKey(myKeyPairRef.current.publicKey),
      });
      socket.emit("e2ee:requestPeerPublicKey");

      announcedPeerRef.current = peerWsId;
    };

    const syncRoom = () => {
      joinRoom();
      announceMyPublicKey();
    };

    const handleConnect = () => {
      console.log("WS connected:", socket?.id);
      syncRoom();
    };

    const handleDisconnect = () => {
      joinedPeerRef.current = null;
      announcedPeerRef.current = null;
      setOnlineUsers(new Set());
    };

    const handleConnectError = (err: unknown) => {
      console.error("WS connect_error:", err);
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
      if (!peerWsId || payload.userId !== peerWsId || !payload.publicKey || !myKeyPairRef.current) return;

      const peerPublicKey = importPublicKey(payload.publicKey);
      await setStoredPeerPublicKey(peerWsId, peerPublicKey);

      sharedKeyRef.current = deriveSharedRoomKey(
        myKeyPairRef.current.secretKey,
        peerPublicKey
      );

      rehydrateMessages();
    };

    const init = async () => {
      await waitForSodium();
      if (cancelledRef.current) return;
      const keyPair = await ensureRoomKeyPair();
      if (cancelledRef.current) return;

      myKeyPairRef.current = keyPair;

      if (peerWsId) {
        const storedPeerPublicKey = await getStoredPeerPublicKey(peerWsId);
        if (cancelledRef.current) return;

        if (storedPeerPublicKey) {
          sharedKeyRef.current = deriveSharedRoomKey(
            keyPair.secretKey,
            storedPeerPublicKey
          );
        }
      }

      if (socket?.connected) {
        syncRoom();
      }
    };

    socket?.on("connect", handleConnect);
    socket?.on("disconnect", handleDisconnect);
    socket?.on("connect_error", handleConnectError);
    socket?.on("messagesHistory", handleMessagesHistory);
    socket?.on("newMessage", handleNewMessage);
    socket?.on("messageRemoved", handleMessageRemoved);
    socket?.on("messageUpdated", handleMessageUpdated);
    socket?.on("e2ee:peerPublicKey", handlePeerPublicKey);
    socket?.on("users-online", handleUsersOnline);
    socket?.on("user-status", handleUserStatus);

    void init();

    return () => {
      cancelledRef.current = true;

      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
      socket?.off("connect_error", handleConnectError);
      socket?.off("messagesHistory", handleMessagesHistory);
      socket?.off("newMessage", handleNewMessage);
      socket?.off("messageRemoved", handleMessageRemoved);
      socket?.off("messageUpdated", handleMessageUpdated);
      socket?.off("e2ee:peerPublicKey", handlePeerPublicKey);
      socket?.off("users-online", handleUsersOnline);
      socket?.off("user-status", handleUserStatus);

      socketRef.current = null;
      myKeyPairRef.current = null;
      sharedKeyRef.current = null;
      encryptedTextByMessageIdRef.current.clear();
      pendingOwnMessageIdsRef.current = [];
      joinedPeerRef.current = null;
      announcedPeerRef.current = null;
    };
  }, [
    socket,
    peerWsId,
    handleMessageRemoved,
    handleMessageUpdated,
    handleMessagesHistory,
    handleNewMessage,
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