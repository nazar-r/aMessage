import { io, type Socket } from "socket.io-client";

export type OnlineUsersListener = (users: string[]) => void;

export class SocketService {
  private static instance: SocketService | null = null;
  private readonly socket: Socket;

  private constructor() {
    this.socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });

    this.socket.on("connect", () => {});

    this.socket.on("disconnect", () => {});
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.socket.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.socket.off(event, listener);
  }

  onUsersOnline(listener: OnlineUsersListener) {
    this.socket.on("usersOnline", listener);
  }

  offUsersOnline(listener: OnlineUsersListener) {
    this.socket.off("usersOnline", listener);
  }

  emit(event: string, payload?: unknown) {
    if (!this.socket.connected) return;

    this.socket.emit(event, payload);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SocketService();
    }

    return this.instance;
  }

  get connected() {
    return this.socket.connected;
  }
}