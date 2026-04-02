import { useQuery } from "@tanstack/react-query";
import { fetchingUsers } from "./get.users.api";
import type { UsersData, ErrorResponse } from "../types";

export const useFetchingUsers = () => {
    return useQuery<UsersData[], ErrorResponse>({
        queryKey: ["users"],
        queryFn: fetchingUsers,
        staleTime: 1000 * 60 * 60 * 6,
        cacheTime: 1000 * 60 * 60 * 3, 
        retry: 1,
    });
    
};