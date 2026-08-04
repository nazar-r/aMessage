import type { RefObject } from "react";
import type { Socket } from "socket.io-client";

export interface MessageInterface {
  messageStatus: "mine" | "got";
  messageId: string;
  content: string;
  createdAt?: string;
}

export interface MessagesHistory {
  messages: NewMessagePayload[];
  nextCursor: string | null;
};

export interface SocketUserStatus {
  userId: string;
  status: "online" | "offline";
}

export interface RoomConfig {
  userWsId?: string;
  peerWsId?: string;
};

export type RoomKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export type UseOneOnOneRoomQueryArgs = RoomConfig & {
  onCursorChange: (cursor: string | null) => void;
  socketRef: RefObject<Socket | null>;
  myKeyPairRef: RefObject<RoomKeyPair | null>;
  sharedKeyRef: RefObject<Uint8Array | null>;
  encryptedTextByMessageIdRef: RefObject<Map<string, string>>;
  pendingOwnMessageIdsRef: RefObject<string[]>;
};
export interface UsersData {
  user?: any;
  userId: string;
  userName: string;
  userStatus: string;
  isContact?: boolean;
  email?: string;
}

export interface RoomData {
  roomId: string;
  // participants: UsersData[];
  userId: string;
  userName: string;
  isContact?: boolean;
}

export interface SharedTextContextType {
  text: string;
  setText: (value: string) => void;
}

export type AuthToken = {
  token: string
};

export type ContextType = {
  prev: any;
};

export type SocketUser = {
  userId: string;
  status: "online" | "offline";
};

export type ErrorResponse = {
  message: string | string[];
  error?: string;
};

export type ButtonConfig = {
  key: string;
  label: string;
}

export type UserContact = {
  userContactId: string;
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedMessage {
  cipher: string;
  nonce: string;
  senderPublicKey: string;
}

export interface Message {
  text: string;
  encrypted?: EncryptedMessage;
}

export type MenuProps = {
  scrollRef: RefObject<HTMLUListElement | null>;
};

export interface RemovedMessagePayload {
  messageId: string;
};

export interface NewMessagePayload {
  userId: string;
  text: string;
  messageId: string;
};

export interface E2EEPeerPublicKeyPayload {
  userId: string;
  publicKey: string | null;
};

export interface SendMessageVariables {
  content: string;
  tempId: string;
}