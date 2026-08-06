import { ChatSocketService } from "./chats.a.socket.service";
import { ChatEncryptionService } from "./chats.a.crypto.service";
import type { E2EEPeerPublicKeyPayload } from "../../src.b.extensions/types";
import type { MessageInterface } from "../../src.b.extensions/chats.types";

export class ChatAdapter {
  private readonly useEncryption: ChatEncryptionService;
  private readonly useSocket: ChatSocketService;
  private readonly pendingTempIds: string[] = [];
  private destroyed = false;

  private newMessageCallback: any = null;
  private messageSavedCallback: any = null;
  private messageRemoveCallback: any = null;
  private messageUpdateCallback: any = null;
  private messagesHistoryCallback: any = null;
  private userStatusCallback: any = null;
  private usersOnlineCallback: any = null;
  private userJoinedCallback: any = null;

  private readonly ws: any = {
    onConnect: () => this.connectSocket(),
    onDisconnect: () => this.disconnectSocket(),
    onConnectError: (err: unknown) => this.connectSocketError(err),
    onNewMessage: (payload: any) => this.getNewMessage(payload),
    onMessageSaved: (payload: any) => this.getMessageSaved(payload),
    onMessageUpdated: (payload: any) => this.getMessageUpdate(payload),
    onMessageRemoved: (payload: any) => this.getMessageRemove(payload),
    onMessagesHistory: (payload: any) => this.getMessagesHistory(payload),
    onPeerPublicKey: (payload: E2EEPeerPublicKeyPayload) => this.getUserPublicKey(payload),
    onUserStatus: (payload: any) => this.getUserStatus(payload),
    onUsersOnline: (payload: any) => this.getUsersOnline(payload),
    onUserJoined: (payload: any) => this.getUserJoined(payload),
  };

  constructor(
    private readonly peerWsId: string,
  ) {
    this.useEncryption = new ChatEncryptionService(peerWsId);
    this.useSocket = new ChatSocketService();

    this.useSocket.onChatConnect(this.ws);
  }

  async init() {
    await this.useEncryption.init();

    if (this.destroyed) return;
    if (this.useSocket.connected) this.syncRoom()
  }

  destroy() {
    this.useSocket.onChatDisconnect(this.ws);
    this.useEncryption.clear();
    this.pendingTempIds.length = 0;
    
    this.destroyed = true;
    this.newMessageCallback = null;
    this.messageSavedCallback = null;
    this.messageRemoveCallback = null;
    this.messageUpdateCallback = null;
    this.messagesHistoryCallback = null;
    this.userStatusCallback = null;
    this.usersOnlineCallback = null;
    this.userJoinedCallback = null;
  }

  sendMessage(message: MessageInterface, tempId: string) {
    const encryptedText = this.useEncryption.encryptRoomText(message.content);

    this.useEncryption.cacheEncryptedText(tempId, encryptedText);

    this.useSocket.emit("newMessage", {
      text: encryptedText,
      clientMessageId: tempId,
    });
  }

  updateMessage(message: MessageInterface) {
    const encryptedText = this.useEncryption.encryptRoomText(message.content);

    this.useEncryption.cacheEncryptedText(message.messageId, encryptedText);

    this.useSocket.emit("messageUpdate", {
      messageId: message.messageId,
      text: encryptedText,
    });
  }

  deleteMessage(messageId: string) {
    this.useEncryption.removeCachedEncryptedText(messageId);

    this.useSocket.emit("messageRemove", {
      messageId,
    });
  }

  loadNextMessages(cursor?: string | null) {
    this.useSocket.emit("messagesHistory", {
      cursor,
    });
  }

  addPendingTempId(tempId: string) {
    this.pendingTempIds.push(tempId);
  }

  setNewMessageCallback(callback: any) {
    this.newMessageCallback = callback;
  }

  setMessageSavedCallback(callback: any) {
    this.messageSavedCallback = callback;
  }

  setMessageRemoveCallback(callback: any) {
    this.messageRemoveCallback = callback;
  }

  setMessageUpdateCallback(callback: any) {
    this.messageUpdateCallback = callback;
  }

  setMessagesHistoryCallback(callback: any) {
    this.messagesHistoryCallback = callback;
  }

  setUserStatusCallback(callback: any) {
    this.userStatusCallback = callback;
  }

  setUsersOnlineCallback(callback: any) {
    this.usersOnlineCallback = callback;
  }

  setUserJoinedCallback(callback: any) {
    this.userJoinedCallback = callback;
  }

  rehydrateMessages(messages: MessageInterface[]) {
    return this.useEncryption.rehydrateMessages(messages);
  }

  takeMyPublicKey() {
    return this.useEncryption.getPublicKey();
  }

  isReady() {
    return this.useEncryption.isReady();
  }

  private syncRoom() {
    if (!this.useSocket.connected || !this.useEncryption.getPublicKey()) return;

    this.useSocket.emit("joinRoom", { peerId: this.peerWsId });
    this.useSocket.emit("e2ee:publicKey", { publicKey: this.useEncryption.getPublicKey() });
  }

  private connectSocket() {
    this.syncRoom();
  }

  private disconnectSocket() { }

  private connectSocketError(err: unknown) {
    console.error(err);
  }

  private getNewMessage(payload: any) {
    if (this.pendingTempIds.includes(payload.messageId)) return;

    this.useEncryption.cacheEncryptedText(payload.messageId, payload.text);

    this.newMessageCallback?.(
      this.decryptMessageContent(payload),
    );
  }

  private getMessageSaved(payload: any) {
    this.useEncryption.cacheEncryptedText(payload.messageId, payload.text);
    this.removePendingTempId(payload.tempMessageId);

    this.messageSavedCallback?.({
      ...this.decryptMessageContent(payload),
      tempMessageId: payload.tempMessageId,
    });
  }

  private getMessageUpdate(payload: any) {
    this.useEncryption.cacheEncryptedText(payload.messageId, payload.text);

    this.messageUpdateCallback?.(
      this.decryptMessageContent(payload),
    );
  }

  private getMessageRemove(payload: any) {
    this.useEncryption.removeCachedEncryptedText(payload.messageId);
    this.removePendingTempId(payload.messageId);

    this.messageRemoveCallback?.(payload.messageId);
  }

  private getMessagesHistory(payload: any) {
    const messages = payload.messages.map((message: any) => {
      this.useEncryption.cacheEncryptedText(message.messageId, message.text);

      return this.decryptMessageContent(message);
    });

    this.messagesHistoryCallback?.(messages, payload.nextCursor);
  }

  private getUserPublicKey(payload: E2EEPeerPublicKeyPayload) {
    this.useEncryption.receivePeerPublicKey(payload);
    console.log("Received peer public key:", payload);
  }

  private getUserStatus(payload: any) {
    this.userStatusCallback?.(payload);
  }

  private getUsersOnline(payload: any) {
    this.usersOnlineCallback?.(payload);
  }

  private getUserJoined(payload: any) {
    this.userJoinedCallback?.(payload);
  }

  private removePendingTempId(tempId: string) {
    const index = this.pendingTempIds.indexOf(tempId);

    if (index !== -1) {
      this.pendingTempIds.splice(index, 1);
    }
  }

  private decryptMessageContent(payload: any) {
    const createdAt = payload.time ?? payload.createdAt;

    return {
      userId: payload.userId,
      messageId: payload.messageId,
      content: this.useEncryption.decryptRoomText(payload.text),
      messageStatus: payload.userId === this.peerWsId ? "got" : "mine",
      ...(createdAt !== undefined ? { createdAt } : {}),
      ...(payload.pending !== undefined ? { pending: payload.pending } : {}),
    };
  }
}