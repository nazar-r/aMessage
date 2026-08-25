import { useQuery } from "@tanstack/react-query";
import { fetchingUserChats } from "./get.list.of.chats";
import type { RoomData, ErrorResponse } from "../types";

export const useFetchingUserChats = () => {
    return useQuery<RoomData[], ErrorResponse>({
        queryKey: ["chats"],
        queryFn: async () => {
            const data = await fetchingUserChats();

            // console.log("[fetchingUserChats response]", data);

            return data;
        },
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });
};