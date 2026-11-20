import { ChatSocketService } from "./socket.chats.events";
import { ChatEncryptionService } from "../../src.c.encryption/encryption.service";
import type { MessageInterface } from "../../src.c.extensions/extentions.types/chats.types";
import type { E2EEPeerPublicKeyPayload } from "../../src.c.extensions/extentions.types/types";

export class ChatAdapter {
  private readonly useEncryption: ChatEncryptionService;
  private readonly useSocket: ChatSocketService;

  private destroyed = false;
  private newMessageCallback: any = null;
  private messageRemoveCallback: any = null;
  private messageUpdateCallback: any = null;
  private messagesHistoryCallback: any = null;

  constructor(private readonly peerWsId: string) {
    this.useEncryption = new ChatEncryptionService(peerWsId);
    this.useSocket = new ChatSocketService();
    this.useSocket.onChatConnect(this.ws);
  }

  private readonly ws: any = {
    onConnect: () => this.syncRoom(),
    onDisconnect: () => { },
    onConnectError: (err: unknown) => console.error(err),
    onNewMessage: (payload: any) => this.getNewMessage(payload),
    onMessageUpdated: (payload: any) => this.getMessageUpdate(payload),
    onMessageRemoved: (payload: any) => this.getMessageRemove(payload),
    onMessagesHistory: (payload: any) => this.getMessagesHistory(payload),
    onPeerPublicKey: (payload: E2EEPeerPublicKeyPayload) => this.useEncryption.receivePeerPublicKey(payload),
  };

  setNewMessageCallback(callback: any) { this.newMessageCallback = callback; }
  setMessageRemoveCallback(callback: any) { this.messageRemoveCallback = callback; }
  setMessageUpdateCallback(callback: any) { this.messageUpdateCallback = callback; }
  setMessagesHistoryCallback(callback: any) { this.messagesHistoryCallback = callback; }

  destroy() {
    this.useSocket.onChatDisconnect(this.ws);
    this.useEncryption.clear();

    this.destroyed = true;
    this.newMessageCallback = null;
    this.messageRemoveCallback = null;
    this.messageUpdateCallback = null;
    this.messagesHistoryCallback = null;
  }

  async init() {
    await this.useEncryption.init();
    if (!this.destroyed) this.syncRoom();
  }

  rehydrateMessages(messages: MessageInterface[]) {
    return this.useEncryption.rehydrateMessages(messages);
  }

  takeMyPublicKey() {
    return this.useEncryption.getPublicKey();
  }

  private syncRoom() {
    const publicKey = this.useEncryption.getPublicKey();
    if (!this.useSocket.connected || !publicKey) return;

    this.useSocket.emit("joinRoom", { peerId: this.peerWsId });
  }

  sendMessage(message: MessageInterface, tempId: string) {
    const encryptedText = this.useEncryption.encryptRoomText(message.content);
    this.useEncryption.cacheEncryptedText(tempId, encryptedText);

    this.useSocket.emit("newMessage", {
      text: encryptedText,
      clientMessageId: tempId,
      peerId: this.peerWsId,
    });
  }

  updateMessage(message: MessageInterface) {
    const encryptedText = this.useEncryption.encryptRoomText(message.content);
    this.useEncryption.cacheEncryptedText(message.messageId, encryptedText);

    this.useSocket.emit("messageUpdate", {
      messageId: message.messageId,
      text: encryptedText,
      peerId: this.peerWsId,
    });
  }

  deleteMessage(messageId: string) {
    this.useEncryption.removeCachedEncryptedText(messageId);

    this.useSocket.emit("messageRemove", {
      messageId,
      peerId: this.peerWsId,
    });
  }

  private getNewMessage(payload: any) {
    this.useEncryption.cacheEncryptedText(payload.messageId, payload.text);
    this.newMessageCallback?.(this.decryptMessageContent(payload));
  }

  private getMessageUpdate(payload: any) {
    this.useEncryption.cacheEncryptedText(payload.messageId, payload.text);
    this.messageUpdateCallback?.(this.decryptMessageContent(payload));
  }

  private getMessageRemove(payload: any) {
    this.useEncryption.removeCachedEncryptedText(payload.messageId);
    this.messageRemoveCallback?.(payload.messageId);
  }

  private getMessagesHistory(payload: any) {
    const messages = payload.messages.map((message: any) => {
      this.useEncryption.cacheEncryptedText(message.messageId, message.text);
      return this.decryptMessageContent(message);
    });

    this.messagesHistoryCallback?.(messages, payload.nextCursor);
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