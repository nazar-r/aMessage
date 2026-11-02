import { useQuery } from "@tanstack/react-query";
import { fetchingUserChats } from "../queries.mutations/get.chats.list";
import type { ChatsData } from "../../src.c.extensions/extentions.types/types";

export const useFetchingUserChats = () => {
    return useQuery<ChatsData[]>({
        queryKey: ["chats"],
        queryFn: fetchingUserChats,
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });
};