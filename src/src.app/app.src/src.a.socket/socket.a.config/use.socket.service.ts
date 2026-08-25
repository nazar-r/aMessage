import { useEffect, useMemo } from "react";
import { SocketService } from "./socket.service";
import { useOnlineUsersCache } from "./use.socket.service.query";

export const useSocketService = () => {
  const socketService = useMemo(
    () => SocketService.getInstance(),
    [],
  );

  const { setOnlineUsers } = useOnlineUsersCache();

  useEffect(() => {
    const handleUsersOnline = (users: string[]) => {
      setOnlineUsers(users);
    };

    socketService.onUsersOnline(handleUsersOnline);
    socketService.connect();

    return () => {
      socketService.offUsersOnline(handleUsersOnline);
      socketService.disconnect();
    };
  }, [socketService, setOnlineUsers]);

  return socketService;
};