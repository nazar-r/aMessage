import { io, Socket } from 'socket.io-client';

const socket: Socket = io('https://api.amessage.site', {
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
});
