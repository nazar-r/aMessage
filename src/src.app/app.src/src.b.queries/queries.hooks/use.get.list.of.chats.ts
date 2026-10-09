import { useQuery } from "@tanstack/react-query";
import { fetchingUserChats } from "../queries.mutations/get.list.of.chats";
import type { RoomData, ErrorResponse } from "../../src.c.extensions/extentions.types/types";

export const useFetchingUserChats = () => {
    return useQuery<RoomData[], ErrorResponse>({
        queryKey: ["chats"],
        queryFn: async () => {
            const data = await fetchingUserChats();
            return data;
        },
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });
};