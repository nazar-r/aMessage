import sodium from "libsodium-wrappers";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import type { RemovedMessagePayload, NewMessagePayload, MessagesHistoryPayload, RoomConfig, MessagesData, KeyPair,EncryptedMessage} from "../src.a.tsx/tsx.extensions/types";

const MY_KEYPAIR_STORAGE = "chat:my-keypair";
const isBrowser = typeof window !== "undefined";
const peerPubKeyStorageKey = (peerWsId: string) => `chat:peer-pub:${peerWsId}`;

const storageGet = (key: string) => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(key);
};

const storageSet = (key: string, value: string) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, value);
};

export const initSodium = async () => {
  await sodium.ready;
};

const encodeKeyPair = (keyPair: KeyPair) =>
  JSON.stringify({
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey),
  });

const decodeKeyPair = (raw: string): KeyPair | null => {
  try {
    const parsed = JSON.parse(raw) as {
      publicKey: string;
      privateKey: string;
    };

    if (!parsed.publicKey || !parsed.privateKey) return null;

    return {
      publicKey: sodium.from_base64(parsed.publicKey),
      privateKey: sodium.from_base64(parsed.privateKey),
    };
  } catch {
    return null;
  }
};

export const generateKeyPair = (): KeyPair => {
  const keyPair = sodium.crypto_box_keypair();
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
};

export const loadOrCreateMyKeyPair = (): KeyPair => {
  const saved = storageGet(MY_KEYPAIR_STORAGE);
  if (saved) {
    const decoded = decodeKeyPair(saved);
    if (decoded) return decoded;
  }

  const fresh = generateKeyPair();
  storageSet(MY_KEYPAIR_STORAGE, encodeKeyPair(fresh));
  return fresh;
};

export const savePeerPublicKey = (peerWsId: string, publicKeyBase64: string) => {
  storageSet(peerPubKeyStorageKey(peerWsId), publicKeyBase64);
};

export const getPeerPublicKey = (peerWsId: string): Uint8Array | null => {
  const raw = storageGet(peerPubKeyStorageKey(peerWsId));
  if (!raw) return null;

  try {
    return sodium.from_base64(raw);
  } catch {
    return null;
  }
};

export const encryptMessage = (
  message: string,
  receiverPublicKey: Uint8Array,
  senderKeyPair: KeyPair
): EncryptedMessage => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const messageBytes = sodium.from_string(message);
  const cipher = sodium.crypto_box_easy(
    messageBytes,
    nonce,
    receiverPublicKey,
    senderKeyPair.privateKey
  );

  return {
    cipher: sodium.to_base64(cipher),
    nonce: sodium.to_base64(nonce),
    senderPublicKey: sodium.to_base64(senderKeyPair.publicKey),
  };
};

export const decryptMessage = (
  encrypted: EncryptedMessage,
  receiverPrivateKey: Uint8Array,
  senderPublicKey: Uint8Array
): string => {
  const cipher = sodium.from_base64(encrypted.cipher);
  const nonce = sodium.from_base64(encrypted.nonce);
  const decrypted = sodium.crypto_box_open_easy(
    cipher,
    nonce,
    senderPublicKey,
    receiverPrivateKey
  );

  return sodium.to_string(decrypted);
};

const tryParseEncryptedPayload = (text: string): EncryptedMessage | null => {
  try {
    const parsed = JSON.parse(text) as Partial<EncryptedMessage>;
    if (!parsed.cipher || !parsed.nonce || !parsed.senderPublicKey) return null;

    return {
      cipher: parsed.cipher,
      nonce: parsed.nonce,
      senderPublicKey: parsed.senderPublicKey,
    };
  } catch {
    return null;
  }
};

const decodeIncomingText = (
  text: string,
  myPrivateKey: Uint8Array
): string => {
  const payload = tryParseEncryptedPayload(text);
  if (!payload) return text;

  try {
    return decryptMessage(
      payload,
      myPrivateKey,
      sodium.from_base64(payload.senderPublicKey)
    );
  } catch {
    return text;
  }
};

const encodeOutgoingText = (
  plainText: string,
  peerPublicKey: Uint8Array | null,
  myKeyPair: KeyPair | null
): string => {
  if (!peerPublicKey || !myKeyPair) {
    return plainText;
  }

  const encrypted = encryptMessage(plainText, peerPublicKey, myKeyPair);
  return JSON.stringify(encrypted);
};

export const useOneOnOneRoom = ({ peerWsId }: RoomConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const myKeyPairRef = useRef<KeyPair | null>(null);

  const [messages, setMessages] = useState<MessagesData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const roomId = peerWsId ? `room-with-${peerWsId}` : "";

  useEffect(() => {
    if (!peerWsId || socketRef.current) return;

    let alive = true;

    const bootstrap = async () => {
      await initSodium();
      if (!alive) return;

      const myKeyPair = loadOrCreateMyKeyPair();
      myKeyPairRef.current = myKeyPair;

      const s = io("http://localhost:3001", {
        withCredentials: true,
        query: { peerId: peerWsId },
      });

      socketRef.current = s;

      const handleMessagesHistory = ({
        messages: msgs,
        nextCursor,
      }: MessagesHistoryPayload) => {
        const formattedMessages: MessagesData[] = msgs.map((msg) => ({
          messageStatus: msg.userId === peerWsId ? "got" : "mine",
          messageId: msg.messageId,
          content: decodeIncomingText(msg.text, myKeyPair.privateKey),
        }));

        setMessages(formattedMessages);
        setCursor(nextCursor);
      };

      const handleNewMessage = (msg: NewMessagePayload) => {
        const receivedMessage: MessagesData = {
          messageStatus: msg.userId === peerWsId ? "got" : "mine",
          messageId: msg.messageId,
          content: decodeIncomingText(msg.text, myKeyPair.privateKey),
        };

        setMessages((prev) => [...prev, receivedMessage]);
      };

      const handleMessageRemoved = ({ messageId }: RemovedMessagePayload) => {
        setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
      };

      const handleMessageUpdated = (msg: NewMessagePayload) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === msg.messageId
              ? {
                  ...m,
                  content: decodeIncomingText(msg.text, myKeyPair.privateKey),
                }
              : m
          )
        );
      };

      s.on("connect", () => console.log("WS connected:", s.id));
      s.on("connect_error", (err) => console.error("WS connect_error:", err));
      s.on("messagesHistory", handleMessagesHistory);
      s.on("newMessage", handleNewMessage);
      s.on("messageRemoved", handleMessageRemoved);
      s.on("messageUpdated", handleMessageUpdated);

      return () => {
        s.off("connect");
        s.off("connect_error");
        s.off("messagesHistory", handleMessagesHistory);
        s.off("newMessage", handleNewMessage);
        s.off("messageRemoved", handleMessageRemoved);
        s.off("messageUpdated", handleMessageUpdated);
        s.disconnect();
        socketRef.current = null;
      };
    };

    let cleanup: (() => void) | undefined;

    bootstrap().then((maybeCleanup) => {
      cleanup = maybeCleanup;
    });

    return () => {
      alive = false;
      cleanup?.();
      socketRef.current = null;
    };
  }, [peerWsId]);

  const sendMessage = (message: MessagesData) => {
    const socket = socketRef.current;
    if (!socket) return;

    const peerPublicKey = getPeerPublicKey(peerWsId);
    const myKeyPair = myKeyPairRef.current;

    const payloadText = encodeOutgoingText(
      message.content,
      peerPublicKey,
      myKeyPair
    );

    socket.emit("message", { text: payloadText });
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
    if (!socket) return;

    const peerPublicKey = getPeerPublicKey(peerWsId);
    const myKeyPair = myKeyPairRef.current;

    const payloadText = encodeOutgoingText(
      newContent,
      peerPublicKey,
      myKeyPair
    );

    setMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === messageId ? { ...msg, content: newContent } : msg
      )
    );

    socket.emit("updateMessage", { messageId, text: payloadText });
  };

  return {
    roomId,
    sendMessage,
    removeMessage,
    updateMessage,
    messages,
    socket: socketRef.current,
    cursor,
  };
};