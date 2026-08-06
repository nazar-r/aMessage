import { io, type Socket } from "socket.io-client";

export class SocketService {
  private static instance: SocketService | null = null;
  private readonly socket: Socket;

  private constructor() {
    this.socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });

    this.socket.on("connect", () => {
      // console.log(`[WS CONNECTED] ${this.socket.id}`);
    });

    this.socket.on("disconnect", () => {
      // console.log(`[WS DISCONNECTED] ${this.socket.id}`);
    });
  }

  connect() {
    if (!this.socket.connected) this.socket.connect();
  }

  disconnect() {
    if (this.socket.connected) this.socket.disconnect();
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.socket.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.socket.off(event, listener);
  }

  emit(event: string, payload?: unknown) {
    if (!this.socket.connected) return;
    this.socket.emit(event, payload);
  }

  static getInstance() {
    if (!this.instance) this.instance = new SocketService();
    return this.instance;
  }

  get connected() {
    return this.socket.connected;
  }
}