import { useQuery } from "@tanstack/react-query";
import { fetchingUserChats } from "./get.list.of.chats";
import type { RoomData, ErrorResponse } from "../types";

export const useFetchingUserChats = () => {
    return useQuery<RoomData[], ErrorResponse>({
        queryKey: ["chats"],
        queryFn: fetchingUserChats,
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });

};