// import { io, Socket } from "socket.io-client";
// import { createContext, useContext, useEffect, useState } from "react";

// const WsContext = createContext<Socket | null>(null);
// const shared = {
//     socket: null as Socket | null,
//     mountedProvidersCount: 0,
//     disconnectTimer: null as ReturnType<typeof setTimeout> | null,
// };

// const setWebSocket = () => shared.socket
//     ?? (shared.socket = io(import.meta.env.VITE_BACKEND_URL, {
//         withCredentials: true,
//         transports: ['websocket'], // має збігатися з transports на сервері
//     }));

// export const LaunchSocketConnection = ({ children }: { children: React.ReactNode }) => {
//     const [socket, setSocket] = useState<Socket | null>(shared.socket);

//     useEffect(() => {
//         shared.mountedProvidersCount += 1;
//         shared.disconnectTimer
//             ? (clearTimeout(shared.disconnectTimer), (shared.disconnectTimer = null))
//             : null;

//         const ws = setWebSocket();
//         setSocket(ws);

//         const handleConnect = () => {
//             console.log("WS connected:", ws.id);
//         };
//         const handleDisconnect = () => {
//             console.log("WS disconnected");
//         };

//         ws.on("connect", handleConnect);
//         ws.on("disconnect", handleDisconnect);

//         return () => {
//             ws.off("connect", handleConnect);
//             ws.off("disconnect", handleDisconnect);

//             shared.mountedProvidersCount -= 1;
//             shared.mountedProvidersCount <= 0
//                 ? ((shared.mountedProvidersCount = 0),
//                     (shared.disconnectTimer = setTimeout(() => {
//                         shared.mountedProvidersCount === 0 && shared.socket
//                             ? (shared.socket.disconnect(), (shared.socket = null))
//                             : null;
//                     }, 0)))
//                 : null;
//         };
//     }, []);

//     return <WsContext.Provider value={socket}>{children}</WsContext.Provider>;
// };

// export const callWebSocket = () => useContext(WsContext);