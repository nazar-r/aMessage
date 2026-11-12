import { SocketService } from "../socket.a.connection/socket.connection";

export class ChatSocketService {
  private readonly socket = SocketService.getInstance();

  onChatConnect(ws: any) {
    this.socket.on("messagesHistory", ws.onMessagesHistory);
    this.socket.on("newMessage", ws.onNewMessage);
    this.socket.on("messageUpdate", ws.onMessageUpdated);
    this.socket.on("messageRemove", ws.onMessageRemoved);
    this.socket.on("e2ee:peerPublicKey", ws.onPeerPublicKey);
  }

  onChatDisconnect(ws: any) {
    this.socket.off("messagesHistory", ws.onMessagesHistory);
    this.socket.off("newMessage", ws.onNewMessage);
    this.socket.off("messageUpdate", ws.onMessageUpdated);
    this.socket.off("messageRemove", ws.onMessageRemoved);
    this.socket.off("e2ee:peerPublicKey", ws.onPeerPublicKey);
  }

  emit(event: string, payload?: unknown) {
    this.socket.emit(event, payload);
  }

  get connected() {
    return this.socket.connected;
  }
}