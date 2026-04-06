import { io, Socket } from 'socket.io-client';

const socket: Socket = io('https://amessage-bi0d.onrender.com', {
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
});
