import { useQuery } from "@tanstack/react-query";
import { fetchingLoggedInUser } from "../queries.mutations/get.logged.in.user.api";
import type { ErrorResponse } from "../../src.c.extensions/extentions.types/types";

export const useFetchingLoggedInUser = () => {
    return useQuery<any[], ErrorResponse>({
        queryKey: ["userImage"],
        queryFn: fetchingLoggedInUser,
        staleTime: 1000 * 1,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });
};