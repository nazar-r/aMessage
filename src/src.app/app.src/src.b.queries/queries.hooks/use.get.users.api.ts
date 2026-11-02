import { useQuery } from "@tanstack/react-query";
import { fetchingUsers } from "../queries.mutations/get.users.list";
import type { UsersData } from "../../src.c.extensions/extentions.types/types";

export const useFetchingUsers = () => {
    return useQuery<UsersData[]>({
        queryKey: ["users"],
        queryFn: fetchingUsers,
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 3,
        retry: 1,
    });
};