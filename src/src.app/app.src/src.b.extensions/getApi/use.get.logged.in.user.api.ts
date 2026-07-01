import { useQuery } from "@tanstack/react-query";
import { fetchingLoggedInUser } from "./get.logged.in.user.api";
import type { MessagesData, ErrorResponse } from "../types";

export const useFetchingLoggedInUser = () => {
    return useQuery<MessagesData[], ErrorResponse>({
        queryKey: ["userImage"],
        queryFn: fetchingLoggedInUser,
        staleTime: 1000 * 1,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });
};