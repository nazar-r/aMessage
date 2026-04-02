import { useQuery } from "@tanstack/react-query";
import { fetchingMessages } from "./get.messages.api";
import type { MessagesData, ErrorResponse } from "../types";

export const useFetchingMessages = () => {
    return useQuery<MessagesData[], ErrorResponse>({
        queryKey: ["messages"],
        queryFn: fetchingMessages,
        staleTime: 1000 * 1,
        cacheTime: 1000 * 60 * 180, 
        retry: 1,
    });
};