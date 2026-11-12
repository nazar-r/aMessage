import { SocketService } from "./socket.connection";
import { useEffect, useMemo } from "react";
import { useOnlineUsersCache } from "../../src.b.queries/queries.hooks/use.socket.service.query";

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