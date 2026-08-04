export interface MessageInterface {
    messageStatus: "mine" | "got";
    messageId: string;
    content: string;
    createdAt?: string;
}

export interface MessagesHistory {
    messages: MessageInterface[];
    nextCursor: string | null;
};

export interface SocketEvents {
    onConnect: () => void;
    onDisconnect: (reason: string) => void;
    onConnectError: (err: Error) => void;
    onMessagesHistory: (payload: MessagesHistory) => void;
    onNewMessage: (payload: MessageInterface) => void;
    onMessageRemoved: (payload: string) => void;
    onMessageUpdated: (payload: MessageInterface) => void;
    onPeerPublicKey: (payload: E2EEPeerPublicKeyPayload) => void;
};

export interface SocketPresence {
    onUsersOnline: (payload: any) => void;
    onUserStatus: (payload: any) => void;
};

export interface SocketUserStatus {
    userId: string;
    status: "online" | "offline";
}

export type RoomConfig = {
    userWsId?: string;
    peerWsId?: string;
};

export type RoomKeyPair = {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
};

export type EncryptedMessage = {
    cipher: string;
    nonce: string;
    senderPublicKey: string;
}

export type E2EEPeerPublicKeyPayload = {
    userId: string;
    publicKey: string | null;
};
