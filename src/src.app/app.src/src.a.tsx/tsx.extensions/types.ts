export interface MessagesData {
    messageStatus: "mine" | "got";
    messageId: string;
    content: string;
}

export interface GotMessagesData{
  userId: string;
  messageId: string;
  text: string;
  createdAt: string;
};

export interface RoomConfig {
    userWsId?: string;
    peerWsId: string;
};

export interface UsersData {
    userId: string;
    userName: string;
    userStatus: "Online";
    email?: string;
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

export type ErrorResponse = {
    message: string | string[];
    error?: string;
};

export type ButtonConfig = {
    key: string;
    label: string;
    icon: React.ComponentType;
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

export interface RemovedMessagePayload  {
  messageId: string;
};

export interface NewMessagePayload {
  userId: string;
  text: string;
  messageId: string;
};

export interface MessagesHistoryPayload  {
  messages: GotMessagesData[];
  nextCursor: string | null;
};
