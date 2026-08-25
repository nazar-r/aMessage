import { SocketService } from "../socket.a.config/socket.service";

export class ChatSocketService {
  private readonly socket = SocketService.getInstance();

  onChatConnect(ws: any) {
    this.socket.on("connect", ws.onConnect);
    this.socket.on("userStatus", ws.onUserStatus);
    this.socket.on("usersOnline", ws.onUsersOnline);
    this.socket.on("e2ee:peerPublicKey", ws.onPeerPublicKey);
    this.socket.on("messagesHistory", ws.onMessagesHistory);
    this.socket.on("newMessage", ws.onNewMessage);
    this.socket.on("messageRemove", ws.onMessageRemoved);
    this.socket.on("messageUpdate", ws.onMessageUpdated);
  }

  onChatDisconnect(ws: any) {
    this.socket.off("connect", ws.onConnect);
    this.socket.off("userStatus", ws.onUserStatus);
    this.socket.off("usersOnline", ws.onUsersOnline);
    this.socket.off("messageRemove", ws.onMessageRemoved);
    this.socket.off("messagesHistory", ws.onMessagesHistory);
    this.socket.off("newMessage", ws.onNewMessage);
    this.socket.off("messageUpdate", ws.onMessageUpdated);
    this.socket.off("e2ee:peerPublicKey", ws.onPeerPublicKey);
  }

  emit(event: string, payload?: unknown) {
    this.socket.emit(event, payload);
  }

  get connected() {
    return this.socket.connected;
  }
}