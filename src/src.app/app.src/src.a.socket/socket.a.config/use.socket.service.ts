import { useEffect, useMemo } from "react";
import { SocketService } from "./socket.service";

export const useSocketService = () => {
  const socketService = useMemo(() => SocketService.getInstance(), []);

  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, [socketService]);

  return socketService;
};