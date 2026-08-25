import { useQuery, useQueryClient } from "@tanstack/react-query";

export const ONLINE_USERS_QUERY_KEY = ["onlineUsers"];

export const useOnlineUsersQuery = () => {
  return useQuery<string[]>({
    queryKey: ONLINE_USERS_QUERY_KEY,
    queryFn: async () => [],
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: false,
  });
};

export const useOnlineUsersCache = () => {
  const queryClient = useQueryClient();

  const setOnlineUsers = (users: string[]) => {
    queryClient.setQueryData<string[]>(
      ONLINE_USERS_QUERY_KEY,
      users,
    );
  };

  return {
    setOnlineUsers,
  };
};