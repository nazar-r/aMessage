// use.get.content.api.ts
import { useQuery } from "@tanstack/react-query";
import { fetchingNotes } from "./get.content.api";
import type { notesData, ErrorResponse } from "../types";

export const useFetchingNotes = () => {
    return useQuery<notesData[], ErrorResponse>({
        queryKey: ["notes"],
        queryFn: fetchingNotes,
        staleTime: 1000 * 1,
        cacheTime: 1000 * 60 * 180, 
        retry: 1,
        // refetchOnMount: "always"
    });
};