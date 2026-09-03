import { useQuery } from "@tanstack/react-query";
import { fetchingGemini } from "./get.gemini.history";
import type { ErrorResponse } from "../types";

export const usefetchingGemini = () => {
    return useQuery<any[], ErrorResponse>({
        queryKey: ["searchMessages"],
        queryFn: fetchingGemini,
        staleTime: 1000 * 1,
        gcTime: 1000 * 60 * 60,
        retry: 1,
    });
};